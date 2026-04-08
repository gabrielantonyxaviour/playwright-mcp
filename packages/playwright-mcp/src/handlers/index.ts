import { sessionHandlers } from "./session.js";
import { browserHandlers } from "./browser.js";
import { coordinateHandlers } from "./coordinate.js";
import { networkHandlers } from "./network.js";
import { storageHandlers } from "./storage.js";
import { devtoolsHandlers } from "./devtools.js";
import { extraHandlers } from "./extra.js";
import type { SessionManager } from "../session-manager.js";
import type { HandlerFn } from "./shared.js";

const allHandlers = new Map<string, HandlerFn>([
  ...sessionHandlers,
  ...browserHandlers,
  ...coordinateHandlers,
  ...networkHandlers,
  ...storageHandlers,
  ...devtoolsHandlers,
  ...extraHandlers,
]);

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  manager: SessionManager,
): Promise<string> {
  const handler = allHandlers.get(name);
  if (!handler) throw new Error(`Unknown tool: ${name}`);
  return handler(args, manager);
}
