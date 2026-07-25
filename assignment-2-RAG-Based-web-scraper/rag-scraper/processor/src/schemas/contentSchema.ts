import { z } from "zod";

/**
 * A single extracted table.
 *
 * Example:
 *
 * {
 *   headers: ["Name", "Price"],
 *   rows: [
 *     ["Book A", "$20"],
 *     ["Book B", "$15"]
 *   ]
 * }
 */
const TableSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

/**
 * Metadata extracted from the HTML document.
 */
const MetadataSchema = z.object({
  description: z.string(),
  language: z.string(),
  wordCount: z.number().int().nonnegative(),
});

/**
 * The complete structured representation
 * of a processed HTML document.
 */
export const ProcessedContentSchema = z.object({
  title: z.string(),

  headings: z.array(z.string()),

  paragraphs: z.array(z.string()),

  tables: z.array(TableSchema),

  metadata: MetadataSchema,
});

/**
 * TypeScript type inferred from the Zod schema.
 */
export type ProcessedContent = z.infer<
  typeof ProcessedContentSchema
>;