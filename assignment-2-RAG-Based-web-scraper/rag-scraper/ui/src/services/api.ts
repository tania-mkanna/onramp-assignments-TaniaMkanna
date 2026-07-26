const API_BASE_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:4000/api";


// ============================================================
// TYPES
// ============================================================

export interface CrawlResponse {
  message: string;

  data: {
    crawlSessionId: string;
    websiteId: string;
    pageId: string;
    jobId: string;
    websiteUrl: string;

    limits: {
      maxPages: number;
      maxDepth: number;
    };
  };
}


export interface RagSource {
  url?: string;
  title?: string;
  content?: string;
  score?: number;
}


export interface AskResponse {
  data: {
    answer: string;

    sources?: RagSource[];

    website?: {
      id: string;
      name: string;
      url: string;
    };
  };
}


// ============================================================
// START CRAWL
// ============================================================

export async function startCrawl(
  url: string,
): Promise<CrawlResponse> {

  const response =
    await fetch(
      `${API_BASE_URL}/crawl/dispatch`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          url,
        }),
      },
    );


  if (!response.ok) {

    const error =
      await response.json()
        .catch(
          () => null,
        );

    throw new Error(

      error?.message ??
      "Failed to start website crawl.",

    );

  }


  return response.json();

}


// ============================================================
// ASK RAG QUESTION
// ============================================================

export async function askQuestion(
  websiteUrl: string,
  question: string,
): Promise<AskResponse> {

  const response =
    await fetch(
      `${API_BASE_URL}/ask`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          websiteUrl,

          question,

        }),
      },
    );


  if (!response.ok) {

    const error =
      await response.json()
        .catch(
          () => null,
        );

    throw new Error(

      error?.message ??
      "Failed to get an answer.",

    );

  }


  return response.json();

}