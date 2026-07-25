import type { Request, Response, NextFunction } from "express";
import { getRawPages, getProcessedPages } from "../services/pageService.js";

export async function getRawPagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const domain = req.query.domain as string | undefined;
    const pages = await getRawPages(domain);
    res.json({ count: pages.length, pages });
  } catch (error) { next(error); }
}

export async function getProcessedPagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const domain = req.query.domain as string | undefined;
    const pages = await getProcessedPages(domain);
    res.json({ count: pages.length, pages });
  } catch (error) { next(error); }
}