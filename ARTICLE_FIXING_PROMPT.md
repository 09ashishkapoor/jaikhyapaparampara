# Article Transformation Prompt: Youtube Transcript to Conversation Format

Use this prompt to transform existing draft articles into the standardized conversation format based on their original YouTube transcripts.

---

## The Prompt

**Copy and paste the following into the chat, replacing the bracketed text with the specific article name:**

"Can you please fix the article **[ENTER ARTICLE NAME HERE]**. 

Follow these strict requirements:
1. **Format Base**: Use `articles/kali-puja-tantra-amavasya-dangers-shyama-khyapa.md` as the structural and stylistic reference.
2. **Metadata**: Ensure YAML frontmatter includes full SEO keywords (Guru Deva Shyama Khyapa, Gupta Sadhak, Smashana Bhairava, Khyapa Parampara) and matching tags.
3. **Template**: Use the `transcript-container` and `speaker-block` div structure.
4. **NO Summarization**: Do NOT summarize the content. Rewrite the article as a full, word-for-word word-for-word transcript in conversation style between 'Devotee' and 'Guru Shyama Khyapa'.
5. **Source Retrieval**: 
   - Extract the YouTube link from the `source` field of the current article.
   - Look for the matching transcript file in `markdownfiles_forblog/processed/` that contains that YouTube ID.
   - Use the text from that transcript file as the ONLY source for the dialogue.
6. **Styling**: Do not use italics for quotes within the speech text. Use absolute raw text from the transcript for authenticity."

---

## Best Practices for Execution
- **One by One**: Running this for one article at a time ensures the agent reads the specific transcript file thoroughly without hitting context limits.
- **Verification**: If the agent still summarizes, follow up with: *"You are still summarizing. Please provide the literal, word-for-word dialogue from the transcript file."*
- **Pathing**: If the agent can't find the file, point it to `markdownfiles_forblog/processed/` specifically.
