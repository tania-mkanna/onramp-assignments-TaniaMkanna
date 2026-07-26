import { isSameDomain } from "./urlValidator.js";

export interface UrlFilterOptions {
  baseUrl: string;

  allowedProtocols?: string[];

  excludedPathPatterns?: RegExp[];

  excludedQueryParameters?: string[];
}

const DEFAULT_EXCLUDED_PATH_PATTERNS = [
  /\/wp-admin/i,
  /\/wp-login/i,
  /\/login/i,
  /\/logout/i,
  /\/register/i,
  /\/signup/i,
  /\/createaccount/i,
  /\/special:/i,
  /\/special\//i,
];

const DEFAULT_EXCLUDED_QUERY_PARAMETERS = [
  "action",
  "edit",
  "login",
  "logout",
  "register",
  "signup",
];

const DEFAULT_ALLOWED_PROTOCOLS = [
  "http:",
  "https:",
];

export function shouldCrawlUrl(
  url: string,
  options: UrlFilterOptions,
): boolean {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  // -----------------------------------------------
  // 1. Check protocol
  // -----------------------------------------------

  const allowedProtocols =
    options.allowedProtocols ??
    DEFAULT_ALLOWED_PROTOCOLS;

  if (
    !allowedProtocols.includes(
      parsedUrl.protocol,
    )
  ) {
    return false;
  }

  // -----------------------------------------------
  // 2. Check same domain
  // -----------------------------------------------

  if (
    !isSameDomain(
      url,
      options.baseUrl,
    )
  ) {
    return false;
  }

  // -----------------------------------------------
  // 3. Ignore fragments
  // -----------------------------------------------

  if (
    parsedUrl.hash
  ) {
    return false;
  }

  // -----------------------------------------------
  // 4. Check excluded paths
  // -----------------------------------------------

  const excludedPathPatterns =
    options.excludedPathPatterns ??
    DEFAULT_EXCLUDED_PATH_PATTERNS;

  for (
    const pattern
    of excludedPathPatterns
  ) {
    if (
      pattern.test(
        parsedUrl.pathname,
      )
    ) {
      return false;
    }
  }

  // -----------------------------------------------
  // 5. Check excluded query parameters
  // -----------------------------------------------

  const excludedQueryParameters =
    options.excludedQueryParameters ??
    DEFAULT_EXCLUDED_QUERY_PARAMETERS;

  for (
    const parameter
    of excludedQueryParameters
  ) {
    if (
      parsedUrl.searchParams.has(
        parameter,
      )
    ) {
      return false;
    }
  }

  // -----------------------------------------------
  // 6. Ignore common non-HTML files
  // -----------------------------------------------

  const excludedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".rar",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".css",
    ".js",
    ".xml",
  ];

  const pathname =
    parsedUrl.pathname.toLowerCase();

  for (
    const extension
    of excludedExtensions
  ) {
    if (
      pathname.endsWith(
        extension,
      )
    ) {
      return false;
    }
  }

  return true;
}