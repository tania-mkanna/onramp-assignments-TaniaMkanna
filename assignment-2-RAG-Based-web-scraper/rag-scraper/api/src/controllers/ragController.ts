import type { Request, Response, NextFunction } from "express";
import { askQuestion } from "../services/ragService.js";
import type { TopicKey } from "../config/topics.js";

export async function askController(req: Request, res: Response, next: NextFunction) {
  try {
    const { topic, question } = req.body as { topic: TopicKey; question: string };
    const result = await askQuestion(topic, question);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}