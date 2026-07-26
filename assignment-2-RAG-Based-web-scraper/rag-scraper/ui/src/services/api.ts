const API_BASE_URL = "http://localhost:4000/api";

export interface CrawlRequest {
  url: string;
  mode: "STATIC" | "DYNAMIC";
  maxDepth: number;
  maxPages?: number;
}

export interface Citation {
  title: string;
  url: string;
  similarityScore: number;
}

export interface RAGResponse {
  question: string;
  answer: string;
  citations: Citation[];
}

export type TopicKey = "books" | "quotes" | "docs" | "other";

export async function dispatchCrawl(data: CrawlRequest) {
  const response = await fetch(`${API_BASE_URL}/crawl/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Dispatch crawl failed with status ${response.status}`);
  }

  return response.json();
}

export async function askRAGQuery(question: string, topic: TopicKey): Promise<RAGResponse> {
  const response = await fetch(`${API_BASE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, question }),
  });

  if (!response.ok) {
    throw new Error(`RAG query failed with status ${response.status}`);
  }

  return response.json();
}