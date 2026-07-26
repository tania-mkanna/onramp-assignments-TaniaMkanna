import "dotenv/config";

import {
  Worker,
  type Job,
} from "bullmq";

import {
  prisma,
} from "../../../shared/src/database/prisma.js";

import {
  cleanAndExtractHTML,
} from "../processor/htmlCleaner.js";

import {
  upsertProcessedDocument,
} from "../../../shared/src/database/processedDocumentRepository.js";

import type {
  ProcessingJobData,
} from "../queues/processingQueue.js";


// =================================================
// REDIS CONNECTION
// =================================================

const redisConnection = {
  host:
    process.env.REDIS_HOST ??
    "localhost",

  port:
    Number(
      process.env.REDIS_PORT ??
      6379,
    ),
};


// =================================================
// PROCESS JOB
// =================================================

async function processProcessingJob(
  job: Job<ProcessingJobData>,
) {
  const {
    pageVersionId,
    pageId,
    websiteId,
    websiteName,
    url,
    normalizedUrl,
  } = job.data;


  console.log(
    `\n[ProcessingWorker] Processing job ${job.id}`,
  );


  console.log(
    `[ProcessingWorker] Website: ${websiteName}`,
  );


  console.log(
    `[ProcessingWorker] URL: ${url}`,
  );


  console.log(
    `[ProcessingWorker] PageVersion: ${pageVersionId}`,
  );


  // -----------------------------------------------
  // 1. Load PageVersion
  // -----------------------------------------------

  const pageVersion =
    await prisma.pageVersion.findUnique({
      where: {
        id:
          pageVersionId,
      },
    });


  if (!pageVersion) {
    throw new Error(
      `PageVersion not found: ${pageVersionId}`,
    );
  }


  console.log(
    `[ProcessingWorker] Loaded PageVersion ${pageVersion.id}`,
  );


  // -----------------------------------------------
  // 2. Clean and extract HTML
  // -----------------------------------------------

  const processed =
    cleanAndExtractHTML(
      pageVersion.htmlContent,
    );


  console.log(
    `[ProcessingWorker] HTML cleaned successfully`,
  );


  console.log(
    `[ProcessingWorker] Title: ${processed.structuredPayload.title}`,
  );


  console.log(
    `[ProcessingWorker] Word count: ${processed.structuredPayload.metadata.wordCount}`,
  );


  console.log(
    `[ProcessingWorker] Headings: ${processed.structuredPayload.headings.length}`,
  );


  console.log(
    `[ProcessingWorker] Paragraphs: ${processed.structuredPayload.paragraphs.length}`,
  );


  console.log(
    `[ProcessingWorker] Tables: ${processed.structuredPayload.tables.length}`,
  );


  // -----------------------------------------------
  // 3. Save ProcessedDocument
  // -----------------------------------------------

  const processedDocument =
    await upsertProcessedDocument({
      pageVersionId:
        pageVersion.id,

      title:
        processed.structuredPayload.title,

      cleanedText:
        processed.cleanedText,

      structuredData:
        processed.structuredPayload,
    });


  console.log(
    `[ProcessingWorker] ProcessedDocument saved: ${processedDocument.id}`,
  );


  // -----------------------------------------------
  // 4. Return result
  // -----------------------------------------------

  return {
    processedDocumentId:
      processedDocument.id,

    pageVersionId:
      pageVersion.id,

    pageId,

    websiteId,

    websiteName,

    url,

    normalizedUrl,

    wordCount:
      processed.structuredPayload.metadata.wordCount,
  };
}


// =================================================
// WORKER
// =================================================

export const processingWorker =
  new Worker<ProcessingJobData>(
    "processing",

    processProcessingJob,

    {
      connection:
        redisConnection,

      concurrency:
        1,

      lockDuration:
        60_000,
    },
  );


// =================================================
// WORKER EVENTS
// =================================================

processingWorker.on(
  "completed",
  (job) => {
    console.log(
      `[ProcessingWorker] Completed job ${job.id}`,
    );
  },
);


processingWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `[ProcessingWorker] Failed job ${job?.id}`,
    );

    console.error(
      error,
    );
  },
);


processingWorker.on(
  "error",
  (error) => {
    console.error(
      "[ProcessingWorker] Worker error:",
      error,
    );
  },
);


// =================================================
// START WORKER
// =================================================

console.log(
  "[ProcessingWorker] Worker started.",
);


console.log(
  "[ProcessingWorker] Waiting for jobs...",
);