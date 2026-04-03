import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import type {
  PluginHookBeforeDispatchEvent,
  PluginHookBeforeDispatchContext,
  PluginHookBeforeDispatchResult,
  PluginHookBeforeAgentStartEvent,
  PluginHookAgentContext,
  PluginHookBeforeAgentStartResult,
} from "openclaw/plugin-sdk/plugin-entry";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

interface PendingEntry {
  deferredAt: number; // timestamp when before_dispatch fired
}

// keyed by sessionKey
const pendingBySession = new Map<string, PendingEntry[]>();

const MEDIA_DIR = path.join(os.homedir(), ".openclaw", "media", "inbound");

// Find media files downloaded after a given timestamp (with a small buffer before it)
function findMediaFilesDownloadedAfter(sinceMs: number): string[] {
  try {
    // Allow files downloaded up to 2s before the defer timestamp (download may finish after dispatch)
    const windowStart = sinceMs - 2000;
    return fs
      .readdirSync(MEDIA_DIR)
      .map((f) => {
        const full = path.join(MEDIA_DIR, f);
        try {
          const stat = fs.statSync(full);
          return { full, mtimeMs: stat.mtimeMs };
        } catch {
          return null;
        }
      })
      .filter((e): e is { full: string; mtimeMs: number } => e !== null && e.mtimeMs >= windowStart)
      .sort((a, b) => a.mtimeMs - b.mtimeMs)
      .map((e) => e.full);
  } catch {
    return [];
  }
}

function isImageOnlyDispatch(event: PluginHookBeforeDispatchEvent): boolean {
  const content = (event.content ?? "").trim();
  if (!content.startsWith("{")) return false;
  try {
    const parsed = JSON.parse(content);
    return !!(parsed.image_key || parsed.file_key);
  } catch {
    return false;
  }
}

export default definePluginEntry({
  id: "defer-images",
  name: "Defer Images",
  description:
    "Hold image-only messages until the user sends a text prompt, then deliver them together",

  register(api) {
    // ── Intercept image-only messages ────────────────────────────────────────
    api.on(
      "before_dispatch",
      async (
        event: PluginHookBeforeDispatchEvent,
        ctx: PluginHookBeforeDispatchContext
      ): Promise<PluginHookBeforeDispatchResult | void> => {
        const sessionKey = ctx.sessionKey ?? `${ctx.channelId}:${ctx.conversationId ?? ctx.senderId ?? "unknown"}`;

        if (isImageOnlyDispatch(event)) {
          const entry: PendingEntry = { deferredAt: Date.now() };
          if (!pendingBySession.has(sessionKey)) pendingBySession.set(sessionKey, []);
          pendingBySession.get(sessionKey)!.push(entry);

          api.logger.info(
            `[defer-images] deferred image for session=${sessionKey} at=${entry.deferredAt}`
          );
          return { handled: true };
        }

        api.logger.info(
          `[defer-images] text message, session=${sessionKey} pending=${pendingBySession.get(sessionKey)?.length ?? 0}`
        );
        return;
      },
      { priority: 100 }
    );

    // ── Inject pending images into agent prompt ───────────────────────────────
    api.on(
      "before_agent_start",
      async (
        _event: PluginHookBeforeAgentStartEvent,
        ctx: PluginHookAgentContext
      ): Promise<PluginHookBeforeAgentStartResult | void> => {
        const sessionKey = ctx.sessionKey;
        if (!sessionKey) return;

        const queued = pendingBySession.get(sessionKey);
        if (!queued || queued.length === 0) return;

        // Find all media files downloaded around the time images were deferred
        const earliestDefer = Math.min(...queued.map((e) => e.deferredAt));
        const allPaths = findMediaFilesDownloadedAfter(earliestDefer);
        pendingBySession.delete(sessionKey);

        api.logger.info(
          `[defer-images] injecting ${allPaths.length} deferred image(s) for ${sessionKey}`
        );

        if (allPaths.length === 0) return;

        const pathList = allPaths.map((p) => `- ${p}`).join("\n");
        return {
          prependContext: `[Deferred images from previous messages — read and process these files]\n${pathList}\n`,
        };
      },
      { priority: 100 }
    );

    api.logger.info("[defer-images] registered");
  },
});
