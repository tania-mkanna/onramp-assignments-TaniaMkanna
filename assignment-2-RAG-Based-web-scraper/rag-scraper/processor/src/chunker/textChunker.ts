export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}

const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP_TOKENS = 50;

/**
 * Estimates token count.
 *
 * This is intentionally a lightweight approximation.
 * A common approximation for English text is:
 *
 *     tokens ≈ words * 1.3
 *
 * This is not an exact tokenizer.
 * The actual embedding model will tokenize the text later.
 */
function estimateTokenCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);

  return Math.ceil(words.length * 1.3);
}

/**
 * Splits text into overlapping chunks.
 *
 * The algorithm works with words rather than raw characters.
 * This prevents splitting words in the middle and makes
 * the resulting chunks more readable.
 */
export function chunkText(
  text: string,
  options: ChunkOptions = {},
): TextChunk[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlapTokens =
    options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

  if (maxTokens <= 0) {
    throw new Error("maxTokens must be greater than 0");
  }

  if (overlapTokens < 0) {
    throw new Error("overlapTokens cannot be negative");
  }

  if (overlapTokens >= maxTokens) {
    throw new Error(
      "overlapTokens must be smaller than maxTokens",
    );
  }

  const normalizedText = text
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedText) {
    return [];
  }

  const words = normalizedText.split(" ");

  // Convert token limits to approximate word limits.
  const maxWords = Math.max(
    1,
    Math.floor(maxTokens / 1.3),
  );

  const overlapWords = Math.min(
    Math.floor(overlapTokens / 1.3),
    maxWords - 1,
  );

  const chunks: TextChunk[] = [];

  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(
      start + maxWords,
      words.length,
    );

    const chunkWords = words.slice(start, end);

    const content = chunkWords.join(" ");

    chunks.push({
      chunkIndex,
      content,
      tokenCount: estimateTokenCount(content),
    });

    chunkIndex += 1;

    if (end >= words.length) {
      break;
    }

    start = end - overlapWords;
  }

  return chunks;
}