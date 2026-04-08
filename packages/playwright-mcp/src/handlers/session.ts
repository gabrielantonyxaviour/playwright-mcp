import {
  setupPageListeners,
  withSession,
  consoleLogs,
  networkLogs,
} from "./shared.js";
import type { HandlerFn } from "./shared.js";

export const sessionHandlers = new Map<string, HandlerFn>([
  [
    "session_create",
    async (args, manager) => {
      const restore = args.restore as boolean | undefined;
      const restoreFrom = args.restoreFrom as string | undefined;
      const sessionName = args.name as string | undefined;
      const session = await manager.createSession(
        sessionName,
        restore,
        restoreFrom,
      );
      const page = manager.getActivePage(session);
      setupPageListeners(session.id, page);

      const renamedFrom = (session as { renamedFrom?: string }).renamedFrom;
      const effectiveRestoreFrom = renamedFrom || restoreFrom;
      const restoreSource =
        effectiveRestoreFrom ||
        (restore && sessionName ? sessionName : undefined);
      const restored = restoreSource
        ? manager.stateStore.load(restoreSource) !== null
        : false;

      const parts: string[] = [`Session "${session.name}" created.`];
      if (renamedFrom) {
        parts.push(
          `"${renamedFrom}" is in use by another process — auto-renamed to "${session.name}" with the same cookies.`,
        );
      }
      if (restored) {
        const src =
          effectiveRestoreFrom && effectiveRestoreFrom !== session.name
            ? ` from "${effectiveRestoreFrom}"`
            : "";
        parts.push(`Restored saved cookies${src}.`);
      }
      if (manager.sessionCount === 1) {
        parts.push("(set as default)");
      }

      return JSON.stringify({
        sessionId: session.id,
        name: session.name,
        ...(renamedFrom ? { renamedFrom } : {}),
        message: parts.join(" "),
      });
    },
  ],
  [
    "session_list",
    async (_args, manager) => {
      const sessions = await manager.listSessions();
      if (sessions.length === 0) {
        return "No active sessions. Use session_create to start one.";
      }
      return JSON.stringify(sessions, null, 2);
    },
  ],
  [
    "session_clone",
    async (args, manager) => {
      const session = await manager.cloneSession(
        args.sourceSessionId as string,
        args.name as string | undefined,
      );
      const page = manager.getActivePage(session);
      setupPageListeners(session.id, page);
      return JSON.stringify({
        sessionId: session.id,
        name: session.name,
        message: `Session "${session.name}" cloned from "${args.sourceSessionId}" with same auth/cookies.`,
      });
    },
  ],
  [
    "session_close",
    async (args, manager) => {
      const sessionId = args.sessionId as string;
      await manager.closeSession(sessionId);
      consoleLogs.delete(sessionId);
      networkLogs.delete(sessionId);
      return `Session "${sessionId}" closed.`;
    },
  ],
  [
    "session_switch",
    async (args, manager) => {
      const session = manager.getSession(args.sessionId as string);
      manager.setDefault(session.id);
      return `Default session switched to "${session.name}" (${session.id}).`;
    },
  ],
  [
    "session_storage_state",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      return withSession(manager, sid, async (session) => {
        const state = await session.context.storageState();
        return JSON.stringify(state, null, 2);
      });
    },
  ],
  [
    "session_save",
    async (args, manager) => {
      const sid = args.sessionId as string | undefined;
      const savedName = await manager.saveSession(sid);
      return `Session "${savedName}" state saved to disk. Restore it in a future session with: session_create({ name: "${savedName}", restore: true })`;
    },
  ],
  [
    "session_list_saved",
    async (_args, manager) => {
      manager.stateStore.cleanStaleLocks();
      const saved = manager.stateStore.listSaved();
      if (saved.length === 0) {
        return "No saved session states. Use session_save to persist a session's cookies to disk.";
      }
      const formatted = saved.map((s) => {
        const authSummary = s.auth?.length
          ? s.auth.map((a) => {
              const id = a.identity ? ` (${a.identity})` : "";
              const tag = a.manual ? " [manual]" : "";
              return `${a.service}${id}${tag}`;
            })
          : [];
        const lockLabel = s.lock.locked
          ? `LOCKED by PID ${s.lock.pid} since ${s.lock.acquiredAt}`
          : "available";
        return {
          name: s.name,
          lastUrl: s.lastUrl,
          savedAt: s.savedAt,
          services: authSummary,
          lock: lockLabel,
        };
      });
      return JSON.stringify(formatted, null, 2);
    },
  ],
  [
    "session_tag",
    async (args, _manager) => {
      _manager.stateStore.tagAuth(
        args.name as string,
        args.service as string,
        args.identity as string | undefined,
        args.remove as boolean | undefined,
      );
      const action = args.remove ? "Removed" : "Tagged";
      const identity = args.identity ? ` (${args.identity})` : "";
      return `${action} "${args.service}"${identity} on saved session "${args.name}".`;
    },
  ],
  [
    "session_delete_saved",
    async (args, manager) => {
      const deleted = manager.stateStore.delete(args.name as string);
      return deleted
        ? `Saved state "${args.name}" deleted.`
        : `No saved state found for "${args.name}".`;
    },
  ],
]);
