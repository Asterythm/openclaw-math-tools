# openclaw-math-tools

OpenClaw plugins and skills for mathematicians and theoretical researchers.

## What's included

### `plugins/defer-images` — Defer Images

Holds image-only messages (photos, diagrams, whiteboard shots) silently until the user sends a text prompt. All deferred images are then delivered together in a single agent turn.

**Why it matters:** Researchers often snap multiple photos of a derivation or diagram before typing their question. Without this plugin, the agent responds to each image individually — noisy and unhelpful. With it, you get one coherent response that sees everything at once.

**How it works:**
- `before_dispatch` hook: detects image-only messages (JSON envelope with `image_key` or `file_key`), records a defer timestamp, suppresses the agent response
- `before_agent_start` hook: scans `~/.openclaw/media/inbound/` for files downloaded around the defer time, injects their paths into the agent prompt via `prependContext`

**Install:**
```bash
# From your openclaw workspace
openclaw plugin install ./plugins/defer-images
```

Then enable in `openclaw.json`:
```json
"plugins": {
  "entries": {
    "defer-images": { "enabled": true }
  }
}
```

Also set your image model with vision capability:
```json
"agents": {
  "defaults": {
    "imageModel": "your-provider/your-vision-model"
  }
}
```

And declare `"input": ["text", "image"]` on that model in `models.providers.<provider>.models`.

---

### `skills/handwrite-to-obsidian` — Handwrite to Obsidian

Transcribes a photo of handwritten notes into a Markdown note saved directly to your Obsidian vault — with full LaTeX math formatting and inline symbol annotations.

**Why it matters:** Theoretical work lives on paper first. This skill bridges the gap between a whiteboard or notebook and a searchable, linkable Obsidian note, without losing any notation or symbols.

**Transcription rules:**
- Faithful reproduction — no paraphrasing or reordering
- All symbols and notation preserved exactly as written
- Handwritten math → LaTeX (`$...$` inline, `$$...$$` display)
- First occurrence of domain symbols gets a `<!-- comment -->` annotation (e.g. `∇f <!-- gradient of f -->`)
- Illegible text marked `[illegible]`, never guessed
- Original language preserved

**Install:**
```bash
cp -r skills/handwrite-to-obsidian ~/.openclaw/workspace/skills/
openclaw gateway restart
```

**Trigger phrases:** "save this note", "transcribe to obsidian", "把这个笔记存到obsidian", "保存手写笔记"

---

## Workflow

1. Snap photos of your handwritten derivations or diagrams → send to the agent (no text yet)
2. The `defer-images` plugin silently holds them
3. Send your question or "save to obsidian"
4. The agent sees all images at once and either answers your question with full context, or transcribes and saves the note to Obsidian with LaTeX formatting

## Requirements

- [OpenClaw](https://openclaw.ai) gateway
- A vision-capable model configured as `imageModel`
- `obsidian-cli` (for the handwrite skill) — `brew install obsidian-cli` or equivalent
