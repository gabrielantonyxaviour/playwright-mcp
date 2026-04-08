import { withSession, setupPageListeners } from "./shared.js";
import type { HandlerFn } from "./shared.js";
import * as os from "os";
import * as path from "path";

// Track which sessions have active tracing
const tracingSessions = new Set<string>();

export const devtoolsHandlers = new Map<string, HandlerFn>([
  [
    "browser_start_tracing",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        if (tracingSessions.has(session.id)) {
          return "Tracing already active for this session.";
        }
        await session.context.tracing.start({
          screenshots: true,
          snapshots: true,
        });
        tracingSessions.add(session.id);
        return "Tracing started. Use browser_stop_tracing to save the trace.";
      });
    },
  ],
  [
    "browser_stop_tracing",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        if (!tracingSessions.has(session.id)) {
          return "No active tracing for this session. Start one with browser_start_tracing.";
        }
        const filename =
          (args.filename as string) ||
          path.join(os.tmpdir(), `trace-${Date.now()}.zip`);
        await session.context.tracing.stop({ path: filename });
        tracingSessions.delete(session.id);
        return `Trace saved to ${filename}. Open with: npx playwright show-trace ${filename}`;
      });
    },
  ],
  [
    "browser_start_video",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const width = (args.width as number) || 1280;
        const height = (args.height as number) || 720;
        const dir = (args.dir as string) || path.join(os.tmpdir(), "pw-videos");

        // Save current state and grab browser ref BEFORE closing context
        const storageState = await session.context.storageState();
        const currentUrl = page.url();
        const browser = page.context().browser();
        if (!browser) {
          throw new Error(
            "Browser reference lost — cannot create video context.",
          );
        }

        // Close old context — Playwright requires video at context creation
        await session.context.close();

        const newContext = await browser.newContext({
          storageState,
          recordVideo: { dir, size: { width, height } },
        });
        const newPage = await newContext.newPage();

        // Navigate back to previous URL
        if (currentUrl && currentUrl !== "about:blank") {
          await newPage
            .goto(currentUrl, { waitUntil: "domcontentloaded" })
            .catch(() => {});
        }

        // Update session references
        session.context = newContext;
        session.pages = [newPage];
        session.activePageIndex = 0;
        setupPageListeners(session.id, newPage);

        return `Video recording started (${width}x${height}). Files will be saved to ${dir}. Use browser_stop_video to finalize.`;
      });
    },
  ],
  [
    "browser_stop_video",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const video = page.video();
        if (!video) {
          return "No video recording active for the current page.";
        }
        const videoPath = await video.path();
        const saveTo = (args.filename as string) || undefined;
        if (saveTo) {
          await video.saveAs(saveTo);
          return `Video saved to ${saveTo} (source: ${videoPath}).`;
        }
        return `Video available at ${videoPath}.`;
      });
    },
  ],
]);
