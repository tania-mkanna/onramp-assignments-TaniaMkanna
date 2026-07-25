import { prisma } from "../../../shared/src/database/prisma.js";

import {
  enqueueCrawlJob,
} from "../queues/crawlProducer.js";

import {
  normalizeUrl,
} from "./urlNormalizer.js";

interface CrawlAndSaveInput {
  websiteName: string;
  baseUrl: string;
  url: string;
  useBrowser?: boolean;
}

export async function crawlAndSavePage(
  data: CrawlAndSaveInput,
) {
  console.log(
    `[CrawlAndSave] Starting crawl: ${data.url}`,
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
  // 2. Normalize initial URL
  // -----------------------------------------------

  const normalizedUrl =
    normalizeUrl(
      data.url,
    );

  // -----------------------------------------------
  // 3. Find or create page
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

  console.log(
    `[CrawlAndSave] Page ID: ${page.id}`,
  );

  // -----------------------------------------------
  // 4. Add page to crawl queue
  // -----------------------------------------------

  const job =
    await enqueueCrawlJob({
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

      useBrowser:
        data.useBrowser ?? false,
    });

  return {
    websiteId:
      website.id,

    pageId:
      page.id,

    jobId:
      job.id,
  };
}