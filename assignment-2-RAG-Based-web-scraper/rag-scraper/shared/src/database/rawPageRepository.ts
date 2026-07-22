import { prisma } from "./prisma.js";

interface SaveRawPageInput {
  url: string;
  domain: string;
  htmlContent: string;
  contentHash: string;
  statusCode: number;
}

export async function saveRawPage(data: SaveRawPageInput) {
  console.log("[DB] saveRawPage CALLED");
  console.log("[DB] URL:", data.url);

  const rawPage = await prisma.rawPage.upsert({
    where: {
      url: data.url,
    },
    update: {
      fetchedAt: new Date(),
    },
    create: {
      url: data.url,
      domain: data.domain,
    },
  });

  console.log("[DB] RawPage created/found:", rawPage);

  const existingVersion = await prisma.rawPageVersion.findFirst({
    where: {
      rawPageId: rawPage.id,
      contentHash: data.contentHash,
    },
  });

  if (existingVersion) {
    console.log("[DB] Duplicate version. Skipping.");
    return existingVersion;
  }

  const latestVersion = await prisma.rawPageVersion.findFirst({
    where: {
      rawPageId: rawPage.id,
    },
    orderBy: {
      version: "desc",
    },
  });

  const nextVersion = latestVersion
    ? latestVersion.version + 1
    : 1;

  console.log("[DB] Creating version:", nextVersion);

  const newVersion = await prisma.rawPageVersion.create({
    data: {
      rawPageId: rawPage.id,
      version: nextVersion,
      htmlContent: data.htmlContent,
      contentHash: data.contentHash,
      statusCode: data.statusCode,
    },
  });

  console.log("[DB] VERSION SAVED:", newVersion);

  return newVersion;
}