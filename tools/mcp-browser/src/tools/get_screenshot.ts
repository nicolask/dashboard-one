import { getScreenshotBase64 } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

export const getScreenshotTool: ToolDefinition<Record<string, never>, { mimeType: string; data: string }> = {
  name: "get_screenshot",
  description: "Capture a PNG screenshot of the current page and return it as base64.",
  inputSchema: {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  async execute() {
    return {
      mimeType: "image/png",
      data: await getScreenshotBase64()
    };
  }
};
