export function normalizeUrl(
  url: string,
): string {
  const parsedUrl =
    new URL(url);

  // Fragments do not identify
  // a separate server resource.
  parsedUrl.hash = "";

  const trackingParameters = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
  ];

  for (
    const parameter of trackingParameters
  ) {
    parsedUrl.searchParams.delete(
      parameter,
    );
  }

  // Remove trailing slash,
  // except for the root URL.
  if (
    parsedUrl.pathname !== "/"
  ) {
    parsedUrl.pathname =
      parsedUrl.pathname.replace(
        /\/$/,
        "",
      );
  }

  return parsedUrl.toString();
}