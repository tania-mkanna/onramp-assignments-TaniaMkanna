import { Worker, Job } from "bullmq";
import { redisConnection } from "../queues/connection.js";
import { CRAWL_QUEUE_NAME, crawlQueue } from "../queues/crawlQueue.js";
import type { CrawlJobData } from "../queues/crawlQueue.js";
import { fetchPageContent } from "../crawler/crawlerRouter.js";
import { extractInternalLinks } from "../parsers/linkExtractor.js";
import { generateContentHash } from "../../../shared/src/utils/hash.js";
import { saveRawPage } from "../../../shared/src/database/rawPageRepository.js";

// Keep track of visited URLs in-memory per worker execution to reduce queue spam
const localVisitedUrls = new Set<string>();

export const scrapeWorker = new Worker<CrawlJobData>(
  CRAWL_QUEUE_NAME,
  async (job: Job<CrawlJobData>) => {
    const { url, mode, depth, maxDepth } = job.data;

    console.log(`[Worker ${process.pid}] Processing job ${job.id}: ${url} (Depth: ${depth}/${maxDepth})`);

    // 1. Fetch content (handles robots.txt check + static/dynamic routing)
    const result = await fetchPageContent(url, mode);

    // 2. Compute SHA-256 hash
    const contentHash = generateContentHash(result.html);

    // 3. Save raw page and handle content deduplication
    const savedPage = await saveRawPage({
      url,
      domain: new URL(url).hostname,
      htmlContent: result.html,
      contentHash,
      statusCode: result.statusCode,
    }); 

    console.log("[Worker] DATABASE SAVE RESULT:");
    console.log(savedPage);

    // 4. Recursive Crawling: Extract internal links if depth limit allows
    if (depth < maxDepth) {
      const discoveredLinks = extractInternalLinks(result.html, url);
      console.log(`[Worker ${process.pid}] Found ${discoveredLinks.length} internal links on ${url}`);

      for (const link of discoveredLinks) {
        if (!localVisitedUrls.has(link)) {
          localVisitedUrls.add(link);

          // Push child page into BullMQ
          await crawlQueue.add(
            "scrape-link",
            {
              url: link,
              mode,
              depth: depth + 1,
              maxDepth,
            },
            {
              // Deduplicate jobs by unique URL in Redis
              jobId: Buffer.from(link).toString("base64"),
            }
          );
        }
      }
    }

    return { url, statusCode: result.statusCode, contentHash };
  },
  {
    connection: redisConnection,
    concurrency: 5, // Concurrent jobs per worker instance
    limiter: {
      max: 10,       // Per-domain politeness: Max 10 requests...
      duration: 1000, // ...per second
    },
  }
);

// Worker Lifecycle Logging
scrapeWorker.on("completed", (job) => {
  console.log(`[Worker Job Success] Job ${job.id} completed for URL: ${job.data.url}`);
});

scrapeWorker.on("failed", (job, err) => {
  console.error(`[Worker Job Failed] Job ${job?.id} failed for URL: ${job?.data.url}. Error: ${err.message}`);
});