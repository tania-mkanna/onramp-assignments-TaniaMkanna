import "dotenv/config";

import {
  Worker,
  type Job,
} from "bullmq";

import {
  crawlPage,
} from "../crawler/crawlerService.js";

import {
  savePage,
  saveDiscoveredPage,
} from "../../../shared/src/database/rawPageRepository.js";

import {
  generateContentHash,
} from "../../../shared/src/utils/hash.js";

import {
  enqueueCrawlJob,
} from "../queues/crawlProducer.js";

import {
  getCrawlSession,
  incrementPagesDiscovered,
  incrementPagesCompleted,
} from "../../../shared/src/database/crawlSessionRepository.js";

import type {
  CrawlJobData,
} from "../queues/crawlQueue.js";

import {
  normalizeUrl,
} from "../crawler/urlNormalizer.js";


const redisConnection = {
  host:
    process.env.REDIS_HOST ??
    "localhost",

  port:
    Number(
      process.env.REDIS_PORT ??
      6379,
    ),
};


async function processCrawlJob(
  job: Job<CrawlJobData>,
) {
  const {
    crawlSessionId,

    pageId,

    url,

    normalizedUrl,

    websiteId,

    websiteName,

    baseUrl,

    depth,

    useBrowser = false,
  } = job.data;


  console.log(
    `\n[CrawlWorker] Processing job ${job.id}`,
  );

  console.log(
    `[CrawlWorker] URL: ${url}`,
  );

  console.log(
    `[CrawlWorker] Depth: ${depth}`,
  );


  // -----------------------------------------------
  // 1. Get crawl session
  // -----------------------------------------------

  const session =
    await getCrawlSession(
      crawlSessionId,
    );


  if (!session) {
    throw new Error(
      `Crawl session not found: ${crawlSessionId}`,
    );
  }


  console.log(
    `[CrawlWorker] Session ${crawlSessionId}`,
  );

  console.log(
    `[CrawlWorker] Pages discovered: ${session.pagesDiscovered}/${session.maxPages}`,
  );

  console.log(
    `[CrawlWorker] Max depth: ${session.maxDepth}`,
  );


  // -----------------------------------------------
  // 2. Check page limit
  // -----------------------------------------------

  if (
    session.pagesDiscovered >
    session.maxPages
  ) {
    console.log(
      `[CrawlWorker] Max pages reached. Skipping ${url}`,
    );

    return {
      pageId,

      skipped:
        true,

      reason:
        "MAX_PAGES_REACHED",
    };
  }


  // -----------------------------------------------
  // 3. Crawl page
  // -----------------------------------------------

  const result =
    await crawlPage({
      url,

      useBrowser:
        !!useBrowser,
    });


  console.log(
    `[CrawlWorker] Crawled ${url}`,
  );


  console.log(
    `[CrawlWorker] Status: ${result.page.statusCode}`,
  );


  // -----------------------------------------------
  // 4. Generate content hash
  // -----------------------------------------------

  const contentHash =
    generateContentHash(
      result.page.html,
    );


  // -----------------------------------------------
  // 5. Save page version
  // -----------------------------------------------

  const pageVersion =
    await savePage({
      websiteName,

      baseUrl,

      url:
        result.page.url,

      normalizedUrl,

      htmlContent:
        result.page.html,

      contentHash,

      statusCode:
        result.page.statusCode,

      contentType:
        result.page.contentType ??
        "",
    });


  console.log(
    `[CrawlWorker] PageVersion: ${pageVersion.id}`,
  );


  // -----------------------------------------------
  // 6. Mark current page completed
  // -----------------------------------------------

  await incrementPagesCompleted(
    crawlSessionId,
  );


  // -----------------------------------------------
  // 7. Check depth limit
  // -----------------------------------------------

  if (
    depth >=
    session.maxDepth
  ) {
    console.log(
      `[CrawlWorker] Max depth reached at ${url}`,
    );

    return {
      pageId,

      pageVersionId:
        pageVersion.id,

      url,

      newPages:
        0,

      skipped:
        false,

      reason:
        "MAX_DEPTH_REACHED",
    };
  }


  // -----------------------------------------------
  // 8. Check page limit before discovering links
  // -----------------------------------------------

  const currentSession =
    await getCrawlSession(
      crawlSessionId,
    );


  if (!currentSession) {
    throw new Error(
      `Crawl session not found: ${crawlSessionId}`,
    );
  }


  if (
    currentSession.pagesDiscovered >=
    currentSession.maxPages
  ) {
    console.log(
      `[CrawlWorker] Max pages reached. No new links will be queued.`,
    );

    return {
      pageId,

      pageVersionId:
        pageVersion.id,

      url,

      newPages:
        0,

      skipped:
        false,

      reason:
        "MAX_PAGES_REACHED",
    };
  }


  // -----------------------------------------------
  // 9. Register discovered URLs
  // -----------------------------------------------

  let newPages = 0;


  for (
    const discoveredUrl
    of result.links
  ) {

    // ---------------------------------------------
    // Stop if max pages reached
    // ---------------------------------------------

    const latestSession =
      await getCrawlSession(
        crawlSessionId,
      );


    if (!latestSession) {
      throw new Error(
        `Crawl session not found: ${crawlSessionId}`,
      );
    }


    if (
      latestSession.pagesDiscovered >=
      latestSession.maxPages
    ) {
      console.log(
        `[CrawlWorker] Max pages reached. Stopping link discovery.`,
      );

      break;
    }


    // ---------------------------------------------
    // Normalize URL
    // ---------------------------------------------

    const discoveredNormalizedUrl =
      normalizeUrl(
        discoveredUrl,
      );


    // ---------------------------------------------
    // Save discovered page
    // ---------------------------------------------

    const discovered =
      await saveDiscoveredPage({
        websiteId,

        url:
          discoveredUrl,

        normalizedUrl:
          discoveredNormalizedUrl,
      });


    // ---------------------------------------------
    // Page already exists
    // ---------------------------------------------

    if (
      !discovered.created
    ) {
      continue;
    }


    // ---------------------------------------------
    // Count discovered page
    // ---------------------------------------------

    await incrementPagesDiscovered(
      crawlSessionId,
    );


    newPages++;


    console.log(
      `[CrawlWorker] New page discovered: ${discoveredUrl}`,
    );


    // ---------------------------------------------
    // Add new job
    // ---------------------------------------------

    const newJob =
      await enqueueCrawlJob({
        crawlSessionId,

        pageId:
          discovered.page.id,

        websiteId,

        url:
          discovered.page.url,

        normalizedUrl:
          discovered.page.normalizedUrl,

        websiteName,

        baseUrl,

        depth:
          depth + 1,

        useBrowser,
      });


    console.log(
      `[CrawlWorker] New job: ${newJob.id}`,
    );
  }


  console.log(
    `[CrawlWorker] ${newPages} new pages added`,
  );


  return {
    pageId,

    pageVersionId:
      pageVersion.id,

    url,

    newPages,

    depth,
  };
}


export const crawlWorker =
  new Worker<CrawlJobData>(
    "crawl",

    processCrawlJob,

    {
      connection:
        redisConnection,

      concurrency:
        1,

      lockDuration:
        60_000,
    },
  );


crawlWorker.on(
  "completed",
  (job) => {
    console.log(
      `[CrawlWorker] Completed job ${job.id}`,
    );
  },
);


crawlWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `[CrawlWorker] Failed job ${job?.id}`,
    );

    console.error(
      error,
    );
  },
);


crawlWorker.on(
  "error",
  (error) => {
    console.error(
      "[CrawlWorker] Worker error:",
      error,
    );
  },
);


console.log(
  "[CrawlWorker] Worker started.",
);


console.log(
  "[CrawlWorker] Waiting for jobs...",
);