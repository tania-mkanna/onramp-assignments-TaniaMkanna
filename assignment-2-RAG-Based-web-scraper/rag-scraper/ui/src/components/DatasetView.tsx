import React, { useState } from "react";
import { dispatchCrawl, askRAGQuery} from "../services/api";
import type {RAGResponse} from "../services/api";
import { Search, ExternalLink, Bot, Sparkles, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";

interface DatasetViewProps {
  title: string;
  description: string;
  targetUrl: string;
  crawlMode: "STATIC" | "DYNAMIC";
  maxDepth?: number;
}

export const DatasetView: React.FC<DatasetViewProps> = ({
  title,
  description,
  targetUrl,
  crawlMode,
  maxDepth = 2,
}) => {
  // Scraper status states
  const [crawling, setCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<string | null>(null);

  // RAG query states
  const [question, setQuestion] = useState("");
  const [searching, setSearching] = useState(false);
  const [response, setResponse] = useState<RAGResponse | null>(null);

  // 1. Trigger background crawl without exposing technical options
  const handleSyncData = async () => {
    setCrawling(true);
    setCrawlStatus(null);
    try {
      await dispatchCrawl({ url: targetUrl, mode: crawlMode, maxDepth });
      setCrawlStatus("Data sync initiated in background! Worker is processing pages.");
    } catch {
      setCrawlStatus("Failed to initiate sync. Check if API server is running.");
    } finally {
      setCrawling(false);
    }
  };

  // 2. Execute RAG Question Answering
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setSearching(true);
    try {
      const res = await askRAGQuery(question);
      setResponse(res);
    } catch {
      console.error("Query failed");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sync Banner */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm mt-1">{description}</p>
        </div>

        <button
          onClick={handleSyncData}
          disabled={crawling}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          {crawling ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          Sync Latest Data
        </button>
      </div>

      {crawlStatus && (
        <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {crawlStatus}
        </div>
      )}

      {/* RAG Search Playground */}
      <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-md space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-5 h-5" /> Ask Anything About {title}
        </h3>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder={`Ask a question about ${title.toLowerCase()}...`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {searching ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
            Ask Question
          </button>
        </form>

        {/* Answer & Citations View */}
        {response && (
          <div className="space-y-4 pt-4 border-t border-slate-700/50">
            <div className="p-4 bg-slate-900/90 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                <Bot className="w-5 h-5" /> Answer
              </div>
              <p className="text-slate-200 leading-relaxed whitespace-pre-line">{response.answer}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Source Citations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.citations.map((c, i) => (
                  <a
                    key={i}
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition block"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm text-indigo-300 truncate">{c.title}</span>
                      <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex justify-between">
                      <span className="truncate">{c.url}</span>
                      <span className="text-emerald-400 font-mono">{(c.similarityScore * 100).toFixed(1)}%</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};