/**
 * Extra tool definitions (PDF, arbitrary code, form fill, locator generation).
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function extraToolDefs() {
  return [
    {
      name: "browser_pdf_save",
      description:
        "Save the current page as a PDF file. Only works in Chromium-based browsers.",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description:
              "Output file path (default: /tmp/page-{timestamp}.pdf).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_run_code",
      description:
        "Run arbitrary Playwright code with `page` and `context` objects in scope. The code is an async function body — use `await` freely. Return a value to see it in the response.",
      inputSchema: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description:
              "Async function body with `page` and `context` available. Example: 'const title = await page.title(); return title;'",
          },
          ...SESSION_ID_PROP,
        },
        required: ["code"],
      },
    },
    {
      name: "browser_fill_form",
      description:
        "Fill multiple form fields at once. Each field can be targeted by ref number or CSS selector.",
      inputSchema: {
        type: "object",
        properties: {
          fields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                selector: {
                  type: "string",
                  description: "CSS or Playwright selector for the field.",
                },
                ref: {
                  type: "number",
                  description: "Ref number from a recent snapshot.",
                },
                value: {
                  type: "string",
                  description: "Value to fill into the field.",
                },
              },
              required: ["value"],
            },
            description: "Array of fields to fill.",
          },
          ...SESSION_ID_PROP,
        },
        required: ["fields"],
      },
    },
    {
      name: "browser_generate_locator",
      description:
        "Generate a stable Playwright locator string for an element. Useful for building test scripts from interactive exploration.",
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
  ];
}
