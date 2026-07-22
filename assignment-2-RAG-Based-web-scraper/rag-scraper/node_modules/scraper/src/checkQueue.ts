import { crawlQueue } from "./queues/crawlQueue.js";

const counts = await crawlQueue.getJobCounts(
  "waiting",
  "active",
  "completed",
  "failed",
  "delayed"
);

console.log("Crawl Queue Status:");
console.log(counts);

await crawlQueue.close();