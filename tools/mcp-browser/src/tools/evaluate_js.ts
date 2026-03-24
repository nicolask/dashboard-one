import { evaluateJs } from "../browser.js";
import type { ToolDefinition } from "../tool.js";

interface EvaluateJsArgs {
  script: string;
}

export const evaluateJsTool: ToolDefinition<EvaluateJsArgs, { result: unknown }> = {
  name: "evaluate_js",
  description: "Evaluate JavaScript in the active page context and return the serialized result.",
  inputSchema: {
    type: "object",
    properties: {
      script: {
        type: "string",
        description: "JavaScript source to evaluate inside the page."
      }
    },
    required: ["script"],
    additionalProperties: false
  },
  async execute(args) {
    return {
      result: await evaluateJs(args.script)
    };
  }
};
