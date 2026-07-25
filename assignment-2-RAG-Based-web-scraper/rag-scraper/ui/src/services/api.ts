const API_BASE_URL = "http://localhost:3000/api/v1";

export interface CrawlRequest {
  url: string;
  mode: "STATIC" | "DYNAMIC";
  maxDepth: number;
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

export async function dispatchCrawl(data: CrawlRequest) {
  const response = await fetch(`${API_BASE_URL}/crawl/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function askRAGQuery(question: string, topK = 3): Promise<RAGResponse> {
  const response = await fetch(`${API_BASE_URL}/query/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, topK }),
  });
  return response.json();
}