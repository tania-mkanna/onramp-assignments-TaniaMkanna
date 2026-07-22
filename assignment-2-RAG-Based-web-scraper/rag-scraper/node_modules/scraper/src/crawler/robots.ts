import { createRequire } from "module";

const require = createRequire(import.meta.url);

const robotsParser = require("robots-parser");


export async function canScrape(url: string): Promise<boolean> {

    const robotsUrl = new URL("/robots.txt", url).href;

    try {
        const response = await fetch(robotsUrl);

        // No robots.txt file exists
        if (response.status === 404) {
            console.log("No robots.txt found. Allowing crawl.");
            return true;
        }

        const robotsText = await response.text();

        const robots = robotsParser(
            robotsUrl,
            robotsText
        );

        return robots.isAllowed(
            url,
            "rag-scraper-bot"
        ) ?? false;


    } catch (error) {
        console.error(
            "Failed to check robots.txt:",
            error
        );

        return false;
    }
}