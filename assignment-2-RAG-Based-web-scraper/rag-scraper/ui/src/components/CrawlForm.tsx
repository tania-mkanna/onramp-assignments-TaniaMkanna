import React, { useState } from "react";
import { dispatchCrawl } from "../services/api";
import { Play, Loader2 } from "lucide-react";

export const CrawlForm: React.FC = () => {
  const [url, setUrl] = useState("https://books.toscrape.com/");
  const [mode, setMode] = useState<"STATIC" | "DYNAMIC">("STATIC");
  const [maxDepth, setMaxDepth] = useState(2);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await dispatchCrawl({ url, mode, maxDepth });
      setStatus(`Job enqueued successfully! Job ID: ${res.jobId}`);
    } catch {
      setStatus("Failed to dispatch crawl job. Ensure API server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-400">
        <Play className="w-5 h-5" /> Dispatch Web Crawler
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-300">Target Seed URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full p-2.5 rounded-md bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Crawl Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "STATIC" | "DYNAMIC")}
              className="w-full p-2.5 rounded-md bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="STATIC">STATIC (Axios)</option>
              <option value="DYNAMIC">DYNAMIC (Playwright)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Max Depth Limit</label>
            <input
              type="number"
              min={1}
              max={5}
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full p-2.5 rounded-md bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Start Crawler Job"}
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 rounded-md bg-slate-900 border border-indigo-500/30 text-indigo-300 text-sm">
          {status}
        </div>
      )}
    </div>
  );
};