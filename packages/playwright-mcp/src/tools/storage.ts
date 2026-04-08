/**
 * Storage tool definitions (cookies, localStorage, sessionStorage).
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function storageToolDefs() {
  return [
    // ─── Cookies ──────────────────────────────────────────────
    {
      name: "browser_cookie_get",
      description: "Get a cookie by name from the current browser context.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Cookie name." },
          ...SESSION_ID_PROP,
        },
        required: ["name"],
      },
    },
    {
      name: "browser_cookie_set",
      description: "Set a cookie in the current browser context.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Cookie name." },
          value: { type: "string", description: "Cookie value." },
          domain: { type: "string", description: "Cookie domain." },
          path: { type: "string", description: "Cookie path." },
          expires: {
            type: "number",
            description: "Expiration as Unix timestamp in seconds.",
          },
          httpOnly: { type: "boolean", description: "HTTP-only flag." },
          secure: { type: "boolean", description: "Secure flag." },
          sameSite: {
            type: "string",
            enum: ["Strict", "Lax", "None"],
            description: "SameSite attribute.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["name", "value"],
      },
    },
    {
      name: "browser_cookie_list",
      description: "List all cookies in the current browser context.",
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "Filter cookies by domain.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_cookie_delete",
      description: "Delete a cookie by name.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Cookie name to delete." },
          domain: {
            type: "string",
            description: "Cookie domain (optional, for specificity).",
          },
          ...SESSION_ID_PROP,
        },
        required: ["name"],
      },
    },
    {
      name: "browser_cookie_clear",
      description: "Clear all cookies in the current browser context.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },

    // ─── localStorage ─────────────────────────────────────────
    {
      name: "browser_localstorage_get",
      description: "Get a localStorage item by key.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "localStorage key." },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_localstorage_set",
      description: "Set a localStorage item.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "localStorage key." },
          value: { type: "string", description: "Value to store." },
          ...SESSION_ID_PROP,
        },
        required: ["key", "value"],
      },
    },
    {
      name: "browser_localstorage_list",
      description: "List all localStorage key-value pairs.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_localstorage_delete",
      description: "Delete a localStorage item by key.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "localStorage key to delete." },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_localstorage_clear",
      description: "Clear all localStorage data.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },

    // ─── sessionStorage ───────────────────────────────────────
    {
      name: "browser_sessionstorage_get",
      description: "Get a sessionStorage item by key.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "sessionStorage key." },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_sessionstorage_set",
      description: "Set a sessionStorage item.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "sessionStorage key." },
          value: { type: "string", description: "Value to store." },
          ...SESSION_ID_PROP,
        },
        required: ["key", "value"],
      },
    },
    {
      name: "browser_sessionstorage_list",
      description: "List all sessionStorage key-value pairs.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_sessionstorage_delete",
      description: "Delete a sessionStorage item by key.",
      inputSchema: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "sessionStorage key to delete.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_sessionstorage_clear",
      description: "Clear all sessionStorage data.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
  ];
}
