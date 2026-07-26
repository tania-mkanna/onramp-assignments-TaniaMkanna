// =================================================
// TEXT CHUNK
// =================================================

export interface TextChunk {
  index: number;

  content: string;

  startPosition: number;

  endPosition: number;
}


// =================================================
// CHUNK OPTIONS
// =================================================

export interface ChunkTextOptions {
  chunkSize?: number;

  overlap?: number;
}


// =================================================
// CHUNK TEXT
// =================================================

export function chunkText(
  text: string,
  options: ChunkTextOptions = {},
): TextChunk[] {

  const {
    chunkSize = 1000,

    overlap = 200,
  } = options;


  // -----------------------------------------------
  // 1. Validate input
  // -----------------------------------------------

  if (
    !text ||
    text.trim().length === 0
  ) {
    return [];
  }


  if (
    chunkSize <= 0
  ) {
    throw new Error(
      "chunkSize must be greater than 0",
    );
  }


  if (
    overlap < 0
  ) {
    throw new Error(
      "overlap cannot be negative",
    );
  }


  if (
    overlap >= chunkSize
  ) {
    throw new Error(
      "overlap must be smaller than chunkSize",
    );
  }


  // -----------------------------------------------
  // 2. Normalize text
  // -----------------------------------------------

  const normalizedText =
    text
      .replace(
        /\s+/g,
        " ",
      )
      .trim();


  if (
    normalizedText.length === 0
  ) {
    return [];
  }


  // -----------------------------------------------
  // 3. Create chunks
  // -----------------------------------------------

  const chunks: TextChunk[] = [];


  let startPosition =
    0;


  let index =
    0;


  while (
    startPosition <
    normalizedText.length
  ) {

    const endPosition =
      Math.min(
        startPosition +
          chunkSize,

        normalizedText.length,
      );


    const content =
      normalizedText
        .slice(
          startPosition,
          endPosition,
        )
        .trim();


    if (
      content.length > 0
    ) {
      chunks.push({
        index,

        content,

        startPosition,

        endPosition,
      });
    }


    // ---------------------------------------------
    // Stop when we reach the end
    // ---------------------------------------------

    if (
      endPosition >=
      normalizedText.length
    ) {
      break;
    }


    // ---------------------------------------------
    // Move forward while keeping overlap
    // ---------------------------------------------

    startPosition =
      endPosition -
      overlap;


    index++;
  }


  return chunks;
}