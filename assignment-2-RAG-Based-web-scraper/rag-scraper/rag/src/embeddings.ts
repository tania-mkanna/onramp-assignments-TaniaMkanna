import { createHash } from "node:crypto";

const EMBEDDING_DIMENSIONS = 1536;

function fallbackEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return vector;
  }

  for (const token of tokens) {
    const digest = createHash("sha256").update(token).digest();

    for (let i = 0; i < digest.length; i += 1) {
      const value = digest[i] ?? 0;
      const nextValue = digest[(i + 1) % digest.length] ?? 0;
      const bucket = value % EMBEDDING_DIMENSIONS;
      const sign = nextValue % 2 === 0 ? 1 : -1;
      const current = vector[bucket] ?? 0;
      vector[bucket] = current + sign * (value / 255);
    }
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (norm === 0) {
    return vector;
  }

  return vector.map((value) => value / norm);
}

async function fetchOpenAIEmbedding(
  text: string,
): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      data?: Array<{ embedding?: number[] }>;
    };

    const embedding = payload.data?.[0]?.embedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      return null;
    }

    return embedding;
  } catch {
    return null;
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  }

  const remoteEmbedding = await fetchOpenAIEmbedding(normalizedText);

  return remoteEmbedding ?? fallbackEmbedding(normalizedText);
}
