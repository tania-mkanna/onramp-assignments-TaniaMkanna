import {
  askQuestion,
} from "../../../rag/src/queryService.js";

import {
  startCrawl,
} from "../../../scraper/src/queues/startCrawl.js";

import {
  prisma,
} from "../../../shared/src/database/prisma.js";

import type {
  AskInput,
  CrawlDispatchInput,
  PagesQueryInput,
  WebsitesQueryInput,
} from "./apiSchemas.js";


// =====================================================
// INTERNAL CRAWL CONFIGURATION
// =====================================================
//
// The user does NOT provide these values.
//
// The API controls the crawling behaviour.
//

const CRAWL_CONFIG = {
  maxPages: 500,

  maxDepth: 5,

  useBrowser: false,
};


// =====================================================
// URL HELPERS
// =====================================================

function toBaseUrl(
  rawUrl: string,
): string {

  const parsed =
    new URL(rawUrl);

  return `${parsed.protocol}//${parsed.host}`;
}


function toWebsiteName(
  rawUrl: string,
): string {

  const parsed =
    new URL(rawUrl);

  return parsed.hostname;
}


// =====================================================
// START CRAWL
// =====================================================
//
// User request:
//
// POST /api/crawl/dispatch
//
// {
//   "url": "https://books.toscrape.com/"
// }
//
// The API internally decides:
//
// - websiteName
// - baseUrl
// - maxPages
// - maxDepth
// - useBrowser
//

export async function dispatchCrawl(
  input: CrawlDispatchInput,
) {

  // -----------------------------------------------
  // 1. Derive website information from URL
  // -----------------------------------------------

  const baseUrl =
    toBaseUrl(
      input.url,
    );

  const websiteName =
    toWebsiteName(
      input.url,
    );


  console.log(
    `[API] Starting crawl for: ${input.url}`,
  );

  console.log(
    `[API] Website name: ${websiteName}`,
  );

  console.log(
    `[API] Base URL: ${baseUrl}`,
  );


  // -----------------------------------------------
  // 2. Start crawl
  // -----------------------------------------------

  const started =
    await startCrawl({

      websiteName,

      baseUrl,

      url:
        input.url,

      maxPages:
        CRAWL_CONFIG.maxPages,

      maxDepth:
        CRAWL_CONFIG.maxDepth,

      useBrowser:
        CRAWL_CONFIG.useBrowser,
    });


  // -----------------------------------------------
  // 3. Return crawl information
  // -----------------------------------------------

  return {

    message:
      "Crawl session started.",

    data: {

      ...started,

      url:
        input.url,

      websiteName,

      baseUrl,

      configuration: {

        maxPages:
          CRAWL_CONFIG.maxPages,

        maxDepth:
          CRAWL_CONFIG.maxDepth,

        useBrowser:
          CRAWL_CONFIG.useBrowser,
      },
    },
  };
}


// =====================================================
// GET CRAWL SESSION DETAILS
// =====================================================

export async function getCrawlSessionDetails(
  sessionId: string,
) {

  const session =
    await prisma.crawlSession.findUnique({

      where: {
        id:
          sessionId,
      },

      include: {

        website: {

          select: {

            id:
              true,

            name:
              true,

            baseUrl:
              true,
          },
        },
      },
    });


  if (!session) {

    throw new Error(
      `Crawl session not found: ${sessionId}`,
    );
  }


  // -----------------------------------------------
  // Count processed documents and chunks
  // -----------------------------------------------

  const [
    processedDocuments,
    chunks,
  ] =
    await Promise.all([

      prisma.processedDocument.count({

        where: {

          pageVersion: {

            page: {

              websiteId:
                session.websiteId,
            },
          },
        },
      }),


      prisma.documentChunk.count({

        where: {

          processedDocument: {

            pageVersion: {

              page: {

                websiteId:
                  session.websiteId,
              },
            },
          },
        },
      }),
    ]);


  // -----------------------------------------------
  // Calculate progress
  // -----------------------------------------------

  const progress =
    session.maxPages > 0

      ? Math.min(

          100,

          Number(

            (
              (
                session.pagesCompleted /
                session.maxPages
              ) *
              100
            ).toFixed(2),

          ),

        )

      : 0;


  return {

    data: {

      id:
        session.id,

      status:
        session.status,

      website:
        session.website,

      limits: {

        maxPages:
          session.maxPages,

        maxDepth:
          session.maxDepth,
      },

      counters: {

        pagesDiscovered:
          session.pagesDiscovered,

        pagesCompleted:
          session.pagesCompleted,

        processedDocuments,

        chunks,
      },

      progress,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt,
    },
  };
}


// =====================================================
// LIST WEBSITES
// =====================================================
//
// Internal/monitoring endpoint.
//
// The user does not need to provide a website ID
// when asking questions.
//

export async function listWebsites(
  query: WebsitesQueryInput,
) {

  const websites =
    await prisma.website.findMany({

      take:
        query.limit,

      orderBy: {

        updatedAt:
          "desc",
      },

      include: {

        _count: {

          select: {

            pages:
              true,

            crawlSessions:
              true,
          },
        },

        crawlSessions: {

          orderBy: {

            createdAt:
              "desc",
          },

          take:
            1,

          select: {

            id:
              true,

            status:
              true,

            createdAt:
              true,

            pagesDiscovered:
              true,

            pagesCompleted:
              true,
          },
        },
      },
    });


  return {

    data:
      websites,
  };
}


// =====================================================
// LIST WEBSITE PAGES
// =====================================================
//
// Internal/monitoring endpoint.
//

export async function listWebsitePages(
  websiteId: string,

  query:
    PagesQueryInput,
) {

  const website =
    await prisma.website.findUnique({

      where: {

        id:
          websiteId,
      },

      select: {

        id:
          true,

        name:
          true,

        baseUrl:
          true,
      },
    });


  if (!website) {

    throw new Error(
      `Website not found: ${websiteId}`,
    );
  }


  const pages =
    await prisma.page.findMany({

      where: {

        websiteId,
      },

      take:
        query.limit,

      orderBy: {

        updatedAt:
          "desc",
      },

      include: {

        versions: {

          orderBy: {

            version:
              "desc",
          },

          take:
            1,

          include: {

            processedDocument: {

              select: {

                id:
                  true,

                processedAt:
                  true,
              },
            },
          },
        },
      },
    });


  return {

    data: {

      website,

      pages,
    },
  };
}


// =====================================================
// ASK RAG QUESTION
// =====================================================
//
// User request:
//
// POST /api/ask
//
// {
//   "question": "What is the most expensive book?"
// }
//
// The user does NOT provide:
//
// - websiteId
// - websiteUrl
// - topK
// - topic
//
// The RAG system searches all indexed content.
//

export async function askRagQuestion(
  input: AskInput,
) {

  console.log(
    `[API] RAG question: ${input.question}`,
  );


  // -----------------------------------------------
  // Ask the RAG system
  // -----------------------------------------------

  const result =
    await askQuestion({

      question:
        input.question,
    });


  // -----------------------------------------------
  // Return answer
  // -----------------------------------------------

  return {

    data: {

      ...result,

      scope: {

        mode:
          "ALL_WEBSITES",
      },
    },
  };
}