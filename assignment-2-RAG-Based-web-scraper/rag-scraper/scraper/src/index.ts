import { fetchHTML } from "../src/crawler/httpCrawler.js";
import { parseBooks } from "../src/parsers/bookParser.js";

import { generateContentHash } from "../../shared/utils/hash.js";
import { saveRawPage } from "../../shared/src/database/rawPageRepository.js";

const url =
  "https://books.toscrape.com/";

async function main() {

  try {

    // 1. Fetch
    const result =
      await fetchHTML(url);

    // 2. Generate hash
    const contentHash =
      generateContentHash(result.html);

    // 3. Parse
    const books =
      parseBooks(result.html);

    // 4. Save to database
    await saveRawPage({

      url,

      domain:
        new URL(url).hostname,

      htmlContent:
        result.html,

      contentHash,

      statusCode:
        result.statusCode,

    });

    console.log(
      "Books:",
      books
    );

    console.log(
      "Page saved successfully"
    );

  } catch (error) {

    console.error(
      "Scraping failed:",
      error
    );

  }

}

main();