/**
 * DevTools tool definitions (tracing, video recording).
 */

const SESSION_ID_PROP = {
  sessionId: {
    type: "string" as const,
    description:
      "Session ID or name. If omitted, uses the default session. Use session_list to see active sessions.",
  },
};

export function devtoolsToolDefs() {
  return [
    {
      name: "browser_start_tracing",
      description:
        "Start recording a Playwright trace. Captures screenshots, snapshots, and network activity. Stop with browser_stop_tracing to save the trace file.",
      inputSchema: {
        type: "object",
        properties: { ...SESSION_ID_PROP },
      },
    },
    {
      name: "browser_stop_tracing",
      description:
        "Stop tracing and save to a zip file. Open with: npx playwright show-trace <file>.",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description:
              "Output file path (default: /tmp/trace-{timestamp}.zip).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_start_video",
      description:
        "Start video recording of the page. This recreates the browser context with video enabled.",
      inputSchema: {
        type: "object",
        properties: {
          width: {
            type: "number",
            description: "Video width in pixels (default: viewport width).",
          },
          height: {
            type: "number",
            description: "Video height in pixels (default: viewport height).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
    {
      name: "browser_stop_video",
      description: "Stop video recording and save the video file.",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description:
              "Output file path (default: /tmp/video-{timestamp}.webm).",
          },
          ...SESSION_ID_PROP,
        },
      },
    },
  ];
}
