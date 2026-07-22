import * as cheerio from "cheerio";
import { ProcessedContentSchema } from "../schemas/contentSchema.js";
import type {ProcessedContent} from "../schemas/contentSchema.js";

export function cleanAndExtractHTML(html: string): {
  cleanedText: string;
  structuredPayload: ProcessedContent;
} {
  const $ = cheerio.load(html);

  // 1. Strip boilerplate, noise, and non-content tags
  $(
    "script, style, noscript, iframe, nav, footer, header, svg, form, .advertisement, .ads, .cookie-banner, #comments"
  ).remove();

  // 2. Extract Document Metadata
  const title =
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled Document";

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  const language = $("html").attr("lang") || "en";

  // 3. Extract Headings (h1 to h6)
  const headings: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 0) {
      headings.push(text);
    }
  });

  // 4. Extract Tables
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  $("table").each((_, tableEl) => {
    const headers: string[] = [];
    $(tableEl)
      .find("th")
      .each((_, th) => {
        headers.push($(th).text().trim());
      });

    const rows: string[][] = [];
    $(tableEl)
      .find("tr")
      .each((_, tr) => {
        const row: string[] = [];
        $(tr)
          .find("td")
          .each((_, td) => {
            row.push($(td).text().trim());
          });
        if (row.length > 0) {
          rows.push(row);
        }
      });

    if (headers.length > 0 || rows.length > 0) {
      tables.push({ headers, rows });
    }
  });

  // 5. Extract Paragraphs
  const paragraphs: string[] = [];
  $("p, article, section, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 20) { // Filter out short fragments or menu links
      paragraphs.push(text);
    }
  });

  // 6. Build Raw Cleaned Text for RAG Chunking
  const cleanedText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = cleanedText.length > 0 ? cleanedText.split(/\s+/).length : 0;

  // 7. Assemble Structured Object & Validate with Zod
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

  const validatedPayload = ProcessedContentSchema.parse(rawPayload);

  return {
    cleanedText,
    structuredPayload: validatedPayload,
  };
}