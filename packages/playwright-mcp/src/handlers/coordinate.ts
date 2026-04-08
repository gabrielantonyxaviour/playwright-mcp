import { withSession } from "./shared.js";
import type { HandlerFn } from "./shared.js";

export const coordinateHandlers = new Map<string, HandlerFn>([
  [
    "browser_mouse_click_xy",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const x = args.x as number;
        const y = args.y as number;
        const button = (args.button as "left" | "right" | "middle") || "left";
        const clickCount = (args.clickCount as number) || 1;
        await page.mouse.click(x, y, { button, clickCount });
        return `Clicked at (${x}, ${y}) with ${button} button${clickCount > 1 ? ` x${clickCount}` : ""}.`;
      });
    },
  ],
  [
    "browser_mouse_move_xy",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const x = args.x as number;
        const y = args.y as number;
        await page.mouse.move(x, y);
        return `Mouse moved to (${x}, ${y}).`;
      });
    },
  ],
  [
    "browser_mouse_wheel",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const deltaX = (args.deltaX as number) || 0;
        const deltaY = (args.deltaY as number) || 0;
        await page.mouse.wheel(deltaX, deltaY);
        return `Mouse wheel scrolled (deltaX: ${deltaX}, deltaY: ${deltaY}).`;
      });
    },
  ],
  [
    "browser_mouse_down",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const button = (args.button as "left" | "right" | "middle") || "left";
        await page.mouse.down({ button });
        return `Mouse ${button} button pressed down.`;
      });
    },
  ],
  [
    "browser_mouse_up",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const button = (args.button as "left" | "right" | "middle") || "left";
        await page.mouse.up({ button });
        return `Mouse ${button} button released.`;
      });
    },
  ],
  [
    "browser_mouse_drag_xy",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (_session, page) => {
        const startX = args.startX as number;
        const startY = args.startY as number;
        const endX = args.endX as number;
        const endY = args.endY as number;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();
        return `Dragged from (${startX}, ${startY}) to (${endX}, ${endY}).`;
      });
    },
  ],
]);
