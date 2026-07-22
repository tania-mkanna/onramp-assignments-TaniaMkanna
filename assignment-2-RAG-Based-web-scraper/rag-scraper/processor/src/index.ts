import { prisma } from "../../shared/src/database/prisma.js";
import { cleanAndExtractHTML } from "./cleaner/htmlCleaner.js";
import { saveProcessedPage } from "../../shared/src/database/processedPageRepository.js";

export async function processUnprocessedPages() {
  console.log("=== [Processor] Scanning for Unprocessed Raw Pages ===");

  // Find raw page versions that do not have a corresponding entry in processed_pages
  const processedVersions = await prisma.processedPage.findMany({
    select: {
      rawPageVersionId: true,
    },
  });

  const processedVersionIds = processedVersions.map(
    (p) => p.rawPageVersionId
  );

  const unprocessedVersions = await prisma.rawPageVersion.findMany({
    where: {
      id: {
        notIn: processedVersionIds,
      },
    },
    include: {
      rawPage: true,
    },
    take: 50,
  });

  console.log(
    `[Processor] Found ${unprocessedVersions.length} unprocessed page versions.`
  );

  let successCount = 0;
  let failureCount = 0;

  for (const version of unprocessedVersions) {
    try {
      console.log(
        `[Processor] Processing Raw Version ID: ${version.id} (${version.rawPage.url})`
      );

      const { cleanedText, structuredPayload } =
        cleanAndExtractHTML(version.htmlContent);

      await saveProcessedPage({
        rawPageId: version.rawPageId,
        rawPageVersionId: version.id,
        title: structuredPayload.title,
        cleanedText,
        structuredPayload,
      });

      console.log(
        `[Processor Success] Saved clean structured data for: ${structuredPayload.title}`
      );

      successCount++;
    } catch (error) {
      console.error(
        `[Processor Failure] Failed processing version ${version.id}:`,
        error
      );

      failureCount++;
    }
  }

  console.log(
    `=== [Processor Complete] Processed: ${successCount} | Failed: ${failureCount} ===`
  );
}

// Run processor directly
processUnprocessedPages()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Processor run failed:", err);
    process.exit(1);
  });