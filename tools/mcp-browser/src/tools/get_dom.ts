import { getDom } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

export const getDomTool: ToolDefinition<Record<string, never>, { html: string }> = {
  name: "get_dom",
  description: "Return the current page's full document HTML.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  async execute() {
    return { html: await getDom() };
  }
};
