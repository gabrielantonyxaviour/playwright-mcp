/**
 * Browser tool definitions (navigation, observation, interaction, utility).
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function browserToolDefs() {
  return [
    // ─── Navigation ───────────────────────────────────────────
    {
      name: "browser_navigate",
      description: "Navigate to a URL in the active page of a session.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to navigate to." },
          ...SESSION_ID_PROP,
        },
        required: ["url"],
      },
    },
    {
      name: "browser_navigate_back",
      description: "Go back in browser history.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_tabs",
      description:
        "List all open tabs/pages in a session, or switch to a specific tab by index.",
      inputSchema: {
        type: "object",
        properties: {
          switchTo: {
            type: "number",
            description:
              "Tab index to switch to (0-based). Omit to just list tabs.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_new_tab",
      description:
        "Open a new tab in the session and optionally navigate to a URL.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL to open in the new tab." },
          ...SESSION_ID_PROP,
        },
      },
    },

    // ─── Observation ──────────────────────────────────────────
    {
      name: "browser_snapshot",
      description:
        "Take an accessibility snapshot of the current page. Returns a numbered tree where interactive elements have [ref] numbers you can use in click/type/etc. Always take a snapshot before interacting with a page.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_take_screenshot",
      description:
        "Take a screenshot of the current page. Returns base64-encoded PNG image.",
      inputSchema: {
        type: "object",
        properties: {
          fullPage: {
            type: "boolean",
            description: "Capture full scrollable page (default: false).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_console_messages",
      description: "Get recent console messages from the page.",
      inputSchema: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of recent messages to return (default: 20).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_network_requests",
      description:
        "Get recent network requests and responses. Useful for debugging API calls.",
      inputSchema: {
        type: "object",
        properties: {
          count: {
            type: "number",
            description: "Number of recent requests to return (default: 20).",
          },
          urlFilter: {
            type: "string",
            description: "Only show requests whose URL contains this string.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },

    // ─── Interaction ──────────────────────────────────────────
    {
      name: "browser_click",
      description:
        "Click an element. Use ref from a recent snapshot, or provide a CSS/text selector.",
      inputSchema: {
        type: "object",
        properties: {
          ref: {
            type: "number",
            description: "Ref number from the most recent snapshot.",
          },
          selector: {
            type: "string",
            description:
              "CSS selector or Playwright selector (e.g. 'text=Submit', 'role=button[name=\"Save\"]').",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_type",
      description:
        "Type text into the currently focused element or a specified element. Use for character-by-character input.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to type." },
          ref: { type: "number", description: "Ref number to click first." },
          selector: { type: "string", description: "Selector to click first." },
          ...SESSION_ID_PROP,
        },
        required: ["text"],
      },
    },
    {
      name: "browser_fill",
      description:
        "Fill a form field with text (clears existing content first). Faster than browser_type for form inputs.",
      inputSchema: {
        type: "object",
        properties: {
          value: { type: "string", description: "Value to fill." },
          ref: { type: "number", description: "Ref number of the input." },
          selector: { type: "string", description: "Selector of the input." },
          ...SESSION_ID_PROP,
        },
        required: ["value"],
      },
    },
    {
      name: "browser_select_option",
      description: "Select an option from a dropdown/select element.",
      inputSchema: {
        type: "object",
        properties: {
          value: {
            type: "string",
            description: "Option value or label to select.",
          },
          ref: { type: "number" },
          selector: { type: "string" },
          ...SESSION_ID_PROP,
        },
        required: ["value"],
      },
    },
    {
      name: "browser_hover",
      description: "Hover over an element.",
      inputSchema: {
        type: "object",
        properties: {
          ref: { type: "number" },
          selector: { type: "string" },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_drag",
      description: "Drag from one element to another.",
      inputSchema: {
        type: "object",
        properties: {
          sourceRef: { type: "number", description: "Ref of the drag source." },
          targetRef: { type: "number", description: "Ref of the drop target." },
          sourceSelector: { type: "string" },
          targetSelector: { type: "string" },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_press_key",
      description:
        "Press a keyboard key or key combination (e.g. 'Enter', 'Meta+a', 'ArrowDown').",
      inputSchema: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description:
              "Key to press (e.g. 'Enter', 'Tab', 'Meta+c', 'Escape').",
          },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_file_upload",
      description: "Upload file(s) to a file input element.",
      inputSchema: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Absolute file paths to upload.",
          },
          ref: { type: "number" },
          selector: { type: "string" },
          ...SESSION_ID_PROP,
        },
        required: ["paths"],
      },
    },
    {
      name: "browser_handle_filechooser",
      description:
        "Click a button that opens a file dialog AND upload files atomically. Playwright intercepts the native OS file picker before it appears. Provide the ref or selector of the button that triggers the file dialog, plus the file paths to upload.",
      inputSchema: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Absolute file paths to upload.",
          },
          ref: {
            type: "number",
            description: "Ref of the button that triggers the file dialog.",
          },
          selector: {
            type: "string",
            description:
              "CSS selector of the button that triggers the file dialog.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["paths"],
      },
    },
    {
      name: "browser_handle_dialog",
      description:
        "Handle a JavaScript dialog (alert, confirm, prompt). Call this BEFORE triggering the action that opens the dialog.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["accept", "dismiss"],
            description: "Whether to accept or dismiss the dialog.",
          },
          promptText: {
            type: "string",
            description: "Text to enter in a prompt dialog.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["action"],
      },
    },

    // ─── Utility ──────────────────────────────────────────────
    {
      name: "browser_evaluate",
      description:
        "Execute JavaScript in the page and return the result. The expression is evaluated in the page context.",
      inputSchema: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "JavaScript expression to evaluate.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["expression"],
      },
    },
    {
      name: "browser_wait_for",
      description:
        "Wait for a condition: element visible, hidden, or a timeout.",
      inputSchema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS/Playwright selector to wait for.",
          },
          state: {
            type: "string",
            enum: ["visible", "hidden", "attached", "detached"],
            description: "State to wait for (default: visible).",
          },
          timeout: {
            type: "number",
            description: "Max wait time in ms (default: 30000).",
          },
          ...SESSION_ID_PROP,
        },
        required: ["selector"],
      },
    },
    {
      name: "browser_resize",
      description: "Resize the browser viewport.",
      inputSchema: {
        type: "object",
        properties: {
          width: { type: "number", description: "Viewport width in pixels." },
          height: { type: "number", description: "Viewport height in pixels." },
          ...SESSION_ID_PROP,
        },
        required: ["width", "height"],
      },
    },
    {
      name: "browser_close",
      description:
        "Close all sessions and the browser. Use session_close to close individual sessions.",
      inputSchema: { type: "object", properties: {} },
    },

    // ─── Added to match/exceed Microsoft @playwright/mcp ─────────
    {
      name: "browser_navigate_forward",
      description: "Go forward to the next page in the browser history.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_reload",
      description: "Reload the current page.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_console_clear",
      description: "Clear all captured console messages for the session.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_network_clear",
      description: "Clear all captured network request logs for the session.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_press_sequentially",
      description:
        "Type text character-by-character using keyboard events. Unlike browser_fill, this fires individual keydown/keypress/keyup events per character. Optionally submit with Enter.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to type." },
          submit: {
            type: "boolean",
            description: "Press Enter after typing (default: false).",
          },
          ...SESSION_ID_PROP,
        },
        required: ["text"],
      },
    },
    {
      name: "browser_keydown",
      description: "Press and hold a keyboard key down (without releasing).",
      inputSchema: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Key name (e.g. 'Shift', 'Control', 'ArrowLeft').",
          },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_keyup",
      description: "Release a keyboard key that was held down.",
      inputSchema: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "Key name (e.g. 'Shift', 'Control', 'ArrowLeft').",
          },
          ...SESSION_ID_PROP,
        },
        required: ["key"],
      },
    },
    {
      name: "browser_check",
      description: "Check a checkbox or radio button element.",
      inputSchema: {
        type: "object",
        properties: {
          ref: {
            type: "number",
            description: "Ref number from a recent snapshot.",
          },
          selector: {
            type: "string",
            description: "CSS or Playwright selector.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_uncheck",
      description: "Uncheck a checkbox element.",
      inputSchema: {
        type: "object",
        properties: {
          ref: {
            type: "number",
            description: "Ref number from a recent snapshot.",
          },
          selector: {
            type: "string",
            description: "CSS or Playwright selector.",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_verify_element_visible",
      description:
        "Assert that an element with a given ARIA role and accessible name is visible on the page. Throws if not found or not visible.",
      inputSchema: {
        type: "object",
        properties: {
          role: {
            type: "string",
            description:
              "ARIA role of the element (e.g. 'button', 'heading', 'textbox').",
          },
          accessibleName: {
            type: "string",
            description: "Accessible name / label of the element.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["role", "accessibleName"],
      },
    },
    {
      name: "browser_verify_text_visible",
      description:
        "Assert that a text string is visible anywhere on the page. Throws if the text is not found.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to look for on the page.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["text"],
      },
    },
    {
      name: "browser_verify_value",
      description:
        "Assert that an input, textarea, or select has a specific value. Throws if the value does not match.",
      inputSchema: {
        type: "object",
        properties: {
          value: {
            type: "string",
            description: "Expected value of the element.",
          },
          ref: {
            type: "number",
            description: "Ref number from a recent snapshot.",
          },
          selector: {
            type: "string",
            description: "CSS or Playwright selector.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["value"],
      },
    },
    {
      name: "browser_storage_state",
      description:
        "Export the full browser context storage state (cookies + localStorage) as JSON. Useful for snapshotting or sharing auth state.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_set_storage_state",
      description:
        "Apply a storage state JSON (cookies + localStorage) to the current session context. Accepts the same format exported by browser_storage_state or session_storage_state.",
      inputSchema: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description:
              "Storage state JSON string with { cookies, origins } structure.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["state"],
      },
    },
    {
      name: "browser_verify_list_visible",
      description:
        "Assert that a list of text strings are all visible on the page. Throws with the missing items if any are not found.",
      inputSchema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
            description: "Array of text strings that must all be visible.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["items"],
      },
    },
  ];
}
