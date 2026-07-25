import { prisma } from "../../../shared/src/database/prisma.js";

export async function getRawPages(domain?: string) {
  return prisma.processedPage.findMany({
    ...(domain && {
      where: {
        rawPage: {
          domain,
        },
      },
    }),
    include: {
      rawPage: true,
    },
    take: 100,
  });
}

export async function getProcessedPages(domain?: string) {
  return prisma.processedPage.findMany({
    ...(domain && {
      where: {
        rawPage: {
          domain,
        },
      },
    }),
    include: {
      rawPage: true,
    },
    take: 100,
  });
}