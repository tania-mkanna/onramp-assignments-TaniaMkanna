import type { Request, Response } from "express";

import {
  askRagQuestion,
  dispatchCrawl,
  getCrawlSessionDetails,
  listWebsitePages,
  listWebsites,
} from "../services/apiService.js";
import {
  pagesQuerySchema,
  websitesQuerySchema,
} from "../services/apiSchemas.js";

function sendValidationError(
  res: Response,
  details: unknown,
) {
  res.status(400).json({
    error: "ValidationError",
    details,
  });
}

function sendNotFound(
  res: Response,
  message: string,
) {
  res.status(404).json({
    error: "NotFound",
    message,
  });
}

function getSingleParam(
  value: string | string[] | undefined,
  name: string,
) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getHealthHandler(
  _req: Request,
  res: Response,
) {
  res.json({
    ok: true,
    service: "api",
    timestamp: new Date().toISOString(),
  });
}

export async function dispatchCrawlHandler(
  req: Request,
  res: Response,
) {
  const result = await dispatchCrawl(req.body);
  res.status(202).json(result);
}

export async function getCrawlSessionHandler(
  req: Request,
  res: Response,
) {
  try {
    const sessionId = getSingleParam(
      req.params.sessionId,
      "sessionId",
    );

    const result = await getCrawlSessionDetails(
      sessionId,
    );

    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Crawl session not found";

    sendNotFound(res, message);
   }
 }
 
 export async function listWebsitesHandler(
   req: Request,
   res: Response,
 ) {
   const queryResult = websitesQuerySchema.safeParse(
     req.query,
   );
 
   if (!queryResult.success) {
     sendValidationError(
       res,
       queryResult.error.flatten(),
     );
 
     return;
   }
 
   const result = await listWebsites(
     queryResult.data,
   );
 
   res.json(result);
 }
 
 export async function listWebsitePagesHandler(
   req: Request,
   res: Response,
 ) {
   const queryResult = pagesQuerySchema.safeParse(
     req.query,
   );
 
   if (!queryResult.success) {
     sendValidationError(
       res,
       queryResult.error.flatten(),
     );
 
     return;
   }
 
   try {
    const websiteId = getSingleParam(
      req.params.websiteId,
      "websiteId",
    );

     const result = await listWebsitePages(
      websiteId,
       queryResult.data,
     );
 
     res.json(result);
   } catch (error) {
     const message =
       error instanceof Error
         ? error.message
         : "Website not found";
 
     sendNotFound(res, message);
   }
 }
 
 export async function askQuestionHandler(
   req: Request,
   res: Response,
 ) {
   const result = await askRagQuestion(req.body);
   res.json(result);
 }
