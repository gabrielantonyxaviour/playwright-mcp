#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { SessionManager } from "./session-manager.js";
import { buildToolDefinitions } from "./tools/index.js";
import { handleToolCall } from "./handlers/index.js";

// Parse CLI args
const args = process.argv.slice(2);
const headless = args.includes("--headless");
const browserArg = args.find((a) => a.startsWith("--browser="));
const browserType =
  (browserArg?.split("=")[1] as "chromium" | "firefox" | "webkit") ||
  "chromium";
const viewportArg = args.find((a) => a.startsWith("--viewport="));
const viewport = viewportArg
  ? {
      width: parseInt(viewportArg.split("=")[1].split("x")[0]),
      height: parseInt(viewportArg.split("=")[1].split("x")[1]),
    }
  : { width: 1280, height: 720 };
const idleArg = args.find((a) => a.startsWith("--idle-timeout="));
const idleTimeoutMs = idleArg
  ? parseInt(idleArg.split("=")[1]) * 1000
  : undefined;
const maxSessionsArg = args.find((a) => a.startsWith("--max-sessions="));
const maxSessions = maxSessionsArg
  ? parseInt(maxSessionsArg.split("=")[1])
  : undefined;

const channelArg = args.find((a) => a.startsWith("--channel="));
const channel = channelArg ? channelArg.split("=")[1] : undefined;

const manager = new SessionManager({
  headless,
  browserType,
  channel,
  viewport,
  idleTimeoutMs,
  maxSessions,
});

const server = new Server(
  { name: "playwright-sessions", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: buildToolDefinitions(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: toolArgs } = request.params;
  try {
    const result = await handleToolCall(name, toolArgs || {}, manager);
    return { content: [{ type: "text", text: result }] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Cleanup on exit
process.on("SIGINT", async () => {
  await manager.closeAll();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await manager.closeAll();
  process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
