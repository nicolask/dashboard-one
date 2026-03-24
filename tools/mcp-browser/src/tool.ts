export interface ToolDefinition<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: TArgs) => Promise<TResult>;
}
