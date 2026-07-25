import type { ProcessedContent } from "../../processor/src/schemas/contentSchema.js";

export interface TextChunk {
  chunkIndex: number;
  content: string;
  sectionTitle: string;
  tokenCount: number;
}

const TARGET_CHUNK_WORDS = 200; // ~250 tokens
const OVERLAP_WORDS = 40;       // Context overlap window

export function chunkProcessedContent(
  title: string,
  structuredData: ProcessedContent
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;

  const sections = structuredData.paragraphs;
  let currentBuffer: string[] = [];
  let currentWordCount = 0;
  let currentSectionTitle = structuredData.headings[0] || title;

  for (const paragraph of sections) {
    const paragraphWords = paragraph.split(/\s+/);
    
    currentBuffer.push(paragraph);
    currentWordCount += paragraphWords.length;

    // If buffer exceeds target size, construct a chunk
    if (currentWordCount >= TARGET_CHUNK_WORDS) {
      const chunkText = currentBuffer.join("\n\n");

      chunks.push({
        chunkIndex: chunkIndex++,
        content: `Title: ${title}\nSection: ${currentSectionTitle}\n\n${chunkText}`,
        sectionTitle: currentSectionTitle,
        tokenCount: Math.ceil(currentWordCount * 1.3), // Approximate token estimation
      });

      // Maintain overlap for the next chunk
      const overlapText = paragraphWords.slice(-OVERLAP_WORDS).join(" ");
      currentBuffer = [overlapText];
      currentWordCount = OVERLAP_WORDS;
    }
  }

  // Flush remaining paragraphs into final chunk
  if (currentBuffer.length > 0 && currentWordCount > 10) {
    const chunkText = currentBuffer.join("\n\n");
    chunks.push({
      chunkIndex: chunkIndex++,
      content: `Title: ${title}\nSection: ${currentSectionTitle}\n\n${chunkText}`,
      sectionTitle: currentSectionTitle,
      tokenCount: Math.ceil(currentWordCount * 1.3),
    });
  }

  return chunks;
}