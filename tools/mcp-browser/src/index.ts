import { getDefaultProtocolVersion, shutdownBrowser } from "./browser.js";
import type { ToolDefinition } from "./tool.js";
import { clickTool } from "./tools/click.js";
import { consoleLogsTool } from "./tools/console_logs.js";
import { evaluateJsTool } from "./tools/evaluate_js.js";
import { getComputedStyleTool } from "./tools/get_computed_style.js";
import { getDomTool } from "./tools/get_dom.js";
import { networkLogsTool } from "./tools/network_logs.js";
import { openPageTool } from "./tools/open_page.js";
import { resetBrowserTool } from "./tools/reset_browser.js";
import { setViewportTool } from "./tools/set_viewport.js";
import { getScreenshotTool } from "./tools/get_screenshot.js";
import { typeTool } from "./tools/type.js";
import { waitForSelectorTool } from "./tools/wait_for_selector.js";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

const tools: Array<ToolDefinition<any, unknown>> = [
  openPageTool,
  getDomTool,
  getScreenshotTool,
  evaluateJsTool,
  consoleLogsTool,
  clickTool,
  typeTool,
  setViewportTool,
  waitForSelectorTool,
  getComputedStyleTool,
  networkLogsTool,
  resetBrowserTool
];

const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
let inputBuffer = Buffer.alloc(0);
let negotiatedProtocolVersion = getDefaultProtocolVersion();
let shuttingDown = false;
let processingQueue = Promise.resolve();

function stderr(message: string): void {
  process.stderr.write(`[mcp-browser] ${message}\n`);
}

function sendMessage(payload: JsonRpcResponse): void {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "utf8");
  process.stdout.write(Buffer.concat([header, body]));
}

function sendResult(id: string | number | null, result: unknown): void {
  sendMessage({
    jsonrpc: "2.0",
    id,
    result
  });
}

function sendError(id: string | number | null, code: number, message: string, data?: unknown): void {
  sendMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data
    }
  });
}

function readMessage(): JsonRpcRequest | null {
  const delimiter = inputBuffer.indexOf("\r\n\r\n");

  if (delimiter === -1) {
    return null;
  }

  const headerText = inputBuffer.subarray(0, delimiter).toString("utf8");
  const headers = new Map<string, string>();

  for (const line of headerText.split("\r\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    headers.set(name, value);
  }

  const contentLengthValue = headers.get("content-length");
  const contentLength = contentLengthValue ? Number.parseInt(contentLengthValue, 10) : Number.NaN;

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    throw new Error("Received message without a valid Content-Length header.");
  }

  const messageStart = delimiter + 4;
  const messageEnd = messageStart + contentLength;

  if (inputBuffer.length < messageEnd) {
    return null;
  }

  const raw = inputBuffer.subarray(messageStart, messageEnd).toString("utf8");
  inputBuffer = inputBuffer.subarray(messageEnd);
  return JSON.parse(raw) as JsonRpcRequest;
}

function formatToolText(name: string, result: unknown): string {
  switch (name) {
    case "get_dom":
      return "Returned full document HTML.";
    case "get_screenshot": {
      const data = (result as { data?: string }).data ?? "";
      return `Captured screenshot (${data.length} base64 chars).`;
    }
    case "get_console_logs":
    case "get_network_logs": {
      const logs = (result as { logs?: unknown[] }).logs ?? [];
      return `Returned ${logs.length} log entries.`;
    }
    case "wait_for_selector":
      return "Selector reached the requested state.";
    case "set_viewport":
      return "Viewport updated.";
    case "get_computed_style":
      return "Returned computed style snapshot.";
    case "reset_browser":
      return "Browser state reset.";
    default:
      return JSON.stringify(result);
  }
}

async function handleToolCall(id: string | number | null, params: Record<string, unknown> | undefined): Promise<void> {
  const name = typeof params?.name === "string" ? params.name : null;
  const args = typeof params?.arguments === "object" && params.arguments !== null ? params.arguments as Record<string, unknown> : {};

  if (!name) {
    sendError(id, -32602, "Missing tool name.");
    return;
  }

  const tool = toolMap.get(name);

  if (!tool) {
    sendError(id, -32602, `Unknown tool: ${name}`);
    return;
  }

  try {
    const result = await tool.execute(args);
    sendResult(id, {
      content: [
        {
          type: "text",
          text: formatToolText(name, result)
        }
      ],
      structuredContent: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendResult(id, {
      content: [
        {
          type: "text",
          text: message
        }
      ],
      structuredContent: {
        error: message
      },
      isError: true
    });
  }
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
  const id = request.id ?? null;

  switch (request.method) {
    case "initialize": {
      const requestedVersion = request.params?.protocolVersion;

      if (typeof requestedVersion === "string" && requestedVersion.length > 0) {
        negotiatedProtocolVersion = requestedVersion;
      }

      sendResult(id, {
        protocolVersion: negotiatedProtocolVersion,
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "mcp-browser",
          version: "0.1.0"
        }
      });
      return;
    }

    case "notifications/initialized":
      return;

    case "ping":
      sendResult(id, {});
      return;

    case "tools/list":
      sendResult(id, {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      });
      return;

    case "tools/call":
      await handleToolCall(id, request.params);
      return;

    default:
      sendError(id, -32601, `Method not found: ${request.method}`);
  }
}

async function drainBuffer(): Promise<void> {
  while (true) {
    const message = readMessage();

    if (!message) {
      return;
    }

    await handleRequest(message);
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  stderr(`received ${signal}, shutting down`);
  await shutdownBrowser();
  process.exit(0);
}

process.stdin.on("data", (chunk: Buffer) => {
  inputBuffer = Buffer.concat([inputBuffer, chunk]);
  processingQueue = processingQueue
    .then(async () => {
      await drainBuffer();
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      stderr(`request handling failed: ${message}`);
      sendError(null, -32700, message);
    });
});

process.stdin.on("end", async () => {
  await shutdown("stdin-end");
});

process.on("SIGINT", async () => {
  await shutdown("SIGINT");
});

process.on("SIGTERM", async () => {
  await shutdown("SIGTERM");
});

process.on("uncaughtException", async (error) => {
  stderr(`uncaught exception: ${error.message}`);
  await shutdownBrowser();
  process.exit(1);
});

process.on("unhandledRejection", async (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  stderr(`unhandled rejection: ${message}`);
  await shutdownBrowser();
  process.exit(1);
});
