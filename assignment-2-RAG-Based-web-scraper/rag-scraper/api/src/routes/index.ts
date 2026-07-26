import {
  Router,
} from "express";

import {
  askQuestionHandler,
  dispatchCrawlHandler,
  getCrawlSessionHandler,
  getHealthHandler,
  listWebsitePagesHandler,
  listWebsitesHandler,
} from "../controllers/apiController.js";

import {
  validateBody,
} from "../middleware/validateRequest.js";

import {
  askSchema,
  crawlDispatchSchema,
} from "../services/apiSchemas.js";


const router =
  Router();


// =====================================================
// HEALTH
// =====================================================

router.get(
  "/health",
  getHealthHandler,
);


// =====================================================
// START CRAWL
// =====================================================

router.post(
  "/crawl/dispatch",

  validateBody(
    crawlDispatchSchema,
  ),

  dispatchCrawlHandler,
);


// =====================================================
// CRAWL SESSION STATUS
// =====================================================

router.get(
  "/crawl/sessions/:sessionId",

  getCrawlSessionHandler,
);


// =====================================================
// INTERNAL WEBSITE ENDPOINTS
// =====================================================

router.get(
  "/websites",

  listWebsitesHandler,
);


router.get(
  "/websites/:websiteId/pages",

  listWebsitePagesHandler,
);


// =====================================================
// RAG QUESTION
// =====================================================

router.post(
  "/ask",

  validateBody(
    askSchema,
  ),

  askQuestionHandler,
);


export default router;