import { useState } from "react";
import { DatasetView } from "./components/DatasetView";
import { BookOpen, Quote, Layers, Database } from "lucide-react";

type PageTab = "books" | "quotes" | "paginated";

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>("books");

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 text-white">
            <Database className="w-8 h-8 text-indigo-500" /> RAG Knowledge Search
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Explore and ask questions grounded in scraped datasets
          </p>
        </div>

        {/* 3 Page Navigation Tabs */}
        <nav className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "books"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Books (Static)
          </button>

          <button
            onClick={() => setActiveTab("quotes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "quotes"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Quote className="w-4 h-4" /> Quotes (Dynamic)
          </button>

          <button
            onClick={() => setActiveTab("paginated")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeTab === "paginated"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" /> Paginated Site
          </button>
        </nav>
      </header>

      {/* Main Page Content Views */}
      <main>
        {activeTab === "books" && (
          <DatasetView
            title="Books Library"
            description="Static HTML catalog derived from Books to Scrape."
            targetUrl="https://books.toscrape.com/"
            crawlMode="STATIC"
            maxDepth={2}
          />
        )}

        {activeTab === "quotes" && (
          <DatasetView
            title="Quotes Database"
            description="JavaScript rendered SPA containing famous quotes and authors."
            targetUrl="https://quotes.toscrape.com/js/"
            crawlMode="DYNAMIC"
            maxDepth={1}
          />
        )}

        {activeTab === "paginated" && (
          <DatasetView
            title="Paginated / Large Scale Site"
            description="Deep crawl site with pagination or large index structure."
            targetUrl="https://news.ycombinator.com/" // Replace with your designated 3rd target site
            crawlMode="STATIC"
            maxDepth={3}
          />
        )}
      </main>
    </div>
  );
}