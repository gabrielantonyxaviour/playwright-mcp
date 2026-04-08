import { withSession } from "./shared.js";
import type { HandlerFn } from "./shared.js";
import type { Page } from "playwright";

type StorageType = "localStorage" | "sessionStorage";

async function storageOp(
  page: Page,
  type: StorageType,
  op: string,
  key?: string,
  value?: string,
): Promise<string> {
  const result = await page.evaluate(
    ({ t, op, k, v }) => {
      const s = window[t as "localStorage" | "sessionStorage"];
      switch (op) {
        case "get":
          return s.getItem(k!);
        case "set":
          s.setItem(k!, v!);
          return "OK";
        case "list": {
          const r: Record<string, string> = {};
          for (let i = 0; i < s.length; i++) {
            const key = s.key(i)!;
            r[key] = s.getItem(key)!;
          }
          return JSON.stringify(r);
        }
        case "delete":
          s.removeItem(k!);
          return "OK";
        case "clear":
          s.clear();
          return "OK";
      }
      return null;
    },
    { t: type, op, k: key, v: value },
  );
  return result !== null ? String(result) : "null";
}

export const storageHandlers = new Map<string, HandlerFn>([
  // ─── Cookies ─────────────────────────────────────────────────
  [
    "browser_cookie_get",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const name = args.name as string;
        const url = args.url as string | undefined;
        const cookies = await session.context.cookies(url ? [url] : []);
        const match = cookies.find((c) => c.name === name);
        return match ? JSON.stringify(match, null, 2) : "null";
      });
    },
  ],
  [
    "browser_cookie_list",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const url = args.url as string | undefined;
        const cookies = await session.context.cookies(url ? [url] : []);
        return JSON.stringify(cookies, null, 2);
      });
    },
  ],
  [
    "browser_cookie_set",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const cookie = {
          name: args.name as string,
          value: args.value as string,
          domain: args.domain as string | undefined,
          path: (args.path as string) || "/",
          url: args.url as string | undefined,
          httpOnly: (args.httpOnly as boolean) || false,
          secure: (args.secure as boolean) || false,
          sameSite: (args.sameSite as "Strict" | "Lax" | "None") || "Lax",
        };
        await session.context.addCookies([cookie]);
        return `Cookie "${cookie.name}" set.`;
      });
    },
  ],
  [
    "browser_cookie_delete",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const name = args.name as string;
        const url = args.url as string | undefined;
        const cookies = await session.context.cookies(url ? [url] : []);
        const remaining = cookies.filter((c) => c.name !== name);
        await session.context.clearCookies();
        if (remaining.length > 0) {
          await session.context.addCookies(remaining);
        }
        return `Cookie "${name}" deleted.`;
      });
    },
  ],
  [
    "browser_cookie_clear",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        await session.context.clearCookies();
        return "All cookies cleared.";
      });
    },
  ],

  // ─── localStorage ────────────────────────────────────────────
  [
    "browser_localstorage_get",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        return storageOp(page, "localStorage", "get", args.key as string);
      });
    },
  ],
  [
    "browser_localstorage_set",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(
          page,
          "localStorage",
          "set",
          args.key as string,
          args.value as string,
        );
        return `localStorage["${args.key}"] set.`;
      });
    },
  ],
  [
    "browser_localstorage_list",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        return storageOp(page, "localStorage", "list");
      });
    },
  ],
  [
    "browser_localstorage_delete",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(page, "localStorage", "delete", args.key as string);
        return `localStorage["${args.key}"] removed.`;
      });
    },
  ],
  [
    "browser_localstorage_clear",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(page, "localStorage", "clear");
        return "localStorage cleared.";
      });
    },
  ],

  // ─── sessionStorage ──────────────────────────────────────────
  [
    "browser_sessionstorage_get",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        return storageOp(page, "sessionStorage", "get", args.key as string);
      });
    },
  ],
  [
    "browser_sessionstorage_set",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(
          page,
          "sessionStorage",
          "set",
          args.key as string,
          args.value as string,
        );
        return `sessionStorage["${args.key}"] set.`;
      });
    },
  ],
  [
    "browser_sessionstorage_list",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        return storageOp(page, "sessionStorage", "list");
      });
    },
  ],
  [
    "browser_sessionstorage_delete",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(page, "sessionStorage", "delete", args.key as string);
        return `sessionStorage["${args.key}"] removed.`;
      });
    },
  ],
  [
    "browser_sessionstorage_clear",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        await storageOp(page, "sessionStorage", "clear");
        return "sessionStorage cleared.";
      });
    },
  ],
]);
