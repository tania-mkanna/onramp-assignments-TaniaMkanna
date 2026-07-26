import { z } from "zod";

// =====================================================
// CRAWL
// =====================================================

/**
 * User-facing crawl request.
 *
 * The user only provides the URL.
 *
 * Internal crawler configuration such as:
 * - maxPages
 * - maxDepth
 * - useBrowser
 *
 * is controlled by the API.
 */
export const crawlDispatchSchema = z.object({
  url: z.url(),
});

export type CrawlDispatchInput =
  z.infer<typeof crawlDispatchSchema>;


// =====================================================
// RAG QUESTION
// =====================================================

/**
 * User-facing RAG request.
 *
 * The user only provides a question.
 *
 * The RAG system searches the indexed content
 * across the available scraped websites.
 */
export const askSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Question cannot be empty."),
});

export type AskInput =
  z.infer<typeof askSchema>;


// =====================================================
// WEBSITE LIST
// =====================================================
//
// These are internal/monitoring endpoints.
// They are not required as user inputs.
//

export const websitesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50),
});

export type WebsitesQueryInput =
  z.infer<typeof websitesQuerySchema>;


// =====================================================
// PAGE LIST
// =====================================================
//
// Internal/monitoring endpoint.
//

export const pagesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100),
});

export type PagesQueryInput =
  z.infer<typeof pagesQuerySchema>;