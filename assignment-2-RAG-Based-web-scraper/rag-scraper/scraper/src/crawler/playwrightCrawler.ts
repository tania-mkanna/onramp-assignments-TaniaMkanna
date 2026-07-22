import { chromium} from "playwright";
import type {Browser} from "playwright";
import { canScrape } from "./robots.js";
import type { FetchResult } from "./httpCrawler.js";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserInstance;
}

export async function fetchDynamicHTML(url: string): Promise<FetchResult> {
  // 1. Robots.txt Compliance Check
  const allowed = await canScrape(url);
  if (!allowed) {
    throw new Error(`[Robots.txt] Scraping blocked for URL: ${url}`);
  }

  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: "rag-scraper-bot/1.0 (+https://github.com/your-repo)",
  });
  const page = await context.newPage();

  try {
    // 2. Navigate and wait for network idle to ensure JS rendering finishes
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 15000,
    });

    const statusCode = response ? response.status() : 200;
    const html = await page.content();

    await context.close();

    return {
      html,
      statusCode,
    };
  } catch (error) {
    await context.close();
    console.error(`[Playwright Failure] Error fetching ${url}:`, error);
    throw error;
  }
}

export async function closeBrowserSingleton(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}