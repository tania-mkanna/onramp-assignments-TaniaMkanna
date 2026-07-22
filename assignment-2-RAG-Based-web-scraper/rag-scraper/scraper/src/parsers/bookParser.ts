import * as cheerio from "cheerio";

interface Book {
  title: string;
  price: string;
}

export function parseBooks(html: string): Book[] {
  const $ = cheerio.load(html);

  const books: Book[] = [];

  $(".product_pod").each((_, element) => {
    const title = $(element).find("h3 a").attr("title") ?? "";

    const price = $(element)
      .find(".price_color")
      .text()
      .trim();

    books.push({
      title,
      price,
    });
  });

  return books;
}