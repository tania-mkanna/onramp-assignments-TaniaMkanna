const lastRequestByDomain =
  new Map<string, number>();

const DEFAULT_DELAY_MS = 1000;

export async function waitForDomain(
  url: string,
  delayMs: number = DEFAULT_DELAY_MS,
): Promise<void> {
  const domain =
    new URL(url).hostname;

  const lastRequest =
    lastRequestByDomain.get(domain);

  if (lastRequest !== undefined) {
    const elapsed =
      Date.now() - lastRequest;

    const remaining =
      delayMs - elapsed;

    if (remaining > 0) {
      console.log(
        `[RateLimiter] Waiting ${remaining}ms for ${domain}`,
      );

      await sleep(remaining);
    }
  }

  lastRequestByDomain.set(
    domain,
    Date.now(),
  );
}

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        milliseconds,
      ),
  );
}