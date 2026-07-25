import {
  prisma,
} from "../../../shared/src/database/prisma.js";

import {
  createCrawlSession,
  incrementPagesDiscovered,
} from "../../../shared/src/database/crawlSessionRepository.js";

import {
  enqueueCrawlJob,
} from "./crawlProducer.js";

import {
  normalizeUrl,
} from "../crawler/urlNormalizer.js";

interface StartCrawlInput {
  websiteName: string;

  baseUrl: string;

  url: string;

  maxPages: number;

  maxDepth: number;

  useBrowser?: boolean;
}

export async function startCrawl(
  data: StartCrawlInput,
) {
  console.log(
    "=== Starting Crawl Session ===",
  );

  // -----------------------------------------------
  // 1. Find or create website
  // -----------------------------------------------

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

  // -----------------------------------------------
  // 2. Create crawl session
  // -----------------------------------------------

  const session =
    await createCrawlSession({
      websiteId:
        website.id,

      maxPages:
        data.maxPages,

      maxDepth:
        data.maxDepth,
    });

  console.log(
    `[StartCrawl] Session ID: ${session.id}`,
  );

  console.log(
    `[StartCrawl] Max pages: ${session.maxPages}`,
  );

  console.log(
    `[StartCrawl] Max depth: ${session.maxDepth}`,
  );

  // -----------------------------------------------
  // 3. Normalize seed URL
  // -----------------------------------------------

  const normalizedUrl =
    normalizeUrl(
      data.url,
    );

  // -----------------------------------------------
  // 4. Create seed page
  // -----------------------------------------------

  const page =
    await prisma.page.upsert({
      where: {
        websiteId_normalizedUrl: {
          websiteId:
            website.id,

          normalizedUrl,
        },
      },

      update: {},

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

  // -----------------------------------------------
  // 5. Count seed page
  // -----------------------------------------------

  await incrementPagesDiscovered(
    session.id,
  );

  // -----------------------------------------------
  // 6. Add seed page to queue
  // -----------------------------------------------

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

      useBrowser:
        data.useBrowser ?? false,
    });

  console.log(
    `[StartCrawl] Seed job: ${job.id}`,
  );

  return {
    crawlSessionId:
      session.id,

    websiteId:
      website.id,

    pageId:
      page.id,

    jobId:
      job.id,
  };
}