import { prisma } from "./prisma.js";
import { Prisma } from "../generated/prisma/client.js";

interface SaveProcessedDocumentInput {
  pageVersionId: string;
  title?: string;
  cleanedText: string;
  structuredData?: Prisma.InputJsonValue;
}

export async function saveProcessedDocument(
  data: SaveProcessedDocumentInput,
) {
  console.log("[DB] saveProcessedDocument CALLED");
  console.log("[DB] PageVersion ID:", data.pageVersionId);

  // --------------------------------------------------
  // 1. Check that the PageVersion exists
  // --------------------------------------------------

  const pageVersion = await prisma.pageVersion.findUnique({
    where: {
      id: data.pageVersionId,
    },
  });

  if (!pageVersion) {
    throw new Error(
      `PageVersion not found: ${data.pageVersionId}`,
    );
  }

  console.log(
    "[DB] PageVersion found:",
    pageVersion.id,
  );

  // --------------------------------------------------
  // 2. Check if this PageVersion was already processed
  // --------------------------------------------------

  const existingDocument =
    await prisma.processedDocument.findUnique({
      where: {
        pageVersionId: data.pageVersionId,
      },
    });

  if (existingDocument) {
    console.log(
      "[DB] PageVersion already processed. Returning existing document.",
    );

    return existingDocument;
  }

  // --------------------------------------------------
  // 3. Create the ProcessedDocument
  // --------------------------------------------------

 const processedDocument = await prisma.processedDocument.create({
  data: {
    pageVersionId: data.pageVersionId,
    title: data.title ?? null,
    cleanedText: data.cleanedText,

    ...(data.structuredData !== undefined && {
      structuredData: data.structuredData as Prisma.InputJsonValue,
    }),
  },
});

  console.log(
    "[DB] ProcessedDocument saved:",
    processedDocument.id,
  );

  return processedDocument;
}

