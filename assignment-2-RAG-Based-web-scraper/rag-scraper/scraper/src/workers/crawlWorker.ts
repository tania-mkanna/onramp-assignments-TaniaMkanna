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
  completeCrawlSession,
} from "../../../shared/src/database/crawlSessionRepository.js";

import type {
  CrawlJobData,
} from "../queues/crawlQueue.js";

import {
  normalizeUrl,
} from "../crawler/urlNormalizer.js";

import {
  shouldCrawlUrl,
} from "../crawler/urlFilter.js";

import {
  processPageVersion,
} from "../../../processor/src/services/processorService.js";


// =================================================
// REDIS CONNECTION
// =================================================

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


// =================================================
// PROCESS CRAWL JOB
// =================================================

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

  console.log(
    `[CrawlWorker] Session: ${crawlSessionId}`,
  );


  // =================================================
  // 1. GET CRAWL SESSION
  // =================================================

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
    `[CrawlWorker] Pages discovered: ${session.pagesDiscovered}/${session.maxPages}`,
  );

  console.log(
    `[CrawlWorker] Pages completed: ${session.pagesCompleted}`,
  );

  console.log(
    `[CrawlWorker] Max depth: ${session.maxDepth}`,
  );


  // =================================================
  // 2. CHECK MAX PAGES
  // =================================================

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


  // =================================================
  // 3. CHECK MAX DEPTH
  // =================================================

  if (
    depth >
    session.maxDepth
  ) {

    console.log(
      `[CrawlWorker] Max depth exceeded. Skipping ${url}`,
    );

    return {

      pageId,

      skipped:
        true,

      reason:
        "MAX_DEPTH_REACHED",

    };

  }


  // =================================================
  // 4. CRAWL CURRENT PAGE
  // =================================================

  console.log(
    `[CrawlWorker] Crawling page...`,
  );


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


  // =================================================
  // 5. GENERATE CONTENT HASH
  // =================================================

  const contentHash =
    generateContentHash(
      result.page.html,
    );


  // =================================================
  // 6. SAVE PAGE VERSION
  // =================================================

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
    `[CrawlWorker] PageVersion saved: ${pageVersion.id}`,
  );

// -----------------------------------------------
// 7. Process saved page version
// -----------------------------------------------

const processedDocument =
  await processPageVersion(
    pageVersion.id,
  );

console.log(
  `[CrawlWorker] ProcessedDocument: ${processedDocument.processedDocumentId}`,
);
  // =================================================
  // 7. MARK CURRENT PAGE AS COMPLETED
  // =================================================

  await incrementPagesCompleted(
    crawlSessionId,
  );


  console.log(
    `[CrawlWorker] Page completed.`,
  );


  // =================================================
  // 8. CHECK MAX DEPTH
  // =================================================

  if (
    depth >=
    session.maxDepth
  ) {

    console.log(
      `[CrawlWorker] Max depth reached at ${url}`,
    );

    console.log(
      `[CrawlWorker] No new links will be queued.`,
    );


    return {

      pageId,

      pageVersionId:
        pageVersion.id,

      url,

      newPages:
        0,

      depth,

      skipped:
        false,

      reason:
        "MAX_DEPTH_REACHED",

    };

  }


  // =================================================
  // 9. GET LATEST SESSION
  // =================================================

  const currentSession =
    await getCrawlSession(
      crawlSessionId,
    );


  if (!currentSession) {

    throw new Error(
      `Crawl session not found: ${crawlSessionId}`,
    );

  }


  // =================================================
  // 10. CHECK MAX PAGES
  // =================================================

  if (
    currentSession.pagesDiscovered >=
    currentSession.maxPages
  ) {

    console.log(
      `[CrawlWorker] Max pages reached.`,
    );

    console.log(
      `[CrawlWorker] No new links will be queued.`,
    );


    return {

      pageId,

      pageVersionId:
        pageVersion.id,

      url,

      newPages:
        0,

      depth,

      skipped:
        false,

      reason:
        "MAX_PAGES_REACHED",

    };

  }


  // =================================================
  // 11. PROCESS DISCOVERED LINKS
  // =================================================

  let newPages = 0;


  for (
    const discoveredUrl
    of result.links
  ) {


    // -----------------------------------------------
    // 11.1 GET LATEST SESSION
    // -----------------------------------------------

    const latestSession =
      await getCrawlSession(
        crawlSessionId,
      );


    if (!latestSession) {

      throw new Error(
        `Crawl session not found: ${crawlSessionId}`,
      );

    }


    // -----------------------------------------------
    // 11.2 CHECK MAX PAGES
    // -----------------------------------------------

    if (
      latestSession.pagesDiscovered >=
      latestSession.maxPages
    ) {

      console.log(
        `[CrawlWorker] Max pages reached.`,
      );

      console.log(
        `[CrawlWorker] Stopping link discovery.`,
      );

      break;

    }


    // -----------------------------------------------
    // 11.3 FILTER URL
    // -----------------------------------------------

    if (
      !shouldCrawlUrl(
        discoveredUrl,
        {
          baseUrl,
        },
      )
    ) {

      console.log(
        `[CrawlWorker] Skipping filtered URL: ${discoveredUrl}`,
      );

      continue;

    }


    // -----------------------------------------------
    // 11.4 NORMALIZE URL
    // -----------------------------------------------

    const discoveredNormalizedUrl =
      normalizeUrl(
        discoveredUrl,
      );


    // -----------------------------------------------
    // 11.5 SAVE DISCOVERED PAGE
    // -----------------------------------------------

    const discovered =
      await saveDiscoveredPage({

        websiteId,

        url:
          discoveredUrl,

        normalizedUrl:
          discoveredNormalizedUrl,

      });


    // -----------------------------------------------
    // 11.6 CHECK IF PAGE ALREADY EXISTS
    // -----------------------------------------------

    if (
      !discovered.created
    ) {

      console.log(
        `[CrawlWorker] URL already exists: ${discoveredUrl}`,
      );

      continue;

    }


    // -----------------------------------------------
    // 11.7 INCREMENT DISCOVERED COUNT
    // -----------------------------------------------

    await incrementPagesDiscovered(
      crawlSessionId,
    );


    newPages++;


    console.log(
      `[CrawlWorker] New page discovered: ${discoveredUrl}`,
    );


    // -----------------------------------------------
    // 11.8 ADD NEW PAGE TO QUEUE
    // -----------------------------------------------

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
      `[CrawlWorker] New job created: ${newJob.id}`,
    );

  }


  // =================================================
  // 12. LOG CRAWL RESULT
  // =================================================

  console.log(
    `[CrawlWorker] ${newPages} new pages added to queue.`,
  );
// -----------------------------------------------
// 13. Check if crawl session is complete
// -----------------------------------------------

if (
  newPages === 0
) {
  const finalSession =
    await getCrawlSession(
      crawlSessionId,
    );


  if (!finalSession) {
    throw new Error(
      `Crawl session not found: ${crawlSessionId}`,
    );
  }


  if (
    finalSession.pagesCompleted >=
    finalSession.pagesDiscovered
  ) {
    await completeCrawlSession(
      crawlSessionId,
    );


    console.log(
      `[CrawlWorker] Crawl session ${crawlSessionId} completed.`,
    );
  }
}

  // =================================================
  // 13. RETURN JOB RESULT
  // =================================================

  return {

    pageId,

    pageVersionId:
      pageVersion.id,

    url,

    newPages,

    depth,

  };

}


// =================================================
// WORKER
// =================================================

export const crawlWorker =
  new Worker<CrawlJobData>(

    "crawl",

    processCrawlJob,

    {

      connection:
        redisConnection,

      // One job at a time
      // per worker container.
      //
      // If you run:
      //
      // docker compose up --scale crawl-worker=3
      //
      // you will have 3 containers,
      // each processing 1 job at a time.

      concurrency:
        1,

      // Prevent Playwright jobs
      // from being marked as stalled.

      lockDuration:
        60_000,

    },

  );


// =================================================
// COMPLETED EVENT
// =================================================

crawlWorker.on(

  "completed",

  (job) => {

    console.log(
      `[CrawlWorker] Completed job ${job.id}`,
    );

  },

);


// =================================================
// FAILED EVENT
// =================================================

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


// =================================================
// WORKER ERROR EVENT
// =================================================

crawlWorker.on(

  "error",

  (error) => {

    console.error(
      "[CrawlWorker] Worker error:",
      error,
    );

  },

);

// =================================================
// START WORKER
// =================================================

console.log(
  "[CrawlWorker] Worker started.",
);

console.log(
  "[CrawlWorker] Waiting for jobs...",
);