/**
 * Mouse / coordinate-based tool definitions.
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function coordinateToolDefs() {
  return [
    {
      name: "browser_mouse_click_xy",
      description: "Click at specific x,y coordinates on the page.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate in pixels." },
          y: { type: "number", description: "Y coordinate in pixels." },
          button: {
            type: "string",
            enum: ["left", "right", "middle"],
            description: "Mouse button to click (default: left).",
          },
          clickCount: {
            type: "number",
            description:
              "Number of clicks (default: 1). Use 2 for double-click.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["x", "y"],
      },
    },
    {
      name: "browser_mouse_move_xy",
      description: "Move the mouse to specific x,y coordinates.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate in pixels." },
          y: { type: "number", description: "Y coordinate in pixels." },
          ...SESSION_ID_PROP,
        },
        required: ["x", "y"],
      },
    },
    {
      name: "browser_mouse_wheel",
      description: "Scroll the mouse wheel by delta amounts.",
      inputSchema: {
        type: "object",
        properties: {
          deltaX: {
            type: "number",
            description: "Horizontal scroll amount in pixels (default: 0).",
          },
          deltaY: {
            type: "number",
            description:
              "Vertical scroll amount in pixels (default: 0). Positive scrolls down.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_mouse_down",
      description:
        "Press and hold a mouse button down at the current position.",
      inputSchema: {
        type: "object",
        properties: {
          button: {
            type: "string",
            enum: ["left", "right", "middle"],
            description: "Mouse button to press (default: left).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_mouse_up",
      description: "Release a mouse button at the current position.",
      inputSchema: {
        type: "object",
        properties: {
          button: {
            type: "string",
            enum: ["left", "right", "middle"],
            description: "Mouse button to release (default: left).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_mouse_drag_xy",
      description:
        "Drag from a start position to an end position using coordinates.",
      inputSchema: {
        type: "object",
        properties: {
          startX: { type: "number", description: "Starting X coordinate." },
          startY: { type: "number", description: "Starting Y coordinate." },
          endX: { type: "number", description: "Ending X coordinate." },
          endY: { type: "number", description: "Ending Y coordinate." },
          ...SESSION_ID_PROP,
        },
        required: ["startX", "startY", "endX", "endY"],
      },
    },
  ];
}
