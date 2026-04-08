import {
  withSession,
  setupPageListeners,
  consoleLogs,
  networkLogs,
} from "./shared.js";
import { takeSnapshot, resolveTarget } from "../snapshot.js";
import type { HandlerFn } from "./shared.js";

export const browserHandlers = new Map<string, HandlerFn>([
  // ─── Navigation ──────────────────────────────────────────────
  [
    "browser_navigate",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.goto(args.url as string, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForLoadState("networkidle").catch(() => {});
        return `Navigated to ${page.url()} — Title: "${await page.title()}"`;
      });
    },
  ],
  [
    "browser_navigate_back",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.goBack({ waitUntil: "domcontentloaded" });
        return `Navigated back to ${page.url()}`;
      });
    },
  ],
  [
    "browser_tabs",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, _page) => {
        if (args.switchTo !== undefined) {
          const idx = args.switchTo as number;
          if (idx < 0 || idx >= session.pages.length) {
            throw new Error(
              `Tab index ${idx} out of range (0-${session.pages.length - 1}).`,
            );
          }
          session.activePageIndex = idx;
          const p = session.pages[idx];
          await p.bringToFront();
          return `Switched to tab ${idx}: ${p.url()}`;
        }
        const tabs = await Promise.all(
          session.pages.map(async (p, i) => ({
            index: i,
            url: p.url(),
            title: await p.title().catch(() => ""),
            active: i === session.activePageIndex,
          })),
        );
        return JSON.stringify(tabs, null, 2);
      });
    },
  ],
  [
    "browser_new_tab",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const page = await session.context.newPage();
        session.pages.push(page);
        session.activePageIndex = session.pages.length - 1;
        setupPageListeners(session.id, page);
        if (args.url) {
          await page.goto(args.url as string, {
            waitUntil: "domcontentloaded",
          });
        }
        return `New tab opened${args.url ? ` at ${page.url()}` : ""}. Tab index: ${session.pages.length - 1}`;
      });
    },
  ],

  // ─── Observation ─────────────────────────────────────────────
  [
    "browser_snapshot",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        return await takeSnapshot(page, session);
      });
    },
  ],
  [
    "browser_take_screenshot",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const buffer = await page.screenshot({
          fullPage: (args.fullPage as boolean) || false,
          type: "jpeg",
          quality: 50,
        });
        const b64 = buffer.toString("base64");
        if (b64.length > 150_000) {
          const smallBuffer = await page.screenshot({
            fullPage: false,
            type: "jpeg",
            quality: 30,
            clip: { x: 0, y: 0, width: 1280, height: 720 },
          });
          return `data:image/jpeg;base64,${smallBuffer.toString("base64")}`;
        }
        return `data:image/jpeg;base64,${b64}`;
      });
    },
  ],
  [
    "browser_console_messages",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      const session = manager.getSession(sid);
      const logs = consoleLogs.get(session.id) || [];
      const count = (args.count as number) || 20;
      const recent = logs.slice(-count);
      if (recent.length === 0) return "No console messages captured.";
      return recent.map((l) => `[${l.type}] ${l.text}`).join("\n");
    },
  ],
  [
    "browser_network_requests",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      const session = manager.getSession(sid);
      const logs = networkLogs.get(session.id) || [];
      const count = (args.count as number) || 20;
      const filter = args.urlFilter as string | undefined;
      let filtered = logs;
      if (filter) {
        filtered = logs.filter((l) => l.url.includes(filter));
      }
      const recent = filtered.slice(-count);
      if (recent.length === 0) return "No network requests captured.";
      return recent
        .map((r) => `${r.method} ${r.status || "???"} ${r.url}`)
        .join("\n");
    },
  ],

  // ─── Interaction ─────────────────────────────────────────────
  [
    "browser_click",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page.locator(target).click({ timeout: 10000 });
        await page.waitForLoadState("domcontentloaded").catch(() => {});
        return `Clicked ${args.ref !== undefined ? `[ref=${args.ref}]` : target}`;
      });
    },
  ],
  [
    "browser_type",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        if (args.ref !== undefined || args.selector) {
          const target = resolveTarget(
            session,
            args.ref as number,
            args.selector as string,
          );
          await page.locator(target).click({ timeout: 10000 });
        }
        await page.keyboard.type(args.text as string);
        const text = args.text as string;
        return `Typed "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`;
      });
    },
  ],
  [
    "browser_fill",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page
          .locator(target)
          .fill(args.value as string, { timeout: 10000 });
        const val = args.value as string;
        return `Filled with "${val.slice(0, 50)}"`;
      });
    },
  ],
  [
    "browser_select_option",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page
          .locator(target)
          .selectOption(args.value as string, { timeout: 10000 });
        return `Selected "${args.value}"`;
      });
    },
  ],
  [
    "browser_hover",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page.locator(target).hover({ timeout: 10000 });
        return `Hovered over ${args.ref !== undefined ? `[ref=${args.ref}]` : target}`;
      });
    },
  ],
  [
    "browser_drag",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const source = resolveTarget(
          session,
          args.sourceRef as number,
          args.sourceSelector as string,
        );
        const target = resolveTarget(
          session,
          args.targetRef as number,
          args.targetSelector as string,
        );
        await page.locator(source).dragTo(page.locator(target));
        return "Drag completed.";
      });
    },
  ],
  [
    "browser_press_key",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.keyboard.press(args.key as string);
        return `Pressed "${args.key}"`;
      });
    },
  ],
  [
    "browser_file_upload",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page.locator(target).setInputFiles(args.paths as string[]);
        return `Uploaded ${(args.paths as string[]).length} file(s).`;
      });
    },
  ],
  [
    "browser_handle_filechooser",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        const [fileChooser] = await Promise.all([
          page.waitForEvent("filechooser"),
          page.locator(target).click(),
        ]);
        const rawPaths = args.paths;
        const paths: string[] = Array.isArray(rawPaths)
          ? (rawPaths as string[])
          : typeof rawPaths === "string"
            ? JSON.parse(rawPaths as string)
            : [String(rawPaths)];
        await fileChooser.setFiles(paths);
        return `Clicked and uploaded ${paths.length} file(s) via intercepted file chooser.`;
      });
    },
  ],
  [
    "browser_handle_dialog",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        page.once("dialog", async (dialog) => {
          if (args.action === "accept") {
            await dialog.accept(args.promptText as string | undefined);
          } else {
            await dialog.dismiss();
          }
        });
        return `Dialog handler set to ${args.action}. It will trigger on the next dialog.`;
      });
    },
  ],

  // ─── Utility ─────────────────────────────────────────────────
  [
    "browser_evaluate",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const result = await page.evaluate(args.expression as string);
        return typeof result === "string"
          ? result
          : JSON.stringify(result, null, 2);
      });
    },
  ],
  [
    "browser_wait_for",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const state = (args.state as string) || "visible";
        const timeout = (args.timeout as number) || 30000;
        await page.locator(args.selector as string).waitFor({
          state: state as "visible" | "hidden" | "attached" | "detached",
          timeout,
        });
        return `Element "${args.selector}" is now ${state}.`;
      });
    },
  ],
  [
    "browser_resize",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const width = parseInt(String(args.width), 10);
        const height = parseInt(String(args.height), 10);
        await page.setViewportSize({ width, height });
        return `Viewport resized to ${width}x${height}.`;
      });
    },
  ],
  [
    "browser_close",
    async (_args, manager) => {
      await manager.closeAll();
      consoleLogs.clear();
      networkLogs.clear();
      return "All sessions and browser closed.";
    },
  ],

  // ─── Added to match Microsoft @playwright/mcp ─────────────────
  [
    "browser_navigate_forward",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.goForward({ waitUntil: "domcontentloaded" });
        return `Navigated forward to ${page.url()}`;
      });
    },
  ],
  [
    "browser_reload",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => {});
        return `Page reloaded — ${page.url()}`;
      });
    },
  ],
  [
    "browser_console_clear",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      const session = manager.getSession(sid);
      consoleLogs.set(session.id, []);
      return "Console messages cleared.";
    },
  ],
  [
    "browser_network_clear",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      const session = manager.getSession(sid);
      networkLogs.set(session.id, []);
      return "Network request log cleared.";
    },
  ],
  [
    "browser_press_sequentially",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.keyboard.type(args.text as string);
        if (args.submit) {
          await page.keyboard.press("Enter");
          await page.waitForLoadState("domcontentloaded").catch(() => {});
        }
        const text = args.text as string;
        return `Typed sequentially: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"${args.submit ? " + Enter" : ""}`;
      });
    },
  ],
  [
    "browser_keydown",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.keyboard.down(args.key as string);
        return `Key "${args.key}" pressed down.`;
      });
    },
  ],
  [
    "browser_keyup",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await page.keyboard.up(args.key as string);
        return `Key "${args.key}" released.`;
      });
    },
  ],
  [
    "browser_check",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page.locator(target).check({ timeout: 10000 });
        return `Checked ${args.ref !== undefined ? `[ref=${args.ref}]` : target}.`;
      });
    },
  ],
  [
    "browser_uncheck",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        await page.locator(target).uncheck({ timeout: 10000 });
        return `Unchecked ${args.ref !== undefined ? `[ref=${args.ref}]` : target}.`;
      });
    },
  ],
  [
    "browser_verify_element_visible",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const role = args.role as string;
        const name = args.accessibleName as string;
        const locator = page.getByRole(
          role as Parameters<typeof page.getByRole>[0],
          { name },
        );
        const count = await locator.count();
        if (count === 0) {
          throw new Error(
            `Element with role "${role}" and accessible name "${name}" not found.`,
          );
        }
        const visible = await locator.first().isVisible();
        if (!visible) {
          throw new Error(
            `Element with role "${role}" and accessible name "${name}" exists but is not visible.`,
          );
        }
        return `Element verified visible: role="${role}" name="${name}".`;
      });
    },
  ],
  [
    "browser_verify_text_visible",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const text = args.text as string;
        const locator = page.getByText(text).filter({ visible: true });
        const count = await locator.count();
        if (count === 0) {
          throw new Error(`Text "${text}" not found or not visible on page.`);
        }
        return `Text verified visible: "${text}".`;
      });
    },
  ],
  [
    "browser_verify_value",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const target = resolveTarget(
          session,
          args.ref as number,
          args.selector as string,
        );
        const locator = page.locator(target);
        const actual = await locator.inputValue({ timeout: 10000 });
        const expected = args.value as string;
        if (actual !== expected) {
          throw new Error(
            `Value mismatch — expected: "${expected}", actual: "${actual}".`,
          );
        }
        return `Value verified: "${expected}".`;
      });
    },
  ],
  [
    "browser_storage_state",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const state = await session.context.storageState();
        return JSON.stringify(state, null, 2);
      });
    },
  ],
  [
    "browser_set_storage_state",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const state =
          typeof args.state === "string"
            ? JSON.parse(args.state as string)
            : args.state;
        // Apply cookies
        if (state.cookies?.length) {
          await session.context.addCookies(state.cookies);
        }
        // Apply localStorage via page evaluation
        if (state.origins?.length) {
          for (const origin of state.origins) {
            if (origin.localStorage?.length) {
              const currentUrl = page.url();
              if (
                currentUrl === "about:blank" ||
                !currentUrl.startsWith(origin.origin)
              ) {
                await page
                  .goto(origin.origin, { waitUntil: "domcontentloaded" })
                  .catch(() => {});
              }
              await page.evaluate(
                (items: { name: string; value: string }[]) => {
                  for (const { name, value } of items) {
                    localStorage.setItem(name, value);
                  }
                },
                origin.localStorage,
              );
            }
          }
        }
        const cookieCount = state.cookies?.length ?? 0;
        const lsCount =
          state.origins?.reduce(
            (n: number, o: { localStorage?: unknown[] }) =>
              n + (o.localStorage?.length ?? 0),
            0,
          ) ?? 0;
        return `Storage state applied: ${cookieCount} cookie(s), ${lsCount} localStorage item(s).`;
      });
    },
  ],
  [
    "browser_verify_list_visible",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const items = args.items as string[];
        const missing: string[] = [];
        for (const item of items) {
          const locator = page.getByText(item).filter({ visible: true });
          const count = await locator.count();
          if (count === 0) missing.push(item);
        }
        if (missing.length > 0) {
          throw new Error(
            `List items not visible: ${missing.map((m) => `"${m}"`).join(", ")}`,
          );
        }
        return `All ${items.length} list items verified visible: ${items.map((i) => `"${i}"`).join(", ")}.`;
      });
    },
  ],
]);
