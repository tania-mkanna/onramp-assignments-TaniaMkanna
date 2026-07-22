import * as cheerio from "cheerio";

export function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const baseHostname = new URL(baseUrl).hostname;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;

    try {
      // Resolve relative URLs to absolute URLs
      const absoluteUrl = new URL(href, baseUrl);

      // Only crawl links within the exact same domain
      if (absoluteUrl.hostname === baseHostname) {
        // Strip trailing slashes & fragments (#) for link normalization
        absoluteUrl.hash = "";
        links.add(absoluteUrl.toString());
      }
    } catch {
      // Invalid URL format - ignore silently
    }
  });

  return Array.from(links);
}