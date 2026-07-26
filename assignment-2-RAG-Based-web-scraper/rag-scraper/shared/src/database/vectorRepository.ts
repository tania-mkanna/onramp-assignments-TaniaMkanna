import { prisma } from "./prisma.js";

const EMBEDDING_DIMENSIONS = 1536;
const MAX_TOP_K = 50;

export interface VectorSearchResult {
  chunkId: string;
  content: string;
  sectionTitle: string | null;
  pageTitle: string | null;
  url: string;
  websiteName: string;
  websiteId: string;
  similarityScore: number;
}

/**
 * Validate that an embedding matches the
 * pgvector(1536) column defined in Prisma.
 */
function validateEmbedding(
  embedding: number[],
  name: string,
) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `${name} must contain exactly ${EMBEDDING_DIMENSIONS} dimensions. ` +
      `Received ${embedding.length}.`,
    );
  }

  if (!embedding.every(Number.isFinite)) {
    throw new Error(
      `${name} contains invalid numeric values.`,
    );
  }
}

/**
 * Save or update a document chunk and its embedding.
 *
 * DocumentChunk
 *      ↓
 * ProcessedDocument
 *      ↓
 * PageVersion
 */
export async function saveDocumentChunk(data: {
  processedDocumentId: string;
  chunkIndex: number;
  content: string;
  sectionTitle?: string;
  tokenCount: number;
  embedding: number[];
}) {
  console.log("[DB] saveDocumentChunk CALLED");
  console.log(
    "[DB] ProcessedDocument ID:",
    data.processedDocumentId,
  );
  console.log(
    "[DB] Chunk index:",
    data.chunkIndex,
  );

  // Validate embedding dimensions.
  validateEmbedding(
    data.embedding,
    "Document chunk embedding",
  );

  // Convert number[] to pgvector format.
  const vectorLiteral = `[${data.embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO document_chunks (
      id,
      "processedDocumentId",
      "chunkIndex",
      content,
      "sectionTitle",
      "tokenCount",
      embedding,
      "createdAt"
    )
    VALUES (
      gen_random_uuid(),
      ${data.processedDocumentId},
      ${data.chunkIndex},
      ${data.content},
      ${data.sectionTitle ?? null},
      ${data.tokenCount},
      ${vectorLiteral}::vector,
      now()
    )
    ON CONFLICT (
      "processedDocumentId",
      "chunkIndex"
    )
    DO UPDATE SET
      content = EXCLUDED.content,
      "sectionTitle" = EXCLUDED."sectionTitle",
      "tokenCount" = EXCLUDED."tokenCount",
      embedding = EXCLUDED.embedding
  `;

  console.log(
    "[DB] Document chunk saved successfully.",
  );
}

export async function deleteChunksForProcessedDocument(
  processedDocumentId: string,
) {
  await prisma.documentChunk.deleteMany({
    where: {
      processedDocumentId,
    },
  });
}

/**
 * Search for semantically similar document chunks.
 *
 * DocumentChunk
 *      ↓
 * ProcessedDocument
 *      ↓
 * PageVersion
 *      ↓
 * Page
 *      ↓
 * Website
 *
 * Optionally filters results by websiteId.
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK: number,
  websiteId?: string,
): Promise<VectorSearchResult[]> {
  // Validate query embedding.
  validateEmbedding(
    queryEmbedding,
    "Query embedding",
  );

  // Keep topK within a safe range.
  const safeTopK = Math.min(
    Math.max(topK, 1),
    MAX_TOP_K,
  );

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  console.log(
    "[DB] Searching similar chunks...",
  );

  console.log(
    "[DB] topK:",
    safeTopK,
  );

  console.log(
    "[DB] websiteId:",
    websiteId ?? "ALL",
  );

  // --------------------------------------------------
  // Search within one website
  // --------------------------------------------------

  if (websiteId) {
    return prisma.$queryRaw<VectorSearchResult[]>`
      SELECT
        dc.id AS "chunkId",
        dc.content,
        dc."sectionTitle",

        pd.title AS "pageTitle",

        p.url AS "url",

        w.name AS "websiteName",
        w.id AS "websiteId",

        1 - (
          dc.embedding <=> ${vectorLiteral}::vector
        ) AS "similarityScore"

      FROM document_chunks dc

      JOIN processed_documents pd
        ON pd.id = dc."processedDocumentId"

      JOIN page_versions pv
        ON pv.id = pd."pageVersionId"

      JOIN pages p
        ON p.id = pv."pageId"

      JOIN websites w
        ON w.id = p."websiteId"

      WHERE
        dc.embedding IS NOT NULL
        AND w.id = ${websiteId}

      ORDER BY
        dc.embedding <=> ${vectorLiteral}::vector

      LIMIT ${safeTopK}
    `;
  }

  // --------------------------------------------------
  // Search across all websites
  // --------------------------------------------------

  return prisma.$queryRaw<VectorSearchResult[]>`
    SELECT
      dc.id AS "chunkId",
      dc.content,
      dc."sectionTitle",

      pd.title AS "pageTitle",

      p.url AS "url",

      w.name AS "websiteName",
      w.id AS "websiteId",

      1 - (
        dc.embedding <=> ${vectorLiteral}::vector
      ) AS "similarityScore"

    FROM document_chunks dc

    JOIN processed_documents pd
      ON pd.id = dc."processedDocumentId"

    JOIN page_versions pv
      ON pv.id = pd."pageVersionId"

    JOIN pages p
      ON p.id = pv."pageId"

    JOIN websites w
      ON w.id = p."websiteId"

    WHERE
      dc.embedding IS NOT NULL

    ORDER BY
      dc.embedding <=> ${vectorLiteral}::vector

    LIMIT ${safeTopK}
  `;
}