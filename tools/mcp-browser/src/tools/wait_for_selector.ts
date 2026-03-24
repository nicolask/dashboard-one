import { waitForSelector } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface WaitForSelectorArgs {
  selector: string;
  state?: "attached" | "detached" | "visible" | "hidden";
}

export const waitForSelectorTool: ToolDefinition<WaitForSelectorArgs, { selector: string; state: string }> = {
  name: "wait_for_selector",
  description: "Wait for a selector to reach a given state before continuing.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector to wait for."
      },
      state: {
        type: "string",
        enum: ["attached", "detached", "visible", "hidden"],
        description: "Desired selector state. Defaults to visible."
      }
    },
    required: ["selector"],
    additionalProperties: false
  },
  async execute(args) {
    return waitForSelector(args.selector, args.state);
  }
};
