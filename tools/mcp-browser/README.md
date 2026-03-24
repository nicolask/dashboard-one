# MCP Browser Tool

Minimal MCP stdio server that gives an agent browser access through Playwright Chromium.

It is intentionally separate from the Next.js app and meant for local development workflows such as:

- inspect KPI cards on `/dashboard`
- compare desktop vs. mobile layout
- spot bad spacing, overflow, and alignment
- collect DOM, screenshot, console, and network evidence before changing code

## Start

```bash
cd /Users/nicolas/work/dev/agentic/dashboard-one/tools/mcp-browser
npm install
npx playwright install chromium
npm run build
npm start
```

## Development Assumptions

- the dashboard app is already running locally, typically on `http://localhost:3000`
- `open_page` accepts absolute URLs
- `open_page` also accepts relative paths such as `/login` or `/dashboard`
- relative paths resolve against `BROWSER_BASE_URL`, which defaults to `http://localhost:3000`

Optional environment variables:

- `BROWSER_BASE_URL` default base URL for relative paths
- `BROWSER_TIMEOUT_MS` default timeout for actions and navigation
- `BROWSER_HEADLESS` set to `false` or `0` to see the browser window

## MCP Server Command

Example MCP client configuration:

- command: `node`
- args: `["/Users/nicolas/work/dev/agentic/dashboard-one/tools/mcp-browser/dist/index.js"]`

Or:

- command: `npm`
- args: `["start"]`
- cwd: `/Users/nicolas/work/dev/agentic/dashboard-one/tools/mcp-browser`

## Available Tools

- `open_page(url)`
- `get_dom()`
- `get_screenshot()`
- `evaluate_js(script)`
- `get_console_logs()`
- `click(selector)`
- `type(selector, text)`
- `set_viewport(width, height)`
- `wait_for_selector(selector, state?)`
- `get_computed_style(selector, properties?)`
- `get_network_logs()`
- `reset_browser()`

## Suggested Agent Workflow

For a prompt like "look at the EBIT/profit card and tell me how to present large numbers better", a good sequence is:

1. `open_page("/dashboard")`
2. `wait_for_selector(...)` for the KPI grid or target card
3. `set_viewport(1440, 1100)` and `get_screenshot()`
4. `get_computed_style(...)` for the card container, value, and label
5. Repeat with `set_viewport(390, 844)` for mobile
6. Use `get_dom()` or `evaluate_js(...)` if text content or layout structure needs confirmation

## Example

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"agent","version":"0.1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"open_page","arguments":{"url":"/dashboard"}}}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"set_viewport","arguments":{"width":1440,"height":1100}}}
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_screenshot","arguments":{}}}
```
