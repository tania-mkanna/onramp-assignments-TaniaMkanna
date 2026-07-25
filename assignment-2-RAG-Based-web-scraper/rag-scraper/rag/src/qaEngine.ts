import { OpenAI } from "openai";
import { generateEmbedding } from "./embedding.js";
import { searchSimilarChunks } from "../../shared/src/database/vectorRepository.js";
import type { VectorSearchResult } from "../../shared/src/database/vectorRepository.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "mock-key" });

export interface RAGAnswerResponse {
  question: string;
  answer: string;
  citations: Array<{ title: string; url: string; similarityScore: number }>;
  retrievedChunks: VectorSearchResult[];
}

export interface RAGOptions {
  domain?: string; // scopes retrieval to one "card"/topic
  topK?: number;
}

export async function answerQuestionWithRAG(
  question: string,
  options: RAGOptions = {}
): Promise<RAGAnswerResponse> {
  const { domain, topK = 3 } = options;

  const queryEmbedding = await generateEmbedding(question);
  const retrievedChunks = await searchSimilarChunks(queryEmbedding, topK);

  if (retrievedChunks.length === 0) {
    return {
      question,
      answer: "I could not find any relevant scraped content to answer your question.",
      citations: [],
      retrievedChunks: [],
    };
  }

  const contextBlock = retrievedChunks
    .map((c, i) => `[Source ${i + 1}]: (${c.url})\nTitle: ${c.pageTitle}\nContent:\n${c.content}`)
    .join("\n\n------------------------\n\n");

  let answer = "";
  if (process.env.OPENAI_API_KEY) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that answers strictly using the provided context. Always cite sources inline like [Source 1].",
        },
        { role: "user", content: `Context:\n${contextBlock}\n\nQuestion: ${question}` },
      ],
    });
    answer = completion.choices[0]?.message.content ?? "No response generated.";
  } else {
    answer = `[Mock RAG Synthesis]: ${retrievedChunks[0]!.content.slice(0, 200)}...`;
  }

  const citations = retrievedChunks.map((c) => ({
    title: c.pageTitle,
    url: c.url,
    similarityScore: Math.round(c.similarityScore * 1000) / 1000,
  }));

  return { question, answer, citations, retrievedChunks };
}