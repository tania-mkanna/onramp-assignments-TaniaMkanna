import type { FormEvent } from "react";
import { useState } from "react";

import {
  askQuestion,
  startCrawl,
} from "../services/api";


// ============================================================
// TYPES
// ============================================================

type CrawlStatus =
  | "idle"
  | "crawling"
  | "started"
  | "error";


interface Source {
  url?: string;
  title?: string;
  content?: string;
  score?: number;
}


// ============================================================
// COMPONENT
// ============================================================

export default function SiteConsole() {

  // ----------------------------------------------------------
  // Website URL
  // ----------------------------------------------------------

  const [
    websiteUrl,
    setWebsiteUrl,
  ] = useState("");


  // ----------------------------------------------------------
  // Question
  // ----------------------------------------------------------

  const [
    question,
    setQuestion,
  ] = useState("");


  // ----------------------------------------------------------
  // Crawl state
  // ----------------------------------------------------------

  const [
    crawlStatus,
    setCrawlStatus,
  ] =
    useState<CrawlStatus>(
      "idle",
    );


  const [
    crawlMessage,
    setCrawlMessage,
  ] =
    useState("");


  // ----------------------------------------------------------
  // Crawl session ID
  // ----------------------------------------------------------

  const [
    crawlSessionId,
    setCrawlSessionId,
  ] =
    useState<string | null>(
      null,
    );


  // ----------------------------------------------------------
  // RAG answer
  // ----------------------------------------------------------

  const [
    answer,
    setAnswer,
  ] =
    useState("");


  // ----------------------------------------------------------
  // RAG sources
  // ----------------------------------------------------------

  const [
    sources,
    setSources,
  ] =
    useState<Source[]>([]);


  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------

  const [
    isCrawling,
    setIsCrawling,
  ] =
    useState(false);


  const [
    isAsking,
    setIsAsking,
  ] =
    useState(false);


  // ----------------------------------------------------------
  // Error
  // ----------------------------------------------------------

  const [
    error,
    setError,
  ] =
    useState("");


  // ==========================================================
  // START CRAWL
  // ==========================================================

  async function handleStartCrawl(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError("");

    setCrawlMessage("");

    setAnswer("");

    setSources([]);


    // --------------------------------------------------------
    // Validate URL
    // --------------------------------------------------------

    if (!websiteUrl.trim()) {

      setError(
        "Please enter a website URL.",
      );

      return;

    }


    try {

      new URL(
        websiteUrl,
      );

    } catch {

      setError(
        "Please enter a valid website URL.",
      );

      return;

    }


    setIsCrawling(true);

    setCrawlStatus(
      "crawling",
    );


    try {

      const result =
        await startCrawl(
          websiteUrl.trim(),
        );


      setCrawlSessionId(

        result.data
          .crawlSessionId,

      );


      setCrawlStatus(
        "started",
      );


      setCrawlMessage(

        "Website crawling has started. " +
        "You can ask questions once the content has been processed and indexed.",

      );

    } catch (err) {

      setCrawlStatus(
        "error",
      );


      setError(

        err instanceof Error

          ? err.message

          : "Failed to start crawl.",

      );

    } finally {

      setIsCrawling(false);

    }

  }


  // ==========================================================
  // ASK QUESTION
  // ==========================================================

  async function handleAskQuestion(
    event: FormEvent<HTMLFormElement>,
  ) {

    event.preventDefault();

    setError("");

    setAnswer("");

    setSources([]);


    // --------------------------------------------------------
    // Validate URL
    // --------------------------------------------------------

    if (!websiteUrl.trim()) {

      setError(
        "Please enter the website URL first.",
      );

      return;

    }


    try {

      new URL(
        websiteUrl,
      );

    } catch {

      setError(
        "Please enter a valid website URL.",
      );

      return;

    }


    // --------------------------------------------------------
    // Validate question
    // --------------------------------------------------------

    if (!question.trim()) {

      setError(
        "Please enter a question.",
      );

      return;

    }


    setIsAsking(true);


    try {

      const result =
        await askQuestion(

          websiteUrl.trim(),

          question.trim(),

        );


      setAnswer(

        result.data.answer,

      );


      setSources(

        result.data.sources ??
        [],

      );

    } catch (err) {

      setError(

        err instanceof Error

          ? err.message

          : "Failed to get an answer.",

      );

    } finally {

      setIsAsking(false);

    }

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="site-console">

      <div className="console-container">


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="console-header">

          <p className="eyebrow">
            RAG WEB SCRAPER
          </p>

          <h1>
            Ask questions about any website
          </h1>

          <p className="subtitle">

            Enter a website URL to crawl its content,
            then ask natural-language questions
            grounded in the scraped data.

          </p>

        </header>


        {/* ================================================= */}
        {/* WEBSITE URL */}
        {/* ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <span className="step-number">
                01
              </span>

              <h2>
                Add a website
              </h2>

            </div>

          </div>


          <form
            onSubmit={
              handleStartCrawl
            }
          >

            <label
              htmlFor="website-url"
            >
              Website URL
            </label>


            <div className="input-row">

              <input

                id="website-url"

                type="url"

                value={
                  websiteUrl
                }

                onChange={(
                  event,
                ) =>
                  setWebsiteUrl(
                    event.target.value,
                  )
                }

                placeholder="https://example.com"

                disabled={
                  isCrawling
                }

                required

              />


              <button

                type="submit"

                disabled={
                  isCrawling ||
                  !websiteUrl.trim()
                }

              >

                {isCrawling

                  ? "Starting..."

                  : "Start Crawl"

                }

              </button>

            </div>

          </form>


          {/* Crawl status */}

          {crawlStatus ===
            "crawling" && (

            <div className="status status-loading">

              <span className="status-dot" />

              Starting website crawl...

            </div>

          )}


          {crawlStatus ===
            "started" && (

            <div className="status status-success">

              <span className="status-dot" />

              {crawlMessage}

            </div>

          )}


          {crawlSessionId && (

            <p className="session-id">

              Crawl session:

              <code>
                {crawlSessionId}
              </code>

            </p>

          )}

        </section>


        {/* ================================================= */}
        {/* QUESTION */}
        {/* ================================================= */}

        <section className="panel">

          <div className="panel-header">

            <div>

              <span className="step-number">
                02
              </span>

              <h2>
                Ask a question
              </h2>

            </div>

          </div>


          <form
            onSubmit={
              handleAskQuestion
            }
          >

            <label
              htmlFor="question"
            >
              Your question
            </label>


            <textarea

              id="question"

              value={
                question
              }

              onChange={(
                event,
              ) =>
                setQuestion(
                  event.target.value,
                )
              }

              placeholder="What is this website about?"

              rows={4}

              disabled={
                isAsking
              }

              required

            />


            <button

              type="submit"

              className="ask-button"

              disabled={

                isAsking ||

                !websiteUrl.trim() ||

                !question.trim()

              }

            >

              {isAsking

                ? "Thinking..."

                : "Ask Question"

              }

            </button>

          </form>

        </section>


        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (

          <div className="error-message">

            {error}

          </div>

        )}


        {/* ================================================= */}
        {/* ANSWER */}
        {/* ================================================= */}

        {answer && (

          <section className="answer-panel">

            <div className="answer-header">

              <span className="step-number">
                03
              </span>

              <h2>
                Answer
              </h2>

            </div>


            <div className="answer-content">

              <p>
                {answer}
              </p>

            </div>


            {/* =========================================== */}
            {/* SOURCES */}
            {/* =========================================== */}

            {sources.length > 0 && (

              <div className="sources">

                <h3>
                  Sources
                </h3>


                <div className="source-list">

                  {sources.map(
                    (
                      source,
                      index,
                    ) => (

                      <article

                        key={

                          source.url ??
                          index

                        }

                        className="source-card"

                      >

                        <span className="source-number">

                          {index + 1}

                        </span>


                        <div>

                          {source.title && (

                            <h4>

                              {source.title}

                            </h4>

                          )}


                          {source.url && (

                            <a

                              href={
                                source.url
                              }

                              target="_blank"

                              rel="noopener noreferrer"

                            >

                              {source.url}

                            </a>

                          )}


                          {source.content && (

                            <p>

                              {source.content}

                            </p>

                          )}

                        </div>

                      </article>

                    ),

                  )}

                </div>

              </div>

            )}

          </section>

        )}

      </div>

    </main>

  );

}