import { z } from "zod";

export const TableDataSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

export const ProcessedContentSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  headings: z.array(z.string()),
  paragraphs: z.array(z.string()),
  tables: z.array(TableDataSchema),
  metadata: z.object({
    description: z.string().optional(),
    language: z.string().optional(),
    wordCount: z.number().nonnegative(),
  }),
});

export type ProcessedContent = z.infer<typeof ProcessedContentSchema>;
export type TableData = z.infer<typeof TableDataSchema>;