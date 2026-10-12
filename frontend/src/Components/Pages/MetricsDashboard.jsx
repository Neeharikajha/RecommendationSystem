import React, { useEffect, useState } from "react";
import { getMetrics } from "../../Requests/backendApi";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "http://127.0.0.1:8000";

const MetricsDashboard = ({ onClose }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const data = await getMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err.message || "Failed to load offline evaluation metrics.");
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const renderTable = (rows, label) => {
    if (!rows || Object.keys(rows).length === 0) return null;
    const cols = Object.keys(Object.values(rows)[0]);

    return (
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60 my-3">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-neutral-900/80 text-[11px] uppercase tracking-wider text-gray-400 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-2.5 font-bold text-white">{label}</th>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2.5 font-semibold text-right">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900">
            {Object.entries(rows).map(([rowName, rowVals]) => (
              <tr key={rowName} className="hover:bg-neutral-900/40 transition">
                <td className="px-4 py-2 font-semibold text-white whitespace-nowrap">
                  {rowName}
                </td>
                {cols.map((c) => {
                  const val = rowVals[c];
                  const formatted =
                    typeof val === "number"
                      ? val >= 10
                        ? val.toFixed(1)
                        : val.toFixed(4)
                      : val;
                  return (
                    <td key={c} className="px-3 py-2 text-right font-mono text-gray-300">
                      {formatted}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#141414] border border-neutral-800 p-6 md:p-8 text-white shadow-2xl my-8 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="text-xl md:text-2xl font-extrabold text-white">
                Offline Evaluation & Analytics Dashboard
              </h2>
            </div>
            {metrics && (
              <p className="text-xs text-gray-400 mt-1">
                Temporal per-user holdout · {metrics.users_evaluated} users evaluated · K={metrics.k}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-gray-300 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <span className="animate-spin inline-block mr-2">⏳</span> Loading benchmark report...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 bg-red-950/20 rounded-xl my-4 border border-red-900/30">
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Tuned Hyperparameters Badge Strip */}
            {metrics.config && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400 font-semibold">Tuned Hyperparameters:</span>
                <span className="rounded bg-neutral-800 px-2.5 py-1 text-gray-200">
                  SVD Components: <strong className="text-emerald-400">{metrics.config.svd_components}</strong>
                </span>
                <span className="rounded bg-neutral-800 px-2.5 py-1 text-gray-200">
                  MMR λ: <strong className="text-emerald-400">{metrics.config.mmr_lambda}</strong>
                </span>
                <span className="rounded bg-neutral-800 px-2.5 py-1 text-gray-200">
                  Base Blend: <strong className="text-purple-400">Collab {metrics.config.blend.collaborative * 100}%</strong> / <strong className="text-blue-400">Content {metrics.config.blend.content * 100}%</strong> / <strong className="text-amber-400">Pop {metrics.config.blend.popularity * 100}%</strong>
                </span>
              </div>
            )}

            {/* Overall Comparison */}
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>🏆</span> Overall Benchmark Comparison
              </h3>
              {renderTable(metrics.results, "Model")}
            </div>

            {/* NDCG by user activity segments */}
            {metrics.segments && (
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>👥</span> NDCG by User Activity Segment (Cold vs Warm vs Heavy)
                </h3>
                {renderTable(
                  Object.fromEntries(
                    Object.entries(metrics.segments).map(([model, bySegment]) => [
                      model,
                      Object.fromEntries(
                        Object.entries(bySegment).map(([segment, m]) => [
                          `${segment} (${m.users} users)`,
                          m.ndcg,
                        ])
                      ),
                    ])
                  ),
                  "Model"
                )}
              </div>
            )}

            {/* Accuracy vs Diversity (MMR Tradeoff) */}
            {metrics.mmr_tradeoff && (
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>⚖️</span> Accuracy vs Diversity Tradeoff (MMR λ Sweeps)
                </h3>
                {renderTable(metrics.mmr_tradeoff, "MMR λ")}
              </div>
            )}

            {/* Generated Visual Artifact Plots */}
            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>📈</span> Report Visualizations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 p-2">
                  <p className="text-xs text-gray-400 font-semibold mb-2 px-1">
                    NDCG Performance by User Activity
                  </p>
                  <img
                    src={`${BACKEND_URL}/reports/segments_ndcg.png`}
                    alt="NDCG by user activity"
                    className="w-full rounded bg-black object-contain max-h-64"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950 p-2">
                  <p className="text-xs text-gray-400 font-semibold mb-2 px-1">
                    MMR Accuracy vs Diversity Tradeoff
                  </p>
                  <img
                    src={`${BACKEND_URL}/reports/mmr_tradeoff.png`}
                    alt="Accuracy vs diversity"
                    className="w-full rounded bg-black object-contain max-h-64"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;
