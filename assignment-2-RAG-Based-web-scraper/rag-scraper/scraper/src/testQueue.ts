import "dotenv/config";

import { prisma } from "../../shared/src/database/prisma.js";

import { createCrawlSession } from "../../shared/src/database/crawlSessionRepository.js";

import { enqueueCrawlJob } from "./queues/crawlProducer.js";

async function main() {
  console.log("=== Multiple Workers Test ===");

  // ------------------------------------
  // Get website
  // ------------------------------------

  const website = await prisma.website.findFirst();

  if (!website) {
    throw new Error("No website found.");
  }

  console.log("Website:", website.name);

  // ------------------------------------
  // Get first page
  // ------------------------------------

  const page = await prisma.page.findFirst({
    where: {
      websiteId: website.id,
    },
  });

  if (!page) {
    throw new Error("No page found.");
  }

  console.log("Seed page:", page.url);

  // ------------------------------------
  // Create crawl session
  // ------------------------------------

  const session = await createCrawlSession({
    websiteId: website.id,
    maxPages: 3,
    maxDepth: 2,
  });

  console.log("Session:", session.id);

  // ------------------------------------
  // Add MANY jobs
  // ------------------------------------

  const NUMBER_OF_JOBS = 20;

  for (let i = 0; i < NUMBER_OF_JOBS; i++) {
    const job = await enqueueCrawlJob({
      crawlSessionId: session.id,

      pageId: page.id,

      websiteId: website.id,

      url: page.url,

      normalizedUrl: page.normalizedUrl,

      websiteName: website.name,

      baseUrl: website.baseUrl,

      depth: 0,

      useBrowser: false,
    });

    console.log(`Job ${i + 1} -> ${job.id}`);
  }

  console.log(`\n${NUMBER_OF_JOBS} jobs added.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });