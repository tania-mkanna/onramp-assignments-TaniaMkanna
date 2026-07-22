import { prisma } from "./prisma.js";
import type {ProcessedContent } from "../../../processor/src/schemas/contentSchema.js";

interface SaveProcessedPageInput {
  rawPageId: string;
  rawPageVersionId: string;
  title: string;
  cleanedText: string;
  structuredPayload: ProcessedContent;
}

export async function saveProcessedPage(data: SaveProcessedPageInput) {
  // Check if this specific version is already processed
  const existing = await prisma.processedPage.findUnique({
    where: { rawPageVersionId: data.rawPageVersionId },
  });

  if (existing) {
    console.log(`[Processor DB] Version ${data.rawPageVersionId} already processed. Skipping.`);
    return existing;
  }

  // Create new ProcessedPage record linked to the specific raw version
  return await prisma.processedPage.create({
    data: {
      rawPageId: data.rawPageId,
      rawPageVersionId: data.rawPageVersionId,
      title: data.title,
      cleanedText: data.cleanedText,
      structuredData: data.structuredPayload as unknown as object,
    },
  });
}