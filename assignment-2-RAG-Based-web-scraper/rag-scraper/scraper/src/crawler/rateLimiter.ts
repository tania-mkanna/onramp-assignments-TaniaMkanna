import { createRequire } from "node:module";
import { redisConnection } from "../queues/crawlQueue.js";

const require = createRequire(import.meta.url);
const Redis = require("ioredis");

const redis = new Redis(redisConnection);

const DEFAULT_DELAY_MS = 1000;

export async function waitForDomain(
  url: string,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<void> {
  const domain = new URL(url).hostname;
  const key = `ratelimit:${domain}`;

  // Try to atomically claim this domain's "slot".
  // SET NX PX succeeds only if no other worker (anywhere)
  // has claimed this domain within the last `delayMs`.
  while (true) {
    const acquired = await redis.set(
      key,
      "1",
      "PX",
      delayMs,
      "NX",
    );

    if (acquired === "OK") {
      return;
    }

    // Someone else (this worker or another) holds the slot.
    // Wait roughly until it expires, then retry the claim.
    const ttl = await redis.pttl(key);
    const wait = ttl > 0 ? ttl : 50;

    console.log(
      `[RateLimiter] Waiting ${wait}ms for ${domain}`,
    );

    await sleep(Math.min(wait, delayMs));
  }
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
}