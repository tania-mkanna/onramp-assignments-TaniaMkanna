import { searchSimilarChunks } from "../../shared/src/database/vectorRepository.js";
import { generateEmbedding } from "./embeddings.js";

interface AskQuestionInput {
  question: string;
  topK?: number;
  websiteId?: string;
}

export interface AskQuestionResult {
  question: string;
  answer: string;
  citations: Array<{
    title: string;
    url: string;
    similarityScore: number;
  }>;
}

const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

function buildAnswer(question: string, snippets: string[]): string {
  if (snippets.length === 0) {
    return "I could not find enough indexed content to answer that question yet.";
  }

  return [
    `Question: ${question}`,
    "",
    "Most relevant information from indexed pages:",
    ...snippets.map((snippet, index) => `${index + 1}. ${snippet}`),
  ].join("\n");
}

async function buildGroundedAnswer(
  question: string,
  evidence: Array<{ content: string; url: string; title: string }>,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || evidence.length === 0) {
    return buildAnswer(
      question,
      evidence.map((item) => item.content.slice(0, 320)),
    );
  }

  const contextBlock = evidence
    .map(
      (item, index) =>
        `Source ${index + 1} | ${item.title} | ${item.url}\n${item.content}`,
    )
    .join("\n\n");

  let text: string | undefined;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "You answer using only the provided sources. If the sources are insufficient, say so clearly. Keep the answer concise and factual.",
            },
            {
              role: "user",
              content: `Question:\n${question}\n\nSources:\n${contextBlock}`,
            },
          ],
          temperature: 0.1,
        }),
      },
    );

    if (response.ok) {
      const payload = (await response.json()) as {
        output_text?: string;
      };

      text = payload.output_text?.trim();
    }
  } catch {
    text = undefined;
  }

  if (!text) {
    return buildAnswer(
      question,
      evidence.map((item) => item.content.slice(0, 320)),
    );
  }

  return text;
}

export async function askQuestion(input: AskQuestionInput): Promise<AskQuestionResult> {
  const question = input.question.trim();

  if (!question) {
    throw new Error("Question cannot be empty");
  }

  const topK = Math.min(
    Math.max(input.topK ?? DEFAULT_TOP_K, 1),
    MAX_TOP_K,
  );

  const queryEmbedding = await generateEmbedding(question);

  const matches = await searchSimilarChunks(queryEmbedding, topK, input.websiteId);

  const citationsByUrl = new Map<
    string,
    { title: string; url: string; similarityScore: number }
  >();

  for (const match of matches) {
    const current = citationsByUrl.get(match.url);

    if (!current || match.similarityScore > current.similarityScore) {
      citationsByUrl.set(match.url, {
        title: match.pageTitle ?? match.websiteName,
        url: match.url,
        similarityScore: match.similarityScore,
      });
    }
  }

  const citations = Array.from(citationsByUrl.values()).sort(
    (a, b) => b.similarityScore - a.similarityScore,
  );

  const evidence = matches.slice(0, 5).map((match) => ({
    content: match.content,
    url: match.url,
    title: match.pageTitle ?? match.websiteName,
  }));

  const answer = await buildGroundedAnswer(question, evidence);

  return {
    question,
    answer,
    citations,
  };
}
