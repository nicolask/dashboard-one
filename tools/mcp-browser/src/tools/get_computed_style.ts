import { getComputedStyleSnapshot } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface GetComputedStyleArgs {
  selector: string;
  properties?: string[];
}

export const getComputedStyleTool: ToolDefinition<
  GetComputedStyleArgs,
  {
    selector: string;
    properties: Record<string, string>;
    rect: { x: number; y: number; width: number; height: number };
  }
> = {
  name: "get_computed_style",
  description: "Inspect computed CSS values and element bounds for a selector.",
  inputSchema: {
    type: "object",
    properties: {
      selector: {
        type: "string",
        description: "CSS selector for the element to inspect."
      },
      properties: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional list of CSS property names to return."
      }
    },
    required: ["selector"],
    additionalProperties: false
  },
  async execute(args) {
    return getComputedStyleSnapshot(args.selector, args.properties);
  }
};
