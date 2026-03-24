import { resetBrowser } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

export const resetBrowserTool: ToolDefinition<Record<string, never>, { reset: true }> = {
  name: "reset_browser",
  description: "Close the active browser/context, clear logs, and reset internal state.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  async execute() {
    await resetBrowser();
    return { reset: true };
  }
};
