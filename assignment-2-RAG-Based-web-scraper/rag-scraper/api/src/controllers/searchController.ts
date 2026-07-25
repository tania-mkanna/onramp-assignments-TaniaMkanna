import type { Request, Response, NextFunction } from "express";
import { keywordSearch, semanticSearch } from "../services/searchService.js";

export async function searchController(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, mode = "keyword", domain } = req.query as { q: string; mode?: string; domain?: string };
    const results = mode === "semantic"
      ? await semanticSearch(q, domain)
      : await keywordSearch(q, domain);
    res.json({ mode, count: results.length, results });
  } catch (error) { next(error); }
}