---
name: handwrite_to_obsidian
description: |
  Transcribe a handwritten note image into an Obsidian note.
  Activate when the user shares an image and says things like: "save this note", "save to obsidian",
  "transcribe this", "把这个笔记存到obsidian", "保存手写笔记", "记录到obsidian", or similar.
---

# Handwrite to Obsidian

Transcribe a handwritten note image and save it as a Markdown note in Obsidian.

## When to use

Trigger this skill when the user:
- Shares an image (photo of handwriting, whiteboard, paper notes, etc.)
- Asks to save / transcribe / record it into Obsidian
- Says things like: "save this note in obsidian", "transcribe this to obsidian", "把这个存到obsidian", "保存这张笔记", "记录下来"

## Transcription rules

You are the transcriber. Apply these rules strictly:

1. **Faithful transcription** — reproduce the content exactly as written. Do not paraphrase, reorder, or omit anything.
2. **Preserve all symbols and notation** — keep every symbol, abbreviation, arrow, asterisk, underline emphasis, etc. exactly as the author used them. Do not substitute or "correct" notation.
3. **Math formatting** — convert handwritten math to LaTeX:
   - Inline math: `$...$` (single dollar)
   - Display / block math: `$$...$$` (doubble dollars)
4. **Background annotation** — where a symbol or notation has a standard meaning in the relevant domain (math, physics, chemistry, CS, etc.), add a brief inline annotation in a `<!-- -->` HTML comment immediately after the first occurrence. Do not alter the text itself.
   - Example: the author writes `∇f` → transcribe as `∇f <!-- gradient of f -->` on first use only.
   - Only annotate when the meaning is unambiguous from context. Skip if uncertain.
5. **Structure** — preserve the visual structure: headings, bullet lists, numbered lists, indentation, blank lines between sections. Use Markdown equivalents.
6. **Illegible text** — mark with `[illegible]`. Do not guess.
7. **Language** — keep the original language(s). Do not translate.

## Steps

**Step 1 — Confirm intent**

If the user has not already confirmed, ask:

> 要把这张手写笔记保存到 Obsidian 吗？我会直接存到默认 vault 的根目录。
> 请告诉我笔记的文件名（不含 .md），或者回复「自动命名」让我根据内容生成一个。

Wait for the user's reply before proceeding.

**Step 2 — Determine filename**

- If the user provided a name, use it (sanitize: replace spaces with `-`, strip special chars).
- If "自动命名" / "auto" / no name given: infer a short descriptive name (3–6 words, kebab-case, English or Chinese pinyin) from the note's topic.

**Step 3 — Transcribe**

Carefully read the image and produce the full Markdown transcription following the rules above.

**Step 4 — Get vault path**

Run:
```bash
obsidian-cli print-default --path-only
```

This returns the absolute path to the default vault root (e.g. `/Users/kay/Documents/research-main`).

**Step 5 — Write the note**

Write the transcribed content to `<vault-root>/<filename>.md` directly using file write (no obsidian-cli create needed — plain file write is sufficient and avoids URI handler issues).

Add a small frontmatter block at the top:
```yaml
---
source: handwritten
transcribed: <today's date YYYY-MM-DD>
---
```

Then the transcribed body.

**Step 6 — Confirm**

Reply to the user:
> ✓ 已保存到 Obsidian：`<filename>.md`

If any math or annotation was added, briefly note it:
> （已将手写公式转为 LaTeX，首次出现的符号附有注释）

## Notes

- Write directly to the vault `.md` file — do not use `obsidian-cli create` (requires URI handler).
- Never alter the author's notation or content — annotations go in `<!-- -->` comments only.
- If the image contains multiple distinct pages or sections, ask the user whether to save as one note or separate notes before proceeding.
