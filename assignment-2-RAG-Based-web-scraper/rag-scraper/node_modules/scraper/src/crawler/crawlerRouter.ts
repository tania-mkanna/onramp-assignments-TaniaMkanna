import { fetchHTML } from "./httpCrawler.js";
import type { FetchResult } from "./httpCrawler.js";
import { fetchDynamicHTML } from "./playwrightCrawler.js";

export enum CrawlMode {
  STATIC = "STATIC",
  DYNAMIC = "DYNAMIC",
}

export async function fetchPageContent(
  url: string,
  mode: CrawlMode = CrawlMode.STATIC
): Promise<FetchResult> {
    if (mode === CrawlMode.STATIC) {
    return fetchHTML(url);
    }

    if (mode === CrawlMode.DYNAMIC) {
        console.log(`[Crawler Router] Using Playwright for JS execution: ${url}`);
        return await fetchDynamicHTML(url);
    }
  console.log(`[Crawler Router] Using Fast Axios HTTP Client: ${url}`);
  return await fetchHTML(url);
}