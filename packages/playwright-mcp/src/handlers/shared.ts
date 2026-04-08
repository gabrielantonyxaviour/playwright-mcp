import type { SessionManager, Session } from "../session-manager.js";
import type { ConsoleMessage, Page } from "playwright";

// Per-session console message buffers
export const consoleLogs = new Map<string, { type: string; text: string }[]>();

// Per-session network request buffers
export const networkLogs = new Map<
  string,
  { method: string; url: string; status?: number; statusText?: string }[]
>();

const MAX_LOG_SIZE = 100;

export function setupPageListeners(sessionId: string, page: Page) {
  if (!consoleLogs.has(sessionId)) consoleLogs.set(sessionId, []);
  if (!networkLogs.has(sessionId)) networkLogs.set(sessionId, []);

  page.on("console", (msg: ConsoleMessage) => {
    const logs = consoleLogs.get(sessionId)!;
    logs.push({ type: msg.type(), text: msg.text() });
    if (logs.length > MAX_LOG_SIZE) logs.shift();
  });

  page.on("response", (response) => {
    const logs = networkLogs.get(sessionId)!;
    logs.push({
      method: response.request().method(),
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
    });
    if (logs.length > MAX_LOG_SIZE) logs.shift();
  });
}

/**
 * Helper: resolve session, acquire lock, run operation, release lock.
 * Guarantees only one operation per session at a time — prevents sub-agents
 * from colliding when they share a session (navigating while clicking, etc.).
 */
export async function withSession(
  manager: SessionManager,
  sessionId: string | undefined,
  fn: (session: Session, page: Page) => Promise<string>,
): Promise<string> {
  const session = manager.getSession(sessionId);
  const release = await manager.acquireSessionLock(session);
  try {
    manager.touchSession(session);
    const page = manager.getActivePage(session);
    return await fn(session, page);
  } finally {
    release();
  }
}

export type HandlerFn = (
  args: Record<string, unknown>,
  manager: SessionManager,
) => Promise<string>;
