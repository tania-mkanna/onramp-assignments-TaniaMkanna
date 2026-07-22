import axios from "axios";
import { canScrape } from "./robots.js";

export interface FetchResult {
    html: string;
    statusCode: number;
}

export async function fetchHTML(
    url: string
): Promise<FetchResult> {

    // 1. Check robots.txt
    const allowed = await canScrape(url);

    if (!allowed) {
        throw new Error(
            "Blocked by robots.txt"
        );
    }

    // 2. Fetch the page
    try {

        const response = await axios.get<string>(
            url,
            {
                timeout: 5000,

                headers: {
                    "User-Agent": "rag-scraper-bot"
                }
            }
        );

        // 3. Return HTML + HTTP status
        return {
            html: response.data,
            statusCode: response.status
        };

    } catch (error) {

        console.log(
            "Failed fetching:",
            url
        );

        throw error;
    }
}