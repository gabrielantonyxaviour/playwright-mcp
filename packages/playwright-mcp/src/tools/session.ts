/**
 * Session management tool definitions.
 */

export function sessionToolDefs() {
  return [
    {
      name: "session_create",
      description:
        "Create a new browser session (isolated browser context). Each session has its own cookies, localStorage, and pages. Use this before any browser interaction. Set restore=true to load previously saved cookies/auth for this session name. Use restoreFrom to load cookies from a DIFFERENT saved session (useful when the target session is locked by another process).",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Human-readable name for the session (e.g. 'admin', 'member-view', 'checkout-flow'). If omitted, auto-generated.",
          },
          restore: {
            type: "boolean",
            description:
              "If true, load saved cookies/localStorage from a previous session_save with the same name. Requires a name. Use session_list_saved to see available saved states.",
          },
          restoreFrom: {
            type: "string",
            description:
              "Load cookies from a DIFFERENT saved session name. The session gets its own name (from the 'name' param) but starts with cookies from this saved state. Useful when the source session is locked by another process.",
          },
        },
      },
    },
    {
      name: "session_list",
      description:
        "List all active browser sessions with their current URL, title, page count, idle time, and dead status. Sessions idle for 5+ minutes are auto-closed.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "session_clone",
      description:
        "Clone a session's authentication state (cookies, localStorage) into a new session. The new session starts with the same login but a fresh page. Perfect for testing the same app as a different user without re-logging in.",
      inputSchema: {
        type: "object",
        properties: {
          sourceSessionId: {
            type: "string",
            description: "ID or name of the session to clone from.",
          },
          name: {
            type: "string",
            description: "Name for the new cloned session.",
          },
        },
        required: ["sourceSessionId"],
      },
    },
    {
      name: "session_close",
      description:
        "Close and destroy a session. Frees the browser context and all its pages.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "ID or name of the session to close.",
          },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "session_switch",
      description:
        "Set a session as the default. All subsequent tool calls without an explicit sessionId will use this session.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description: "ID or name of the session to make default.",
          },
        },
        required: ["sessionId"],
      },
    },
    {
      name: "session_storage_state",
      description:
        "Export the full storage state (cookies + localStorage) from a session as JSON. Useful for saving auth state to reuse later.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description:
              "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
          },
        },
      },
    },
    {
      name: "session_save",
      description:
        "Save a session's cookies and localStorage to disk so they persist across Claude Code restarts. Next time, use session_create with restore=true and the same name to restore the saved auth state without re-logging in.",
      inputSchema: {
        type: "object",
        properties: {
          sessionId: {
            type: "string",
            description:
              "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
          },
        },
      },
    },
    {
      name: "session_list_saved",
      description:
        "List all previously saved session states on disk. Shows name, last URL, authenticated services (auto-detected from cookies), user identity, and lock status (whether another process is using it). Use this to find which session has the auth you need before restoring.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "session_tag",
      description:
        "Manually add or remove an auth label on a saved session. Use when auto-detection misses a service or gets the identity wrong. Manual tags are preserved across future saves.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the saved session to tag.",
          },
          service: {
            type: "string",
            description:
              "Service name to tag (e.g. 'Vercel', 'GitHub', 'GoDaddy').",
          },
          identity: {
            type: "string",
            description:
              "Email or username for this service (e.g. 'gabriel@kosyn.ai').",
          },
          remove: {
            type: "boolean",
            description:
              "If true, remove this service tag instead of adding it.",
          },
        },
        required: ["name", "service"],
      },
    },
    {
      name: "session_delete_saved",
      description: "Delete a saved session state from disk.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the saved state to delete.",
          },
        },
        required: ["name"],
      },
    },
  ];
}
