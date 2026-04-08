import { withSession } from "./shared.js";
import type { HandlerFn } from "./shared.js";
import type { Route } from "playwright";

// Per-session route tracking: sessionId -> pattern -> { handler, info }
const sessionRoutes = new Map<
  string,
  Map<string, { handler: (route: Route) => Promise<void>; info: object }>
>();

export const networkHandlers = new Map<string, HandlerFn>([
  [
    "browser_route",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const pattern = args.pattern as string;
        const status = (args.status as number) || 200;
        const contentType = (args.contentType as string) || "application/json";
        const body = (args.body as string) || "";

        const handler = async (route: Route) => {
          await route.fulfill({ status, contentType, body });
        };

        await page.route(pattern, handler);

        if (!sessionRoutes.has(session.id)) {
          sessionRoutes.set(session.id, new Map());
        }
        sessionRoutes.get(session.id)!.set(pattern, {
          handler,
          info: { pattern, status, contentType, bodyLength: body.length },
        });

        return `Route registered for "${pattern}" — will respond with ${status} ${contentType}.`;
      });
    },
  ],
  [
    "browser_unroute",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session, page) => {
        const pattern = args.pattern as string | undefined;
        const routes = sessionRoutes.get(session.id);

        if (pattern) {
          const entry = routes?.get(pattern);
          if (entry) {
            await page.unroute(pattern, entry.handler);
            routes!.delete(pattern);
            return `Route "${pattern}" removed.`;
          }
          return `No route found for "${pattern}".`;
        }

        // Unroute all
        if (routes) {
          for (const [p, entry] of routes) {
            await page.unroute(p, entry.handler);
          }
          routes.clear();
        }
        return "All routes removed.";
      });
    },
  ],
  [
    "browser_route_list",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const routes = sessionRoutes.get(session.id);
        if (!routes || routes.size === 0) {
          return "No active routes.";
        }
        const entries = [...routes.values()].map((r) => r.info);
        return JSON.stringify(entries, null, 2);
      });
    },
  ],
  [
    "browser_network_state_set",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const online = args.online as boolean;
        await session.context.setOffline(!online);
        return online ? "Network set to online." : "Network set to offline.";
      });
    },
  ],
]);
