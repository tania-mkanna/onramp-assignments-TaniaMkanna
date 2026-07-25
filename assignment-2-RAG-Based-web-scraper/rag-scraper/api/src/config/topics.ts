export const TOPICS = {
  books: { label: "Books", domain: "books.toscrape.com" },
  quotes: { label: "Quotes", domain: "quotes.toscrape.com" },
  other: { label: "Other Site", domain: "" }, // fill in once you add site #3
} as const;

export type TopicKey = keyof typeof TOPICS;