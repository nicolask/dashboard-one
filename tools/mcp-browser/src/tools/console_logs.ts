import { getConsoleLogs } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

export const consoleLogsTool: ToolDefinition<Record<string, never>, { logs: ReturnType<typeof getConsoleLogs> }> = {
  name: "get_console_logs",
  description: "Return collected console.log, console.warn, and console.error entries from the active session.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  async execute() {
    return {
      logs: getConsoleLogs()
    };
  }
};
