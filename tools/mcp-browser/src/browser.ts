import { type Browser, type BrowserContext, type ConsoleMessage, chromium, type Page } from "playwright";

export interface BrowserLogEntry {
  type: "log" | "warn" | "error";
  text: string;
  location?: string;
  timestamp: string;
}

export interface NetworkLogEntry {
  kind: "requestfailed" | "response";
  method: string;
  status?: number;
  statusText?: string;
  url: string;
  failureText?: string;
  timestamp: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_PROTOCOL_VERSION = "2024-11-05";
const DEFAULT_BASE_URL = "http://localhost:3000";

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let activePage: Page | null = null;
let consoleLogs: BrowserLogEntry[] = [];
let networkLogs: NetworkLogEntry[] = [];

function now(): string {
  return new Date().toISOString();
}

function getTimeoutMs(): number {
  const raw = process.env.BROWSER_TIMEOUT_MS;

  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

function getBaseUrl(): string {
  const raw = process.env.BROWSER_BASE_URL?.trim();
  return raw && raw.length > 0 ? raw : DEFAULT_BASE_URL;
}

function isHeadless(): boolean {
  const raw = process.env.BROWSER_HEADLESS?.trim().toLowerCase();
  return raw !== "0" && raw !== "false";
}

function toLocation(message: ConsoleMessage): string | undefined {
  const location = message.location();

  if (!location.url) {
    return undefined;
  }

  const linePart = location.lineNumber ? `:${location.lineNumber}` : "";
  const columnPart = location.columnNumber ? `:${location.columnNumber}` : "";
  return `${location.url}${linePart}${columnPart}`;
}

function pushConsoleLog(message: ConsoleMessage): void {
  const messageType = message.type();
  let normalizedType: BrowserLogEntry["type"] | null = null;

  if (messageType === "log") {
    normalizedType = "log";
  } else if (messageType === "warning") {
    normalizedType = "warn";
  } else if (messageType === "error") {
    normalizedType = "error";
  }

  if (!normalizedType) {
    return;
  }

  consoleLogs.push({
    type: normalizedType,
    text: message.text(),
    location: toLocation(message),
    timestamp: now()
  });
}

function bindPageListeners(page: Page): void {
  page.on("console", (message) => {
    pushConsoleLog(message);
  });

  page.on("pageerror", (error) => {
    consoleLogs.push({
      type: "error",
      text: error.message,
      timestamp: now()
    });
  });

  page.on("requestfailed", (request) => {
    networkLogs.push({
      kind: "requestfailed",
      method: request.method(),
      url: request.url(),
      failureText: request.failure()?.errorText,
      timestamp: now()
    });
  });

  page.on("response", (response) => {
    if (response.status() < 400) {
      return;
    }

    networkLogs.push({
      kind: "response",
      method: response.request().method(),
      status: response.status(),
      statusText: response.statusText(),
      url: response.url(),
      timestamp: now()
    });
  });
}

async function ensureContext(): Promise<BrowserContext> {
  if (context) {
    return context;
  }

  if (!browser) {
    browser = await chromium.launch({
      headless: isHeadless()
    });
  }

  context = await browser.newContext();
  context.setDefaultNavigationTimeout(getTimeoutMs());
  context.setDefaultTimeout(getTimeoutMs());
  return context;
}

export function getDefaultProtocolVersion(): string {
  return DEFAULT_PROTOCOL_VERSION;
}

export function resolveUrl(input: string): string {
  if (/^[a-z][a-z\d+\-.]*:/i.test(input)) {
    return input;
  }

  return new URL(input, getBaseUrl()).toString();
}

export async function openPage(url: string): Promise<{ url: string; title: string }> {
  const browserContext = await ensureContext();
  const page = await browserContext.newPage();
  bindPageListeners(page);
  activePage = page;
  const resolvedUrl = resolveUrl(url);

  await page.goto(resolvedUrl, {
    timeout: getTimeoutMs(),
    waitUntil: "domcontentloaded"
  });

  return {
    url: page.url(),
    title: await page.title()
  };
}

export function requireActivePage(): Page {
  if (!activePage) {
    throw new Error("No active page. Call open_page(url) first.");
  }

  return activePage;
}

export async function getDom(): Promise<string> {
  const page = requireActivePage();
  return page.evaluate(() => document.documentElement.outerHTML);
}

export async function getScreenshotBase64(): Promise<string> {
  const page = requireActivePage();
  const buffer = await page.screenshot({
    type: "png",
    timeout: getTimeoutMs()
  });

  return buffer.toString("base64");
}

export async function evaluateJs(script: string): Promise<unknown> {
  const page = requireActivePage();
  return page.evaluate(
    ({ source }) => {
      return (0, eval)(source);
    },
    { source: script }
  );
}

export async function clickSelector(selector: string): Promise<{ selector: string }> {
  const page = requireActivePage();
  await page.locator(selector).click({
    timeout: getTimeoutMs()
  });
  return { selector };
}

export async function typeIntoSelector(selector: string, text: string): Promise<{ selector: string; textLength: number }> {
  const page = requireActivePage();
  await page.locator(selector).fill(text, {
    timeout: getTimeoutMs()
  });
  return {
    selector,
    textLength: text.length
  };
}

export async function setViewportSize(
  width: number,
  height: number
): Promise<{ width: number; height: number }> {
  const page = requireActivePage();
  await page.setViewportSize({ width, height });
  return { width, height };
}

export async function waitForSelector(
  selector: string,
  state: "attached" | "detached" | "visible" | "hidden" = "visible"
): Promise<{ selector: string; state: string }> {
  const page = requireActivePage();
  await page.waitForSelector(selector, {
    state,
    timeout: getTimeoutMs()
  });

  return {
    selector,
    state
  };
}

export async function getComputedStyleSnapshot(
  selector: string,
  properties?: string[]
): Promise<{
  selector: string;
  properties: Record<string, string>;
  rect: { x: number; y: number; width: number; height: number };
}> {
  const page = requireActivePage();
  return page.locator(selector).evaluate((element, payload) => {
    if (!(element instanceof Element)) {
      throw new Error("Selector did not resolve to an element.");
    }

    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const defaultProperties = [
      "display",
      "position",
      "width",
      "height",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "font-size",
      "font-weight",
      "line-height",
      "justify-content",
      "align-items",
      "gap"
    ];
    const names = payload.properties && payload.properties.length > 0 ? payload.properties : defaultProperties;
    const properties = Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));

    return {
      selector: payload.selector,
      properties,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    };
  }, { selector, properties });
}

export function getConsoleLogs(): BrowserLogEntry[] {
  return [...consoleLogs];
}

export function getNetworkLogs(): NetworkLogEntry[] {
  return [...networkLogs];
}

export async function resetBrowser(): Promise<void> {
  activePage = null;
  consoleLogs = [];
  networkLogs = [];

  await context?.close();
  context = null;

  await browser?.close();
  browser = null;
}

export async function shutdownBrowser(): Promise<void> {
  try {
    await resetBrowser();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[mcp-browser] shutdown error: ${message}\n`);
  }
}
