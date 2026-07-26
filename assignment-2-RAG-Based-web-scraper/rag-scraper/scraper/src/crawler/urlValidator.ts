export function isSameDomain(
  url: string,
  baseUrl: string,
): boolean {
  try {
    const urlHostname =
      new URL(url).hostname;

    const baseHostname =
      new URL(baseUrl).hostname;

    return (
      urlHostname ===
      baseHostname
    );
  } catch {
    return false;
  }
}