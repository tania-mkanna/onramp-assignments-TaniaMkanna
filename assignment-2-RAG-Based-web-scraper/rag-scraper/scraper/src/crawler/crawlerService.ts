import {
  crawlHttp,
  type CrawlResult,
} from "./httpCrawler.js";

import {
  fetchDynamicHTML,
} from "./playwrightCrawler.js";

import {
  canScrape,
} from "./robots.js";

import {
  waitForDomain,
} from "./rateLimiter.js";

import {
  extractLinks,
} from "./linkExtractor.js";

import {
  normalizeUrl,
} from "./urlNormalizer.js";

export interface CrawlPageOptions {
  url: string;
  useBrowser?: boolean;
}

export interface CrawlPageResult {
  page: CrawlResult;
  links: string[];
}

export async function crawlPage(
  options: CrawlPageOptions,
): Promise<CrawlPageResult> {
  const {
    url,
    useBrowser = false,
  } = options;

  console.log(
    `[CrawlerService] Crawling ${url}`,
  );

  // -----------------------------------------------
  // 1. Check robots.txt
  // -----------------------------------------------

  const allowed =
    await canScrape(url);

  if (!allowed) {
    throw new Error(
      `Robots.txt does not allow crawling: ${url}`,
    );
  }

  // -----------------------------------------------
  // 2. Respect per-domain delay
  // -----------------------------------------------

  await waitForDomain(url);

  // -----------------------------------------------
  // 3. Fetch the page
  // -----------------------------------------------

  const result: CrawlResult =
    useBrowser
      ? await fetchDynamicHTML(
          url,
        )
      : await crawlHttp(
          url,
        );

  console.log(
    `[CrawlerService] HTTP ${result.statusCode}`,
  );

  // -----------------------------------------------
  // 4. Handle HTTP errors
  // -----------------------------------------------

  if (
    result.statusCode >= 400
  ) {
    throw new Error(
      `HTTP ${result.statusCode} while crawling ${url}`,
    );
  }

  // -----------------------------------------------
  // 5. Extract and normalize links
  // -----------------------------------------------

  const links =
    extractLinks(
      result.html,
      url,
    )
      .map(
        (link) =>
          normalizeUrl(link),
      )
      .filter(
        (link) => link !== normalizeUrl(url),
      );

  console.log(
    `[CrawlerService] Found ${links.length} links`,
  );

  return {
    page: result,
    links,
  };
}