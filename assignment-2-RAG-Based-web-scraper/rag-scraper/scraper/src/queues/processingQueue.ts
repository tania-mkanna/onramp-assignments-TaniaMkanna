import "dotenv/config";
import { Queue } from "bullmq";
import { redisConnection } from "./crawlQueue.js";

export const PROCESSING_QUEUE_NAME = "processing";

export interface ProcessingJobData {
  pageVersionId: string;
  pageId: string;
  websiteId: string;
  websiteName: string;
  url: string;
  normalizedUrl: string;
}

export const processingQueue = new Queue<ProcessingJobData>(
  PROCESSING_QUEUE_NAME,
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
      removeOnFail: false,
    },
  },
);
