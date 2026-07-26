import {
  chromium,
  type Browser,
} from "playwright";

import type {
  CrawlResult,
} from "./httpCrawler.js";

let browserInstance:
  | Browser
  | null = null;

async function getBrowser(): Promise<Browser> {
  if (
    !browserInstance ||
    !browserInstance.isConnected()
  ) {
    browserInstance =
      await chromium.launch({
        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      });
  }

  return browserInstance;
}

export async function fetchDynamicHTML(
  url: string,
): Promise<CrawlResult> {
  console.log(
    `[Playwright Crawler] Fetching ${url}`,
  );

  const browser =
    await getBrowser();

  const context =
    await browser.newContext({
      userAgent:
        "Distributed-RAG-Scraper/1.0",
    });

  const page =
    await context.newPage();

  try {
    const response =
      await page.goto(
        url,
        {
          waitUntil:
            "networkidle",

          timeout:
            15_000,
        },
      );

    const html =
      await page.content();

    return {
      url,

      html,

      statusCode:
        response?.status() ?? 200,

      contentType:
        "text/html",

      fetchedAt:
        new Date(),
    };
  } finally {
    await context.close();
  }
}

export async function closeBrowserSingleton() {
  if (browserInstance) {
    await browserInstance.close();

    browserInstance =
      null;
  }
}