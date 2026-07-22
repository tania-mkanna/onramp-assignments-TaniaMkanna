import { prisma } from "../database/prisma.js";

interface SaveRawPageInput {
  url: string;
  domain: string;
  htmlContent: string;
  contentHash: string;
  statusCode: number;
}

export async function saveRawPage(
  data: SaveRawPageInput
) {
  let rawPage = await prisma.rawPage.findUnique({
    where: {
      url: data.url,
    },
  });

  if (!rawPage) {
    rawPage = await prisma.rawPage.create({
      data: {
        url: data.url,
        domain: data.domain,
      },
    });
  }

  const latestVersion =
    await prisma.rawPageVersion.findFirst({
      where: {
        rawPageId: rawPage.id,
      },
      orderBy: {
        version: "desc",
      },
    });

  if (
    latestVersion &&
    latestVersion.contentHash === data.contentHash
  ) {
    console.log(
      "Content has not changed. Skipping."
    );

    return latestVersion;
  }

  const nextVersion =
    latestVersion
      ? latestVersion.version + 1
      : 1;

  const newVersion =
    await prisma.rawPageVersion.create({
      data: {
        rawPageId: rawPage.id,
        version: nextVersion,
        htmlContent: data.htmlContent,
        contentHash: data.contentHash,
        statusCode: data.statusCode,
      },
    });

  return newVersion;
}