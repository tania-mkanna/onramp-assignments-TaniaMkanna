import { prisma } from "../../../shared/src/database/prisma.js";
import { generateEmbedding } from "../../../rag/src/embedding.js";
import { searchSimilarChunks } from "../../../shared/src/database/vectorRepository.js";

export async function keywordSearch(query: string, domain?: string) {
  return prisma.processedPage.findMany({
    where: {
      cleanedText: { contains: query, mode: "insensitive" },
      ...(domain ? { rawPage: { domain } } : {}),
    },
    include: { rawPage: true },
    take: 20,
  });
}

export async function semanticSearch(query: string, domain?: string, topK = 5) {
  const embedding = await generateEmbedding(query);
  return searchSimilarChunks(embedding, topK, domain);
}