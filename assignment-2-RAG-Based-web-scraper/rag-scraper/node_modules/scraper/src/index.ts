import { crawlQueue } from "./queues/crawlQueue.js";
import { CrawlMode } from "./crawler/crawlerRouter.js";

async function dispatchCrawlJob(url: string, mode: CrawlMode, maxDepth: number = 2) {
  console.log(`[Producer] Dispatching root crawl task: ${url} (Mode: ${mode}, Max Depth: ${maxDepth})`);

  await crawlQueue.add(
    "crawl-root",
    {
      url,
      mode,
      depth: 1,
      maxDepth,
    },
    {
      jobId: Buffer.from(url).toString("base64"),
    }
  );
}

async function main() {
  console.log("=== Launching RAG Web Scraper Dispatcher ===");

  // 1. Site 1: Static Site (Books to Scrape)
  await dispatchCrawlJob("https://books.toscrape.com/", CrawlMode.STATIC, 2);

  // 2. Site 2: JS-Rendered SPA (Quotes JS)
  await dispatchCrawlJob("https://quotes.toscrape.com/js/", CrawlMode.DYNAMIC, 1);

  console.log("[Producer] All seed tasks dispatched to Redis queue.");
  process.exit(0);
}

main().catch(console.error);