import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const robotsParser = require("robots-parser");

type Robots = {
  isAllowed: (
    url: string,
    userAgent: string,
  ) => boolean | undefined;
};

const robotsCache =
  new Map<string, Robots | null>();

const USER_AGENT =
  "Distributed-RAG-Scraper/1.0";

// Single source of truth for how we interpret an
// ambiguous (undefined) result from isAllowed().
// Convention: no matching rule = allowed.
function checkAllowed(
  robots: Robots | null,
  url: string,
): boolean {
  if (!robots) {
    return true;
  }

  return robots.isAllowed(url, USER_AGENT) ?? true;
}

export async function canScrape(
  url: string,
): Promise<boolean> {
  const parsedUrl = new URL(url);

  const origin = parsedUrl.origin;

  // robots.txt was already fetched.
  if (robotsCache.has(origin)) {
    const robots = robotsCache.get(origin) ?? null;

    return checkAllowed(robots, url);
  }

  const robotsUrl =
    `${origin}/robots.txt`;

  try {
    const response =
      await fetch(robotsUrl);

    // No robots.txt means there are
    // no robots rules to apply.
    if (response.status === 404) {
      robotsCache.set(origin, null);

      return true;
    }

    // If robots.txt cannot be fetched,
    // fail closed for safety.
    if (!response.ok) {
      throw new Error(
        `robots.txt returned HTTP ${response.status}`,
      );
    }

    const text =
      await response.text();

    const parsedRobots =
      robotsParser(
        robotsUrl,
        text,
      );

    robotsCache.set(
      origin,
      parsedRobots,
    );

    return checkAllowed(parsedRobots, url);
  } catch (error) {
    console.error(
      `[Robots] Failed to read ${robotsUrl}`,
      error,
    );

    // Conservative behaviour:
    // do not crawl if robots.txt
    // cannot be checked at all.
    return false;
  }
}