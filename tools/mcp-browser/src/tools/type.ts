import { typeIntoSelector } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface TypeArgs {
  selector: string;
  text: string;
}

export const typeTool: ToolDefinition<TypeArgs, { selector: string; textLength: number }> = {
  name: "type",
  description: "Fill an input-like element matched by CSS selector with the provided text.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector for the target input or textarea."
      },
      text: {
        type: "string",
        description: "Text to enter."
      }
    },
    required: ["selector", "text"],
    additionalProperties: false
  },
  async execute(args) {
    return typeIntoSelector(args.selector, args.text);
  }
};
