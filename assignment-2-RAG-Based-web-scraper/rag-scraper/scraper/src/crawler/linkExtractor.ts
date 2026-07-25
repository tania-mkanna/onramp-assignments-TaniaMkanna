import * as cheerio from "cheerio";

import {
  isSameDomain,
} from "./urlFilter.js";

export function extractLinks(
  html: string,
  baseUrl: string,
): string[] {
  const $ =
    cheerio.load(html);

  const links =
    new Set<string>();

  $("a[href]").each(
    (_, element) => {
      const href =
        $(element).attr("href");

      if (!href) {
        return;
      }

      try {
        const absoluteUrl =
          new URL(
            href,
            baseUrl,
          );

        if (
          absoluteUrl.protocol !==
            "http:" &&
          absoluteUrl.protocol !==
            "https:"
        ) {
          return;
        }

        if (
          !isSameDomain(
            absoluteUrl.toString(),
            baseUrl,
          )
        ) {
          return;
        }

        absoluteUrl.hash = "";

        links.add(
          absoluteUrl.toString(),
        );
      } catch {
        // Ignore invalid URLs.
      }
    },
  );

  return Array.from(links);
}