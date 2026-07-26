import { prisma } from "./prisma.js";
import { Prisma } from "../generated/prisma/index.js";

interface SavePageInput {
  websiteName: string;
  baseUrl: string;

  url: string;
  normalizedUrl: string;

  htmlContent: string;
  contentHash: string;
  statusCode: number;
  contentType?: string;
}

export interface SaveDiscoveredPageInput {
  websiteId: string;

  url: string;
  normalizedUrl: string;
}

export async function savePage(data: SavePageInput) {
  console.log("[DB] savePage CALLED");
  console.log("[DB] URL:", data.url);

  // --------------------------------------------------
  // 1. Find or create the website
  // --------------------------------------------------

  const website = await prisma.website.upsert({
    where: {
      baseUrl: data.baseUrl,
    },

    update: {},

    create: {
      name: data.websiteName,
      baseUrl: data.baseUrl,
    },
  });

  console.log("[DB] Website ID:", website.id);

  // --------------------------------------------------
  // 2. Find or create the page
  // --------------------------------------------------

  const page = await prisma.page.upsert({
    where: {
      websiteId_normalizedUrl: {
        websiteId: website.id,
        normalizedUrl: data.normalizedUrl,
      },
    },

    update: {
      url: data.url,
      lastCrawledAt: new Date(),
      status: "SUCCESS",
    },

    create: {
      websiteId: website.id,
      url: data.url,
      normalizedUrl: data.normalizedUrl,
      lastCrawledAt: new Date(),
      status: "SUCCESS",
    },
  });

  console.log("[DB] Page ID:", page.id);

  // --------------------------------------------------
  // 3. Check if the exact content already exists
  // --------------------------------------------------

  const existingVersion = await prisma.pageVersion.findFirst({
    where: {
      pageId: page.id,
      contentHash: data.contentHash,
    },
  });

  if (existingVersion) {
    console.log(
      "[DB] Content has not changed. No new PageVersion created.",
    );

    return existingVersion;
  }

  // --------------------------------------------------
  // 4. Find the latest version
  // --------------------------------------------------

  const latestVersion = await prisma.pageVersion.findFirst({
    where: {
      pageId: page.id,
    },

    orderBy: {
      version: "desc",
    },
  });

  const nextVersion = latestVersion
    ? latestVersion.version + 1
    : 1;

  console.log(
    `[DB] Creating PageVersion ${nextVersion} for Page ${page.id}`,
  );

  // --------------------------------------------------
  // 5. Create the new PageVersion
  // --------------------------------------------------

  const newVersion = await prisma.pageVersion.create({
    data: {
      pageId: page.id,
      version: nextVersion,
      htmlContent: data.htmlContent,
      contentHash: data.contentHash,
      statusCode: data.statusCode,
      contentType: data.contentType ?? null,
    },
  });

  console.log(
    "[DB] PageVersion saved:",
    newVersion.id,
  );

  return newVersion;
}

// ==================================================
// Register a discovered URL
// ==================================================
export async function saveDiscoveredPage(
  data: SaveDiscoveredPageInput,
) {
  console.log(
    "[DB] Checking discovered URL:",
    data.url,
  );

  // --------------------------------------------------
  // 1. Make sure the Website exists
  // --------------------------------------------------

  const website = await prisma.website.findUnique({
    where: {
      id: data.websiteId,
    },
  });

  if (!website) {
    throw new Error(
      `[DB] Website not found: ${data.websiteId}`,
    );
  }

  // --------------------------------------------------
  // 2. Try to create the page directly.
  //
  //    We do NOT check-then-create, because two workers
  //    can race between the check and the create. Instead
  //    we attempt the create and let the DB's unique
  //    constraint be the single source of truth. If we
  //    lose the race, we catch P2002 and fetch the row
  //    the other worker created.
  // --------------------------------------------------

  try {

    const page = await prisma.page.create({
      data: {
        websiteId: data.websiteId,
        url: data.url,
        normalizedUrl: data.normalizedUrl,
        status: "PENDING",
      },
    });

    console.log(
      "[DB] Discovered Page created:",
      page.id,
    );

    return {
      page,
      created: true,
    };

  } catch (error) {

    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    if (!isDuplicate) {
      throw error;
    }

    console.log(
      "[DB] Lost create race, fetching existing page:",
      data.url,
    );

    const existingPage = await prisma.page.findUnique({
      where: {
        websiteId_normalizedUrl: {
          websiteId: data.websiteId,
          normalizedUrl: data.normalizedUrl,
        },
      },
    });

    if (!existingPage) {
      // Should not happen — the constraint violation implies
      // a row exists. Re-throw the original error rather than
      // silently returning nothing.
      throw error;
    }

    return {
      page: existingPage,
      created: false,
    };

  }

}