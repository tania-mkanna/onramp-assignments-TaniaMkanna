import {
  cleanAndExtractHTML,
} from "../cleaner/htmlCleaner.js";

import {
  createProcessedDocument,
  getProcessedDocumentByPageVersionId,
  upsertProcessedDocument,
} from "../../../shared/src/database/processedDocumentRepository.js";

import {
  prisma,
} from "../../../shared/src/database/prisma.js";


// =================================================
// PROCESS PAGE VERSION
// =================================================

/**
 * Processes a PageVersion by:
 *
 * 1. Loading the raw HTML from the database
 * 2. Cleaning and extracting useful content
 * 3. Creating or updating a ProcessedDocument
 *
 * The ProcessedDocument will later be used
 * by the chunking and embedding pipeline.
 */
export async function processPageVersion(
  pageVersionId: string,
) {
  console.log(
    `\n[ProcessedService] Processing PageVersion: ${pageVersionId}`,
  );


  // -----------------------------------------------
  // 1. Find PageVersion
  // -----------------------------------------------

  const pageVersion =
    await prisma.pageVersion.findUnique({
      where: {
        id:
          pageVersionId,
      },
    });


  if (!pageVersion) {
    throw new Error(
      `PageVersion not found: ${pageVersionId}`,
    );
  }


  console.log(
    `[ProcessedService] PageVersion found`,
  );


  console.log(
    `[ProcessedService] HTML length: ${pageVersion.htmlContent.length}`,
  );


  // -----------------------------------------------
  // 2. Clean and extract HTML
  // -----------------------------------------------

  const cleaned =
    cleanAndExtractHTML(
      pageVersion.htmlContent,
    );


  console.log(
    `[ProcessedService] HTML cleaned successfully`,
  );


  console.log(
    `[ProcessedService] Title: ${cleaned.structuredPayload.title}`,
  );


  console.log(
    `[ProcessedService] Word count: ${cleaned.structuredPayload.metadata.wordCount}`,
  );


  console.log(
    `[ProcessedService] Headings: ${cleaned.structuredPayload.headings.length}`,
  );


  console.log(
    `[ProcessedService] Paragraphs: ${cleaned.structuredPayload.paragraphs.length}`,
  );


  console.log(
    `[ProcessedService] Tables: ${cleaned.structuredPayload.tables.length}`,
  );


  // -----------------------------------------------
  // 3. Check if already processed
  // -----------------------------------------------

  const existingDocument =
    await getProcessedDocumentByPageVersionId(
      pageVersionId,
    );


  // -----------------------------------------------
  // 4. Create or update ProcessedDocument
  // -----------------------------------------------

  let processedDocument;


  if (existingDocument) {

    console.log(
      `[ProcessedService] Updating existing ProcessedDocument: ${existingDocument.id}`,
    );


    processedDocument =
      await upsertProcessedDocument(
        pageVersionId,
        {
          title:
            cleaned.structuredPayload.title,

          cleanedText:
            cleaned.cleanedText,

          structuredData:
            cleaned.structuredPayload,
        },
      );

  } else {

    console.log(
      `[ProcessedService] Creating ProcessedDocument`,
    );


    processedDocument =
      await createProcessedDocument({
        pageVersionId,

        title:
          cleaned.structuredPayload.title,

        cleanedText:
          cleaned.cleanedText,

        structuredData:
          cleaned.structuredPayload,
      });
  }


  // -----------------------------------------------
  // 5. Return processed document
  // -----------------------------------------------

  console.log(
    `[ProcessedService] ProcessedDocument saved: ${processedDocument.id}`,
  );


  return {
    processedDocument,

    cleanedText:
      cleaned.cleanedText,

    structuredPayload:
      cleaned.structuredPayload,
  };
}