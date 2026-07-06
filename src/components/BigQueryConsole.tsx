import { useState, useEffect } from "react";
import { BigQueryOutput } from "../types";
import { runBigQuery } from "../api";
import { Play, Database, Terminal, FileSpreadsheet, BarChart2, CheckCircle, Flame, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion, AnimatePresence } from "motion/react";

export default function BigQueryConsole() {
  const templates = [
    {
      name: "Regional Ingestion Metrics",
      sql: `-- Group telemetry counts and cost impact across global hosting centers
SELECT
  region,
  COUNT(id) as event_count,
  AVG(latency_ms) as avg_latency_ms,
  SUM(cost_impact) as total_cost_usd
FROM
  \`enterprise-ai.telemetry.operational_logs\`
GROUP BY
  region
ORDER BY
  total_cost_usd DESC;`
    },
    {
      name: "Service Performance Profile",
      sql: `-- Analyze average latency bottlenecks and cost by microservice clusters
SELECT
  service,
  COUNT(id) as execution_count,
  AVG(latency_ms) as avg_latency_ms,
  SUM(cost_impact) as total_impact_usd
FROM
  \`enterprise-ai.telemetry.operational_logs\`
GROUP BY
  service
ORDER BY
  avg_latency_ms DESC;`
    },
    {
      name: "Event Type Cost Analysis",
      sql: `-- Group total telemetry counts and latency by Event warning categories
SELECT
  event_type,
  COUNT(id) as event_count,
  AVG(latency_ms) as avg_latency_ms
FROM
  \`enterprise-ai.telemetry.operational_logs\`
GROUP BY
  event_type
ORDER BY
  event_count DESC;`
    }
  ];

  const [sql, setSql] = useState(templates[0].sql);
  const [output, setOutput] = useState<BigQueryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"TABLE" | "CHART">("TABLE");

  const executeQuery = async (customSql?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await runBigQuery(customSql || sql);
      setOutput(res);
    } catch (err: any) {
      setError(err.message || "BigQuery parser exception.");
      setOutput(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial query on load
  useEffect(() => {
    executeQuery(templates[0].sql);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Templates & Editor Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4 flex flex-col h-[520px]">
        {/* Templates selector */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shrink-0 space-y-2">
          <label className="text-[10px] font-mono text-slate-500 uppercase block tracking-wider">BigQuery Templates</label>
          <div className="grid grid-cols-1 gap-1.5">
            {templates.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setSql(t.sql);
                  executeQuery(t.sql);
                }}
                className={`text-left p-2 rounded text-xs transition-colors font-mono ${
                  sql.includes(t.sql.substring(0, 30))
                    ? "bg-blue-600/10 border border-blue-500/30 text-blue-400 font-semibold"
                    : "bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden relative">
          <div className="bg-slate-900 p-2.5 px-4 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-mono text-white tracking-wider">SQL QUERY PLAYGROUND</span>
            </div>
            <button
              onClick={() => executeQuery()}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-1 px-3.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-white" />
              RUN SELECT
            </button>
          </div>

          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            disabled={isLoading}
            className="flex-1 w-full p-4 bg-slate-950 text-slate-200 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
            spellCheck="false"
          />

          <div className="absolute bottom-2.5 right-3.5 text-[9px] font-mono text-slate-600 pointer-events-none">
            Ctrl+Enter to Execute
          </div>
        </div>
      </div>

      {/* Results & Visual Analytics Column (7 cols) */}
      <div className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800 rounded-xl h-[520px] overflow-hidden">
        {/* Header Results stats */}
        <div className="bg-slate-900 p-2.5 px-4 border-b border-slate-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-white tracking-wide uppercase">QueryResult Viewport</span>
          </div>

          {output && (
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span>Time: <strong className="text-white">{output.meta.execution_time_ms}ms</strong></span>
              <span>Scanned: <strong className="text-white">{output.meta.rows_scanned} records</strong></span>
              <span>Bytes: <strong className="text-white">{output.meta.bytes_processed}</strong></span>
            </div>
          )}
        </div>

        {/* View Toggle (Table vs Charts) */}
        <div className="bg-slate-900/40 border-b border-slate-800/60 p-2 flex justify-between shrink-0">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab("TABLE")}
              className={`p-1 px-3 rounded text-[10px] font-mono flex items-center gap-1 ${
                activeTab === "TABLE" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-3 h-3" />
              DATAFRAME TABLE
            </button>
            <button
              onClick={() => setActiveTab("CHART")}
              className={`p-1 px-3 rounded text-[10px] font-mono flex items-center gap-1 ${
                activeTab === "CHART" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              VISUAL GRAPH
            </button>
          </div>
          {output?.meta.message && (
            <span className="text-[9px] font-mono text-amber-500 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5" />
              {output.meta.message}
            </span>
          )}
        </div>

        {/* Dynamic Display Area */}
        <div className="flex-1 overflow-auto p-4 relative bg-slate-950/20">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-slate-950/80 z-20">
                <Database className="w-10 h-10 text-blue-500 animate-bounce" />
                <span className="text-xs font-mono text-slate-400 mt-3 animate-pulse">Running BigQuery analytical query...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-mono font-semibold text-rose-400">BIGQUERY PARSE ERROR</h4>
                  <p className="text-[11px] font-mono text-slate-300">{error}</p>
                </div>
              </div>
            ) : output ? (
              activeTab === "TABLE" ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[10px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40">
                        {output.columns.map((col) => (
                          <th key={col} className="p-2 py-2.5 text-slate-400 uppercase tracking-wider font-semibold">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {output.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                          {output.columns.map((col) => (
                            <td key={col} className="p-2 py-2 text-slate-300">
                              {typeof row[col] === "number" && col.includes("cost") ? `$${row[col].toLocaleString()}` : row[col]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {/* Render appropriate chart depending on available columns */}
                      {output.columns.includes("region") ? (
                        <BarChart data={output.rows} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="region" stroke="#64748b" fontSize={10} fontFamily="monospace" />
                          <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                          <Bar dataKey="event_count" name="Event Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avg_latency_ms" name="Avg Latency (ms)" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : output.columns.includes("service") ? (
                        <BarChart data={output.rows} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="service" stroke="#64748b" fontSize={8} fontFamily="monospace" />
                          <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                          <Bar dataKey="execution_count" name="Execution Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avg_latency_ms" name="Latency bottleneck (ms)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <AreaChart data={output.rows} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="event_type" stroke="#64748b" fontSize={9} fontFamily="monospace" />
                          <YAxis stroke="#64748b" fontSize={10} fontFamily="monospace" />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155" }} />
                          <Area type="monotone" dataKey="event_count" name="Count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center mt-2 italic">
                    Visual telemetry charts derived automatically from SQL schema aggregation models.
                  </div>
                </div>
              )
            ) : (
              <div className="text-center p-8 text-slate-600">
                Click Run Query to process BigQuery.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
