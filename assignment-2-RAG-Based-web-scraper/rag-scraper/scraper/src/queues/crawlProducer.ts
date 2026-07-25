import {crawlQueue,type CrawlJobData,} from "./crawlQueue.js";

export async function enqueueCrawlJob(
  data: CrawlJobData,
) {
   console.log(
    `[Queue] Adding crawl job: ${data.url}`,
  );

  console.log(
    `[Queue] Session: ${data.crawlSessionId}`,
  );

  console.log(
    `[Queue] Depth: ${data.depth}`,
  );

  const job = await crawlQueue.add(
    "crawl-page",
    data,
    {
        jobId:
          `crawl-${data.crawlSessionId}-${data.pageId}`,
      },
  );

  console.log(
    `[Queue] Job created: ${job.id}`,
  );

  return job;
}