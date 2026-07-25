import "dotenv/config";

import { prisma } from "../../shared/src/database/prisma.js";
import { crawlQueue } from "./queues/crawlQueue.js";
import { normalizeUrl } from "./crawler/urlNormalizer.js";

async function testQueue() {
  console.log("=== Queue Test Started ===");

  const websiteName = "Books to Scrape";
  const baseUrl = "https://books.toscrape.com/";
  const url = "https://books.toscrape.com/";

  // 1. Find or create website
  const website = await prisma.website.upsert({
    where: {
      baseUrl,
    },
    update: {},
    create: {
      name: websiteName,
      baseUrl,
    },
  });

  console.log("[Test] Website ID:", website.id);

  // 2. Normalize URL
  const normalizedUrl = normalizeUrl(url);

  // 3. Find or create page
  const page = await prisma.page.upsert({
    where: {
      websiteId_normalizedUrl: {
        websiteId: website.id,
        normalizedUrl,
      },
    },
    update: {
      status: "PENDING",
    },
    create: {
      websiteId: website.id,
      url,
      normalizedUrl,
      status: "PENDING",
    },
  });

  console.log("[Test] Page ID:", page.id);

  // 4. Add job
  const job = await crawlQueue.add(
    "crawl-page",
    {
      pageId: page.id,
      url: page.url,
      normalizedUrl: page.normalizedUrl,
      websiteId: website.id,
      websiteName: website.name,
      baseUrl: website.baseUrl,
      useBrowser: false,
    },
    {
      jobId: `test-crawl-${page.id}-${Date.now()}`,

      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  );

  console.log("[Test] Job ID:", job.id);

  console.log("=== Queue Test Finished ===");

  await prisma.$disconnect();
}

testQueue()
  .catch(async (error) => {
    console.error("[Test] Failed:", error);

    await prisma.$disconnect();

    process.exit(1);
  });