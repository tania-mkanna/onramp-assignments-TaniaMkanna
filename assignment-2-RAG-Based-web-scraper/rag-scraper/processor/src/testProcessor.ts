import {
  cleanAndExtractHTML,
} from "./cleaner/htmlCleaner.js"

import {
  chunkText,
} from "../../rag/src/textChunker.js";


const html = `
<html lang="en">

<head>
  <title>Books to Scrape</title>

  <meta
    name="description"
    content="A website containing books"
  />

  <script>
    console.log("Remove me");
  </script>
</head>

<body>

  <header>
    Website Header
  </header>

  <nav>
    Home
    Books
    Contact
  </nav>

  <main>

    <h1>Books to Scrape</h1>

    <h2>Available Books</h2>

    <p>
      Books to Scrape is a website used for
      testing web scraping applications.
    </p>

    <p>
      The website contains many books with
      titles, prices, ratings, and availability.
    </p>

  </main>

  <footer>
    Website Footer
  </footer>

</body>

</html>
`;


// =================================================
// 1. CLEAN AND EXTRACT HTML
// =================================================

const processed =
  cleanAndExtractHTML(
    html,
  );


console.log(
  "\n=== CLEANED TEXT ===",
);

console.log(
  processed.cleanedText,
);


console.log(
  "\n=== STRUCTURED PAYLOAD ===",
);

console.log(
  JSON.stringify(
    processed.structuredPayload,
    null,
    2,
  ),
);


// =================================================
// 2. CHUNK CLEANED TEXT
// =================================================

const chunks =
  chunkText(
    processed.cleanedText,
    {
      chunkSize:
        200,

      overlap:
        50,
    },
  );


// =================================================
// 3. DISPLAY CHUNKS
// =================================================

console.log(
  "\n=== CHUNKS ===",
);

for (
  const chunk
  of chunks
) {

  console.log(
    `\n--- Chunk ${chunk.index} ---`,
  );

  console.log(
    `Start: ${chunk.startPosition}`,
  );

  console.log(
    `End: ${chunk.endPosition}`,
  );

  console.log(
    chunk.content,
  );
}