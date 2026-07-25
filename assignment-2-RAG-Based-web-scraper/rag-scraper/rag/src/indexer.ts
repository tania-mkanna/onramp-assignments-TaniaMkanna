import { prisma } from "../../shared/src/database/prisma.js";
import { chunkProcessedContent } from "./semanticChunker.js";
import { generateEmbedding } from "./embedding.js";
import { saveDocumentChunk } from "../../shared/src/database/vectorRepository.js";
import type { ProcessedContent } from "../../processor/src/schemas/contentSchema.js";

export async function indexProcessedPages() {
  console.log("=== [RAG Indexer] Starting Document Indexing & Embedding ===");

  const processedPages = await prisma.processedPage.findMany();

  console.log(`[RAG Indexer] Found ${processedPages.length} processed pages to index.`);

  for (const page of processedPages) {
    console.log(`\n[Indexing] Document ID: ${page.id} - ${page.title}`);

    // Parse stored structured JSON
    const structuredPayload = page.structuredData as unknown as ProcessedContent;

    // 1. Generate Header-Aware Chunks
    const chunks = chunkProcessedContent(page.title, structuredPayload);
    console.log(`[Chunker] Created ${chunks.length} semantic chunks.`);

    // 2. Embed and Store each chunk
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);

      await saveDocumentChunk({
        processedPageId: page.id,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        sectionTitle: chunk.sectionTitle,
        tokenCount: chunk.tokenCount,
        embedding,
      });

      console.log(`[Indexed] Chunk #${chunk.chunkIndex} saved with vector dimension ${embedding.length}`);
    }
  }

  console.log("\n=== [RAG Indexer Complete] All documents chunked and indexed into pgvector ===");
}
    const scriptPath = process.argv[1];
    if (scriptPath &&
    (scriptPath.includes("rag/src/indexer.ts") ||
        scriptPath.includes("rag\\src\\indexer.ts"))
    ) {
    indexProcessedPages()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error("Indexing failed:", err);
        process.exit(1);
        });
}