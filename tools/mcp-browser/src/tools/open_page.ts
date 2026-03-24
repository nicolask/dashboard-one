import { openPage } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface OpenPageArgs {
  url: string;
}

export const openPageTool: ToolDefinition<OpenPageArgs, { url: string; title: string }> = {
  name: "open_page",
  description: "Launch Chromium lazily, open a fresh page, and navigate to the provided URL.",
  inputSchema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Absolute URL to open in Chromium."
      }
    },
    required: ["url"],
    additionalProperties: false
  },
  async execute(args) {
    return openPage(args.url);
  }
};
