import {
  prisma,
} from "./prisma.js";

export interface CreateCrawlSessionInput {
  websiteId: string;

  maxPages: number;

  maxDepth: number;
}

export async function createCrawlSession(
  data: CreateCrawlSessionInput,
) {
  if (data.maxPages <= 0) {
    throw new Error(
      "maxPages must be greater than 0",
    );
  }

  if (data.maxDepth < 0) {
    throw new Error(
      "maxDepth cannot be negative",
    );
  }

  const session =
    await prisma.crawlSession.create({
      data: {
        websiteId:
          data.websiteId,

        maxPages:
          data.maxPages,

        maxDepth:
          data.maxDepth,

        status:
          "RUNNING",
      },
    });

  return session;
}
// =================================================
// GET CRAWL SESSION
// =================================================

export async function getCrawlSession(
  sessionId: string,
) {
  return prisma.crawlSession.findUnique({
    where: {
      id: sessionId,
    },
  });
}
// =================================================
// INCREMENT PAGES DISCOVERED
// =================================================

export async function incrementPagesDiscovered(
  sessionId: string,
) {
  return prisma.crawlSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pagesDiscovered: {
        increment: 1,
      },
    },
  });
}
// =================================================
// INCREMENT PAGES COMPLETED
// =================================================

export async function incrementPagesCompleted(
  sessionId: string,
) {
  return prisma.crawlSession.update({
    where: {
      id: sessionId,
    },

    data: {
      pagesCompleted: {
        increment: 1,
      },
    },
  });
}

// =================================================
// COMPLETE CRAWL SESSION
// =================================================

export async function completeCrawlSession(
  sessionId: string,
) {
  return prisma.crawlSession.update({
    where: {
      id: sessionId,
    },

    data: {
      status:
        "COMPLETED",
    },
  });
}

// =================================================
// FAIL CRAWL SESSION
// =================================================

export async function failCrawlSession(
  sessionId: string,
) {
  return prisma.crawlSession.update({
    where: {
      id:
        sessionId,
    },

    data: {
      status:
        "FAILED",
    },
  });
}

// =================================================
// CHECK IF CRAWL SESSION IS COMPLETE
// =================================================

export async function isCrawlSessionComplete(
  sessionId: string,
) {
  const session =
    await getCrawlSession(
      sessionId,
    );


  if (!session) {
    throw new Error(
      `Crawl session not found: ${sessionId}`,
    );
  }


  return (
    session.pagesCompleted >=
    session.pagesDiscovered
  );
}