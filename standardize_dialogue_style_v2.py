import re
from pathlib import Path

TRANSCRIPT_CONTAINER = '<div class="transcript-container" style="background:rgba(45,15,24,0.4);border:1px solid var(--border-gold);padding:2.5rem;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin-bottom:2rem;">'
BLOCK_STYLE = 'style="margin-bottom:2rem;border-left:3px solid var(--accent-color);padding-left:1.5rem;"'
NAME_STYLE = 'style="font-weight:700;color:var(--accent-bright);margin-right:0.5rem;text-transform:uppercase;letter-spacing:1px;font-size:1rem;"'
TEXT_STYLE = 'style="display:block;margin-top:0.5rem;"'


def make_block(speaker, text):
    return (
        f'<div class="speaker-block" {BLOCK_STYLE}>\n'
        f'<span class="speaker-name" {NAME_STYLE}>{speaker}:</span>\n'
        f'<span class="speech-text" {TEXT_STYLE}>{text}</span>\n'
        f'</div>'
    )


def needs_fixing(content):
    has_plain_speaker = bool(re.search(r'^\*\*[^*]+:\*\*', content, re.MULTILINE))
    has_unstyled_block = bool(re.search(r'<div class="speaker-block"(?!\s+style)', content))
    return has_plain_speaker or has_unstyled_block


def fix_body(body, has_container):
    lines = body.split('\n')
    result = []
    last_speaker = None
    in_speaker_block = False
    container_added = has_container

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Entering a speaker-block div
        if re.search(r'<div\s+class="speaker-block"', stripped):
            in_speaker_block = True
            # Add transcript-container if missing, before first speaker block
            if not container_added:
                result.append(TRANSCRIPT_CONTAINER)
                result.append('')
                container_added = True
            # Add block style if missing
            if 'style=' not in stripped:
                line = re.sub(
                    r'<div class="speaker-block"(\s*)>',
                    f'<div class="speaker-block" {BLOCK_STYLE}>',
                    line
                )
            result.append(line)
            i += 1
            continue

        # Inside a speaker-block: fix span styles and extract speaker name
        if in_speaker_block:
            if '<span class="speaker-name"' in stripped:
                if 'style=' not in stripped:
                    line = line.replace(
                        '<span class="speaker-name">',
                        f'<span class="speaker-name" {NAME_STYLE}>'
                    )
                m = re.search(r'<span class="speaker-name"[^>]*>([^<:]+):', line)
                if m:
                    last_speaker = m.group(1).strip()

            if '<span class="speech-text"' in stripped and 'style=' not in stripped:
                line = line.replace(
                    '<span class="speech-text">',
                    f'<span class="speech-text" {TEXT_STYLE}>'
                )

            # </div> with no opening div on same line = closing of the speaker-block
            if '</div>' in stripped and '<div' not in stripped:
                in_speaker_block = False

            result.append(line)
            i += 1
            continue

        # Plain markdown speaker line: **Speaker:** text
        bold_match = re.match(r'^\*\*(.+?):\*\*\s*(.*)', stripped)
        if bold_match:
            speaker = bold_match.group(1).strip()
            text = bold_match.group(2).strip()
            last_speaker = speaker
            if not container_added:
                result.append(TRANSCRIPT_CONTAINER)
                result.append('')
                container_added = True
            result.append(make_block(speaker, text))
            i += 1
            continue

        # Loose paragraph: non-empty, not HTML/heading/list, after a speaker is known
        if (
            stripped
            and last_speaker is not None
            and not stripped.startswith('<')
            and not stripped.startswith('#')
            and not stripped.startswith('- ')
            and not stripped.startswith('* ')
            and stripped not in ('---', '***', '___')
        ):
            result.append(make_block(last_speaker, stripped))
            i += 1
            continue

        result.append(line)
        i += 1

    body_out = '\n'.join(result)

    # If we added the transcript-container opener, close it in the right place
    if container_added and not has_container:
        if '<div class="conclusion-section"' in body_out:
            body_out = body_out.replace(
                '<div class="conclusion-section"',
                '</div>\n\n<div class="conclusion-section"',
                1
            )
        else:
            body_out = body_out.rstrip() + '\n\n</div>\n'

    return body_out


def process_file(filepath):
    content = filepath.read_text(encoding='utf-8')

    if not needs_fixing(content):
        return False

    # Split frontmatter from body (handles opening ---)
    m = re.match(r'^(---\s*\n.*?\n---\s*\n)(.*)', content, re.DOTALL)
    if not m:
        return False

    frontmatter = m.group(1)
    body = m.group(2)
    has_container = 'class="transcript-container"' in content

    new_body = fix_body(body, has_container)

    if new_body != body:
        filepath.write_text(frontmatter + new_body, encoding='utf-8')
        return True

    return False


if __name__ == "__main__":
    articles_dir = Path("articles")
    count = 0
    for fp in sorted(articles_dir.glob("*.md")):
        if process_file(fp):
            print(f"  Fixed: {fp.name}")
            count += 1
    print(f"\nTotal files fixed: {count}")
