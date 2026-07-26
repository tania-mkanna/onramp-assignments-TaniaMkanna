import {
  prisma,
} from "../../../shared/src/database/prisma.js";

import {
  createCrawlSession,
  reserveDiscoveredPageSlot,
} from "../../../shared/src/database/crawlSessionRepository.js";

import {
  enqueueCrawlJob,
} from "./crawlProducer.js";

import {
  normalizeUrl,
} from "../crawler/urlNormalizer.js";


// ============================================================
// INPUT
// ============================================================

export interface StartCrawlInput {
  websiteName: string;

  baseUrl: string;

  url: string;

  // Internal crawler configuration.
  // These are NOT provided by the user/API.
  maxPages?: number;

  maxDepth?: number;

  useBrowser?: boolean;
}


// ============================================================
// DEFAULT CRAWL CONFIGURATION
// ============================================================

const DEFAULT_MAX_PAGES = 100;

const DEFAULT_MAX_DEPTH = 3;

const DEFAULT_USE_BROWSER = false;


// ============================================================
// START CRAWL
// ============================================================

export async function startCrawl(
  data: StartCrawlInput,
) {

  console.log(
    "\n=== Starting Crawl Session ===",
  );


  // ----------------------------------------------------------
  // 1. Resolve internal crawl configuration
  // ----------------------------------------------------------

  const maxPages =
    data.maxPages ??
    DEFAULT_MAX_PAGES;

  const maxDepth =
    data.maxDepth ??
    DEFAULT_MAX_DEPTH;

  const useBrowser =
    data.useBrowser ??
    DEFAULT_USE_BROWSER;


  console.log(
    `[StartCrawl] URL: ${data.url}`,
  );

  console.log(
    `[StartCrawl] Max pages: ${maxPages}`,
  );

  console.log(
    `[StartCrawl] Max depth: ${maxDepth}`,
  );

  console.log(
    `[StartCrawl] Browser mode: ${useBrowser}`,
  );


  // ----------------------------------------------------------
  // 2. Find or create website
  // ----------------------------------------------------------

  const website =
    await prisma.website.upsert({

      where: {
        baseUrl:
          data.baseUrl,
      },

      update: {},

      create: {
        name:
          data.websiteName,

        baseUrl:
          data.baseUrl,
      },

    });


  console.log(
    `[StartCrawl] Website ID: ${website.id}`,
  );


  // ----------------------------------------------------------
  // 3. Create crawl session
  // ----------------------------------------------------------

  const session =
    await createCrawlSession({

      websiteId:
        website.id,

      maxPages,

      maxDepth,

    });


  console.log(
    `[StartCrawl] Session ID: ${session.id}`,
  );


  // ----------------------------------------------------------
  // 4. Normalize seed URL
  // ----------------------------------------------------------

  const normalizedUrl =
    normalizeUrl(
      data.url,
    );


  console.log(
    `[StartCrawl] Normalized URL: ${normalizedUrl}`,
  );


  // ----------------------------------------------------------
  // 5. Find or create seed page
  // ----------------------------------------------------------

  const page =
    await prisma.page.upsert({

      where: {

        websiteId_normalizedUrl: {

          websiteId:
            website.id,

          normalizedUrl,

        },

      },

      update: {

        // If the page already exists from an
        // earlier crawl, make it available
        // for this new crawl.

        status:
          "PENDING",

      },

      create: {

        websiteId:
          website.id,

        url:
          data.url,

        normalizedUrl,

        status:
          "PENDING",

      },

    });


  console.log(
    `[StartCrawl] Seed page ID: ${page.id}`,
  );


  // ----------------------------------------------------------
  // 6. Reserve crawl slot
  // ----------------------------------------------------------

  const seedReserved =
    await reserveDiscoveredPageSlot(
      session.id,
    );


  if (!seedReserved) {

    throw new Error(
      "Unable to reserve a crawl slot for the seed URL",
    );

  }


  // ----------------------------------------------------------
  // 7. Add seed page to crawl queue
  // ----------------------------------------------------------

  const job =
    await enqueueCrawlJob({

      crawlSessionId:
        session.id,

      pageId:
        page.id,

      websiteId:
        website.id,

      url:
        page.url,

      normalizedUrl:
        page.normalizedUrl,

      websiteName:
        website.name,

      baseUrl:
        website.baseUrl,

      depth:
        0,

      useBrowser,

    });


  console.log(
    `[StartCrawl] Seed job ID: ${job.id}`,
  );


  // ----------------------------------------------------------
  // 8. Return crawl information
  // ----------------------------------------------------------

  return {

    crawlSessionId:
      session.id,

    websiteId:
      website.id,

    pageId:
      page.id,

    jobId:
      job.id,

    websiteUrl:
      website.baseUrl,

    maxPages,

    maxDepth,

  };

}