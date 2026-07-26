import * as cheerio from "cheerio";

import {
  ProcessedContentSchema,
  type ProcessedContent,
} from "../schemas/contentSchema.js";

export interface CleanedHTMLResult {
  cleanedText: string;
  structuredPayload: ProcessedContent;
}

/**
 * Removes unnecessary HTML elements and extracts
 * useful content for processing and RAG.
 *
 * Responsibilities:
 *
 * - Remove scripts and styles
 * - Remove common boilerplate
 * - Extract document title
 * - Extract metadata
 * - Extract headings
 * - Extract paragraphs
 * - Extract tables
 * - Produce cleaned text
 * - Validate structured data with Zod
 */
export function cleanAndExtractHTML(
  html: string,
): CleanedHTMLResult {
  if (!html || html.trim().length === 0) {
    throw new Error(
      "Cannot process empty HTML content.",
    );
  }

  const $ = cheerio.load(html);

  // --------------------------------------------------
  // 1. Remove unnecessary HTML elements
  // --------------------------------------------------

  $(
    [
      "script",
      "style",
      "noscript",
      "iframe",
      "svg",
      "form",
      "template",

      // Common page boilerplate
      "nav",
      "header",
      "footer",
      "aside",

      // Common cookie / advertisement elements
      ".advertisement",
      ".ads",
      ".ad",
      ".cookie-banner",
      ".cookie-consent",
      "#comments",
      "#cookie-banner",
    ].join(", "),
  ).remove();

  // --------------------------------------------------
  // 2. Extract document title
  // --------------------------------------------------

  const title =
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled Document";

  // --------------------------------------------------
  // 3. Extract metadata
  // --------------------------------------------------

  const description =
    $('meta[name="description"]')
      .attr("content")
      ?.trim() ||
    $('meta[property="og:description"]')
      .attr("content")
      ?.trim() ||
    "";

  const language =
    $("html").attr("lang")?.trim() ||
    "unknown";

  // --------------------------------------------------
  // 4. Extract headings
  // --------------------------------------------------

  const headings: string[] = [];

  $("h1, h2, h3, h4, h5, h6").each(
    (_, element) => {
      const text = normalizeText(
        $(element).text(),
      );

      if (text.length > 0) {
        headings.push(text);
      }
    },
  );

  // --------------------------------------------------
  // 5. Extract tables
  // --------------------------------------------------

  const tables: Array<{
    headers: string[];
    rows: string[][];
  }> = [];

  $("table").each((_, tableElement) => {
    const headers: string[] = [];

    // First try to get explicit <th> elements.
    $(tableElement)
      .find("thead th")
      .each((_, th) => {
        const text = normalizeText(
          $(th).text(),
        );

        if (text.length > 0) {
          headers.push(text);
        }
      });

    // If there is no <thead>, check the first row.
    if (headers.length === 0) {
      $(tableElement)
        .find("tr")
        .first()
        .find("th")
        .each((_, th) => {
          const text = normalizeText(
            $(th).text(),
          );

          if (text.length > 0) {
            headers.push(text);
          }
        });
    }

    const rows: string[][] = [];

    $(tableElement)
      .find("tr")
      .each((_, rowElement) => {
        const row: string[] = [];

        $(rowElement)
          .find("td")
          .each((_, cellElement) => {
            const text = normalizeText(
              $(cellElement).text(),
            );

            row.push(text);
          });

        if (row.length > 0) {
          rows.push(row);
        }
      });

    if (
      headers.length > 0 ||
      rows.length > 0
    ) {
      tables.push({
        headers,
        rows,
      });
    }
  });

  // --------------------------------------------------
  // 6. Extract paragraphs and list items
  // --------------------------------------------------

  const paragraphs: string[] = [];

  $("p, li").each((_, element) => {
    const text = normalizeText(
      $(element).text(),
    );

    // Ignore very short fragments such as
    // menu items or isolated labels.
    if (text.length > 20) {
      paragraphs.push(text);
    }
  });

  // --------------------------------------------------
  // 7. Build cleaned text for RAG
  // --------------------------------------------------

  const cleanedText = normalizeText(
    $("body").text(),
  );

  // --------------------------------------------------
  // 8. Calculate word count
  // --------------------------------------------------

  const wordCount =
    cleanedText.length > 0
      ? cleanedText.split(/\s+/).length
      : 0;

  // --------------------------------------------------
  // 9. Build structured payload
  // --------------------------------------------------

  const rawPayload = {
    title,
    headings,
    paragraphs,
    tables,
    metadata: {
      description,
      language,
      wordCount,
    },
  };

  // --------------------------------------------------
  // 10. Validate structured data
  // --------------------------------------------------

  const structuredPayload =
    ProcessedContentSchema.parse(
      rawPayload,
    );

  // --------------------------------------------------
  // 11. Return processed content
  // --------------------------------------------------

  return {
    cleanedText,
    structuredPayload,
  };
}

/**
 * Normalize whitespace in extracted text.
 */
function normalizeText(
  text: string,
): string {
  return text
    .replace(/\s+/g, " ")
    .trim();
}