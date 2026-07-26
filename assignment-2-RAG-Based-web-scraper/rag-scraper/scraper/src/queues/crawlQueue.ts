import "dotenv/config";
import { Queue } from "bullmq";

export const CRAWL_QUEUE_NAME = "crawl";

export const redisConnection = {
  host: process.env.REDIS_HOST ?? "localhost",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export interface CrawlJobData {
  crawlSessionId: string;
  pageId: string;
  websiteId: string;
  url: string;
  normalizedUrl: string;
  websiteName: string;
  baseUrl: string;
  depth: number;
  useBrowser?: boolean;
}

export const crawlQueue = new Queue<CrawlJobData>(
  CRAWL_QUEUE_NAME,
  {
    connection: redisConnection,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 2000,
      },

      removeOnComplete: {
        age: 60 * 60,
      },

      // Keep failed jobs.
      // This is useful for demonstrating
      // retry and dead-letter handling later.
      removeOnFail: false,
    },
  },
);