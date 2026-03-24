import { setViewportSize } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface SetViewportArgs {
  width: number;
  height: number;
}

export const setViewportTool: ToolDefinition<SetViewportArgs, { width: number; height: number }> = {
  name: "set_viewport",
  description: "Set the active page viewport size for responsive UI checks.",
  inputSchema: {
    type: "object",
    properties: {
      width: {
        type: "number",
        description: "Viewport width in CSS pixels."
      },
      height: {
        type: "number",
        description: "Viewport height in CSS pixels."
      }
    },
    required: ["width", "height"],
    additionalProperties: false
  },
  async execute(args) {
    return setViewportSize(args.width, args.height);
  }
};
