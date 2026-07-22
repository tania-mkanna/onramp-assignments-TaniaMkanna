import { Queue } from "bullmq";
import { redisConnection } from "./connection.js";
import { CrawlMode } from "../crawler/crawlerRouter.js";

export interface CrawlJobData {
  url: string;
  mode: CrawlMode;
  depth: number;
  maxDepth: number;
}

export const CRAWL_QUEUE_NAME = "crawl";

export const crawlQueue = new Queue<CrawlJobData>(CRAWL_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: "exponential",
      delay: 2000, // Wait 2s, 4s, 8s between retries
    },
    removeOnComplete: 100, // Keep last 100 completed jobs for UI monitoring
    removeOnFail: 500,     // Keep failed jobs in DLQ (Dead Letter Queue) state
  },
});