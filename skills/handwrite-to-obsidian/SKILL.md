---
name: handwrite_to_obsidian
description: |
  Transcribe a handwritten note image into an Obsidian note.
  Activate when the user shares an image and says things like: "save this note", "save to obsidian",
  "transcribe this", "把这个笔记存到obsidian", "保存手写笔记", "记录到obsidian", or similar.
---

# Handwrite to Obsidian

Transcribe a handwritten note image and save it as a Markdown note in Obsidian. Do it immediately — no confirmation needed.

## Transcription rules

1. **Faithful** — reproduce exactly as written. No paraphrasing, reordering, or omissions.
2. **Preserve notation** — every symbol, abbreviation, arrow, asterisk, etc. unchanged.
3. **Math → LaTeX** — inline: `$...$`, display: `$$...$$`
4. **Annotate on first use** — add `<!-- meaning -->` after the first occurrence of domain symbols when meaning is unambiguous. Never alter the text itself.
5. **Structure** — preserve headings, lists, indentation using Markdown equivalents.
6. **Illegible** → `[illegible]`. Never guess.
7. **Language** — keep original. Do not translate.

## Steps

1. **Transcribe** the image following the rules above.

2. **Name the file** — infer a short kebab-case name (3–5 words) from the content topic.
   If the user already provided a name, use that (sanitize: spaces → `-`, strip special chars).

3. **Get vault path:**
   ```bash
   obsidian-cli print-default --path-only
   ```

4. **Write the note** to `<vault-root>/<filename>.md`:
   ```
   ---
   source: handwritten
   transcribed: <YYYY-MM-DD>
   ---

   <transcribed body>
   ```

5. **Reply:** `✓ 已保存：<filename>.md`
   If math or annotations were added: `（公式已转 LaTeX，符号附注释）`

> If the image has multiple clearly distinct sections, ask before saving whether to split into separate notes.
