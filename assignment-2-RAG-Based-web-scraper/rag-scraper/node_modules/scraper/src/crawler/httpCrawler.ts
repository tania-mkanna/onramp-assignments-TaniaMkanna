import axios from "axios";

export interface CrawlResult {
  url: string;
  html: string;
  statusCode: number;
  contentType?: string;
  fetchedAt: Date;
}

export async function crawlHttp(
  url: string,
): Promise<CrawlResult> {
  console.log(
    `[HTTP Crawler] Fetching ${url}`,
  );

  const response =
    await axios.get<string>(
      url,
      {
        headers: {
          "User-Agent":
            "Distributed-RAG-Scraper/1.0",
        },

        timeout: 10_000,

        // We want to receive the HTTP response
        // even for 4xx and 5xx statuses.
        validateStatus: () => true,
      },
    );

  const contentType =
    response.headers[
      "content-type"
    ];

  return {
    url,

    html:
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(
            response.data,
          ),

    statusCode:
      response.status,

    ...(contentType
      ? {
          contentType:
            String(contentType),
        }
      : {}),

    fetchedAt:
      new Date(),
  };
}