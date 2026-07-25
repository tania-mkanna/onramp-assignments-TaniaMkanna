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

export async function getCrawlSession(
  sessionId: string,
) {
  return prisma.crawlSession.findUnique({
    where: {
      id: sessionId,
    },
  });
}

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