import { chunkText } from "../../processor/src/chunker/textChunker.js";
import { saveDocumentChunk, deleteChunksForProcessedDocument } from "../../shared/src/database/vectorRepository.js";
import { generateEmbedding } from "./embeddings.js";

interface IndexProcessedDocumentInput {
  processedDocumentId: string;
  cleanedText: string;
  sectionTitle?: string | null;
}

export async function indexProcessedDocument(input: IndexProcessedDocumentInput) {
  const chunks = chunkText(input.cleanedText, {
    maxTokens: 500,
    overlapTokens: 50,
  });

  await deleteChunksForProcessedDocument(input.processedDocumentId);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);

    await saveDocumentChunk({
      processedDocumentId: input.processedDocumentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      tokenCount: chunk.tokenCount,
      embedding,
      ...(input.sectionTitle
        ? {
            sectionTitle: input.sectionTitle,
          }
        : {}),
    });
  }

  return {
    chunkCount: chunks.length,
  };
}
