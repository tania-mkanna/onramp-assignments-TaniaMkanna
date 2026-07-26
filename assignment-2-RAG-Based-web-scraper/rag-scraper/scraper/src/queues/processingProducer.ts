import { processingQueue, type ProcessingJobData } from "./processingQueue.js";

export async function enqueueProcessingJob(data: ProcessingJobData) {
  const job = await processingQueue.add("process-page", data, {
    jobId: `process-${data.pageVersionId}`,
  });

  console.log(`[Queue] Added processing job ${job.id} for ${data.url}`);

  return job;
}
