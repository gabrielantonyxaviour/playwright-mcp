/**
 * Network mocking tool definitions.
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function networkToolDefs() {
  return [
    {
      name: "browser_route",
      description:
        "Mock network requests matching a URL pattern. Intercepts requests and returns a custom response.",
      inputSchema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description:
              "URL pattern to match (glob like '**/api/**' or regex).",
          },
          status: {
            type: "number",
            description: "HTTP status code to return (default: 200).",
          },
          body: {
            type: "string",
            description: "Response body string.",
          },
          contentType: {
            type: "string",
            description: "Content-Type header (default: application/json).",
          },
          headers: {
            type: "object",
            description: "Additional response headers as key-value pairs.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["pattern"],
      },
    },
    {
      name: "browser_unroute",
      description:
        "Remove network route(s). Omit pattern to remove all active routes.",
      inputSchema: {
        type: "object",
        properties: {
          pattern: {
            type: "string",
            description: "URL pattern to unroute. Omit to remove all routes.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_route_list",
      description: "List all active network routes for the session.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_network_state_set",
      description:
        "Set the browser's network state to online or offline. Useful for testing offline behavior.",
      inputSchema: {
        type: "object",
        properties: {
          online: {
            type: "boolean",
            description: "True for online, false for offline.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["online"],
      },
    },
  ];
}
