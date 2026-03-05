import re
import os
from pathlib import Path

# Define the markers to search for to identify dialogue
SPEAKERS = [
    "Gurudev", "Gurudeb", "Devotee", "Disciple", "Host", "Narrator", 
    "Guru Shyama Khyapa", "Korda", "Dr. Sujeeb Kar", "Secret Seeker",
    "Speaker", "Shyama Khyapa", "Gurudev Shyama Khyapa"
]

SPEAKER_PATTERN = r'^\*\*([\w\s]+):\*\*\s*(.*)'

def convert_content(content):
    """
    Converts markdown-style dialogue into the golden-bracket HTML format.
    Also wraps the entire transcript in a transcript-container if it's not already.
    """
    lines = content.split('\n')
    new_lines = []
    transcript_started = False
    
    i = 0
    while i < len(lines):
        line_raw = lines[i]
        line = line_raw.strip()
        
    i = 0
    while i < len(lines):
        line_raw = lines[i]
        line = line_raw.strip()
        
    i = 0
    while i < len(lines):
        line_raw = lines[i]
        line = line_raw.strip()
        
        # Match speaker line: **Speaker:** Text or <p><strong>Speaker:</strong> Text
        match = re.search(r'\*\*(.*?):\*\*\s*(.*)', line)
        if not match:
             # Match <strong>Speaker:</strong> Text (inside <p>)
             match = re.search(r'<strong>(.*?):\s*</strong>\s*(.*)', line)
        if not match:
             # Match <p><strong>Speaker:</strong> Text
             match = re.search(r'<p><strong>(.*?):\s*</strong>\s*(.*)', line)
        if not match:
             # Match **Speaker:** (on its own line or with text)
             match = re.search(r'\*\*(.*?):\*\*(.*)', line)
        
        # Special case for lines that are just <p><strong>Speaker:</strong></p>
        if not match:
             match = re.search(r'<p><strong>(.*?):\s*</strong></p>', line)
             
        if match:
            speaker_candidate = match.group(1).strip()
            # If match had 2 groups, get the second one
            text_candidate = match.group(2).strip() if match.lastindex >= 2 else ""
            
            # Clean up speaker/text
            speaker_clean = re.sub(r'<[^>]+>', '', speaker_candidate).strip()
            text_clean = re.sub(r'</p>$', '', text_candidate).strip()
            
            # Check if it's a known speaker
            is_known = any(s.lower() in speaker_clean.lower() for s in SPEAKERS)
            
            if is_known or speaker_clean in SPEAKERS:
                # Start transcript container if not already started
                if not transcript_started:
                    # check if we are already in one
                    if '<div class="transcript-container"' not in content:
                        new_lines.append('<div class="transcript-container" style="background:rgba(45,15,24,0.4);border:1px solid var(--border-gold);padding:2.5rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin-bottom:2rem;">\n')
                    transcript_started = True
                
                # If text is empty, check next line
                if not text_clean and i + 1 < len(lines):
                    next_line = lines[i+1].strip()
                    if next_line:
                        text_clean = re.sub(r'<[^>]+>', '', next_line).strip()
                        i += 1 # skip next line
                
                # Create speaker block
                block = f'''<div class="speaker-block" style="margin-bottom:2rem;border-left:3px solid var(--accent-color);padding-left:1.5rem;">
<span class="speaker-name" style="font-weight:700;color:var(--accent-bright);margin-right:0.5rem;text-transform:uppercase;letter-spacing:1px;font-size:1rem;">{speaker_clean}:</span>
<span class="speech-text" style="display:block;margin-top:0.5rem;">{text_clean}</span>
</div>'''
                new_lines.append(block)
                i += 1
                continue
        
        # Handle stage directions
        if (line.startswith('(_') or line.startswith('*(') or line.startswith('(') or (line.startswith('<p><em>(') and '</em></p>' in line)) and not line.startswith('<div'):
             clean_text = line.replace('<p>', '').replace('</p>', '').replace('<em>', '').replace('</em>', '').strip('()_* ')
             if clean_text:
                if not transcript_started:
                    new_lines.append('<div class="transcript-container" style="background:rgba(45,15,24,0.4);border:1px solid var(--border-gold);padding:2.5rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin-bottom:2rem;">\n')
                    transcript_started = True
                new_lines.append(f'<p><em>({clean_text})</em></p>')
             else:
                new_lines.append(line_raw)
        elif 'class="transcript-container"' in line:
            transcript_started = True
            new_lines.append(line_raw)
        else:
            new_lines.append(line_raw)
        
        i += 1
        
    # Close transcript container if it was started and not closed
    if transcript_started:
        last_str = "".join(new_lines[-3:])
        if '</div>' not in last_str:
            new_lines.append('</div>')
            
    return '\n'.join(new_lines)

def process_file(filepath):
    print(f"Checking {filepath.name}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Heuristic: does it look like a dialogue?
    # Count occurrences of **Speaker:**
    matches = re.findall(r'\*\*(?:' + '|'.join(SPEAKERS) + r'):\*\*', content)
    
    if len(matches) > 2: # At least 3 speaker turns
        if 'class="speaker-block"' in content:
            print(f"  Skipping {filepath.name} - already has speaker blocks.")
            return False
            
        print(f"  Converting {filepath.name}...")
        new_content = convert_content(content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

if __name__ == "__main__":
    articles_dir = Path("articles")
    count = 0
    for file in articles_dir.glob("*.md"):
        if process_file(file):
            count += 1
    print(f"Converted {count} articles.")
