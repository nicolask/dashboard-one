import { getNetworkLogs } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

export const networkLogsTool: ToolDefinition<Record<string, never>, { logs: ReturnType<typeof getNetworkLogs> }> = {
  name: "get_network_logs",
  description: "Return collected failed-request and HTTP error response entries from the active session.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  async execute() {
    return {
      logs: getNetworkLogs()
    };
  }
};
