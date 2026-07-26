import "dotenv/config";

import {
  Worker,
  type Job,
} from "bullmq";

import {
  processPageVersion,
} from "../../../processor/src/services/processorService.js";

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


  const processedResult =
    await processPageVersion(
      pageVersionId,
    );


  console.log(
    `[ProcessingWorker] ProcessedDocument saved: ${processedResult.processedDocument.id}`,
  );


  // -----------------------------------------------
  // 4. Return result
  // -----------------------------------------------

  return {
    processedDocumentId:
      processedResult.processedDocument.id,

    pageVersionId:
      pageVersionId,

    pageId,

    websiteId,

    websiteName,

    url,

    normalizedUrl,

    wordCount:
      processedResult.structuredPayload.metadata.wordCount,
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
  (job: Job<ProcessingJobData>) => {
    console.log(
      `[ProcessingWorker] Completed job ${job.id}`,
    );
  },
);


processingWorker.on(
  "failed",
  (job: Job<ProcessingJobData> | undefined, error: Error) => {
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
  (error: Error) => {
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