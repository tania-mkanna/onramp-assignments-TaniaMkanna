import {
  prisma,
} from "./prisma.js";

import {
  Prisma,
} from "../generated/prisma/client.js";


/**
 * Input used when creating a processed document.
 */
export interface CreateProcessedDocumentInput {
  pageVersionId: string;

  title?: string | null;

  cleanedText: string;

  structuredData?: Prisma.InputJsonValue | null;
}


/**
 * Input used when updating a processed document.
 */
export interface UpdateProcessedDocumentInput {
  title?: string | null;

  cleanedText?: string;

  structuredData?: Prisma.InputJsonValue | null;
}


/**
 * Create a new processed document.
 *
 * A ProcessedDocument represents the cleaned and structured
 * version of a specific PageVersion.
 */
export async function createProcessedDocument(
  data: CreateProcessedDocumentInput,
) {
  const {
    pageVersionId,
    title,
    cleanedText,
    structuredData,
  } = data;


  return prisma.processedDocument.create({
    data: {
      pageVersionId,

      title:
        title ?? null,

      cleanedText,

      ...(structuredData !== undefined
        ? {
            structuredData:
              structuredData === null
                ? Prisma.JsonNull
                : structuredData,
          }
        : {}),
    },
  });
}


/**
 * Get a processed document by its PageVersion ID.
 */
export async function getProcessedDocumentByPageVersionId(
  pageVersionId: string,
) {
  return prisma.processedDocument.findUnique({
    where: {
      pageVersionId,
    },
  });
}


/**
 * Get a processed document by its ID.
 */
export async function getProcessedDocumentById(
  id: string,
) {
  return prisma.processedDocument.findUnique({
    where: {
      id,
    },
  });
}


/**
 * Create or update a processed document.
 *
 * This is useful when a PageVersion is processed again.
 */
export async function upsertProcessedDocument(
  pageVersionId: string,
  data: UpdateProcessedDocumentInput,
) {
  const {
    title,
    cleanedText,
    structuredData,
  } = data;


  return prisma.processedDocument.upsert({
    where: {
      pageVersionId,
    },

    update: {
      ...(title !== undefined
        ? {
            title:
              title ?? null,
          }
        : {}),

      ...(cleanedText !== undefined
        ? {
            cleanedText,
          }
        : {}),

      ...(structuredData !== undefined
        ? {
            structuredData:
              structuredData === null
                ? Prisma.JsonNull
                : structuredData,
          }
        : {}),

      processedAt:
        new Date(),
    },

    create: {
      pageVersionId,

      title:
        title ?? null,

      cleanedText:
        cleanedText ?? "",

      ...(structuredData !== undefined
        ? {
            structuredData:
              structuredData === null
                ? Prisma.JsonNull
                : structuredData,
          }
        : {}),
    },
  });
}


/**
 * Delete a processed document.
 *
 * Its associated DocumentChunks are automatically
 * deleted because of the Prisma relation:
 *
 * onDelete: Cascade
 */
export async function deleteProcessedDocument(
  pageVersionId: string,
) {
  return prisma.processedDocument.delete({
    where: {
      pageVersionId,
    },
  });
}