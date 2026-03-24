import { clickSelector } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface ClickArgs {
  selector: string;
}

export const clickTool: ToolDefinition<ClickArgs, { selector: string }> = {
  name: "click",
  description: "Click the first element that matches the provided CSS selector.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector for the target element."
      }
    },
    required: ["selector"],
    additionalProperties: false
  },
  async execute(args) {
    return clickSelector(args.selector);
  }
};
