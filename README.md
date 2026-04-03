# openclaw-math-tools

A workflow for mathematicians and theoretical researchers using [OpenClaw](https://openclaw.ai) + Feishu + Obsidian.

**The workflow:** Snap photos of your handwritten derivations, diagrams, or whiteboard work — send them to your Feishu chat. The agent holds them silently. When you follow up with a question or "save to obsidian", it sees all the images at once and either answers with full context or transcribes the notes into your Obsidian vault with proper LaTeX formatting.

No more the agent firing on every image you drop. No more copy-pasting math by hand.

---

## Components

### `plugins/defer-images`

Holds image-only messages silently until you send a text prompt. All deferred images are delivered together in a single agent turn.

**How it works:**
- `before_dispatch` hook: detects image-only messages, records a defer timestamp, suppresses the agent response
- `before_agent_start` hook: scans `~/.openclaw/media/inbound/` for files downloaded around the defer time, injects their paths into the agent prompt

**Install:**
```bash
openclaw plugin install ./plugins/defer-images
```

Enable in `openclaw.json`:
```json
"plugins": {
  "entries": {
    "defer-images": { "enabled": true }
  }
}
```

Set a vision-capable model as `imageModel` and declare `"input": ["text", "image"]` on it in `models.providers.<provider>.models`.

---

### `skills/handwrite-to-obsidian`

Transcribes a photo of handwritten notes into a Markdown note saved to your Obsidian vault — with LaTeX math and inline symbol annotations.

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

## Dependencies

- [OpenClaw](https://openclaw.ai) — gateway and plugin/skill runtime
- [Feishu](https://www.feishu.cn) — messaging channel
- [obsidian-cli](https://github.com/Yakitrak/obsidian-cli) — vault path resolution for the handwrite skill
