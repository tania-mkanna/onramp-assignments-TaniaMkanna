import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "mock-key" });
const MOCK_DIM = 1536;

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    return mockEmbedding(text); // deterministic offline fallback
  }
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0]!.embedding;
}

function mockEmbedding(text: string): number[] {
  const vec = new Array(MOCK_DIM).fill(0);
  for (let i = 0; i < text.length; i++) vec[i % MOCK_DIM] += text.charCodeAt(i);
  const magnitude = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / magnitude);
}