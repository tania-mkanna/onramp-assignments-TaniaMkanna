import React, { useState } from "react";
import { askRAGQuery } from "../services/api";
import type {RAGResponse} from "../services/api";
import { Search, ExternalLink, Bot, Sparkles, Loader2 } from "lucide-react";

export const RAGPlayground: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<RAGResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await askRAGQuery(question);
      setResponse(res);
    } catch {
      console.error("RAG Query Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-md">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-400">
        <Sparkles className="w-5 h-5" /> Grounded RAG Query
      </h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Ask a question grounded in vector store..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />} Search
        </button>
      </form>

      {response && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
              <Bot className="w-5 h-5" /> LLM Grounded Synthesis
            </div>
            <p className="text-slate-200 leading-relaxed whitespace-pre-line">{response.answer}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Vector Search Sources & Citations</h3>
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
                  <div className="text-xs text-slate-400 mt-1 flex justify-between">
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
  );
};