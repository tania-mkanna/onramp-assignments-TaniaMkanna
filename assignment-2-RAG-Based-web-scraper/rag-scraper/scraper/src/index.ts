import "dotenv/config";

import "./workers/crawlWorker.js";
import "./workers/processingWorker.js";

console.log("[Scraper] Crawl and processing workers started.");
