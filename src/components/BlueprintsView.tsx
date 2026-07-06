import { useState, useEffect } from "react";
import { fetchSystemDocs } from "../api";
import { SystemDocs } from "../types";
import { ShieldCheck, Database, Cpu, BookOpen, FileCode, CheckCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function BlueprintsView() {
  const [docs, setDocs] = useState<SystemDocs | null>(null);
  const [activeBlueprint, setActiveBlueprint] = useState<"SPRINGBOOT" | "BIGQUERY" | "FIREBASE">("SPRINGBOOT");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadDocs = async () => {
      setIsLoading(true);
      try {
        const d = await fetchSystemDocs();
        setDocs(d);
      } catch (err) {
        console.error("Failed to fetch backend specs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDocs();
  }, []);

  const blueprints = [
    {
      id: "SPRINGBOOT" as const,
      title: "Spring Boot Microservices",
      desc: "Robust REST Controllers driving the enterprise core, integrating Google Cloud SDKs and Spring Security frameworks.",
      icon: Cpu,
      lang: "java",
      filename: "DecisionController.java",
      badge: "SPRING BOOT v3.2.1"
    },
    {
      id: "BIGQUERY" as const,
      title: "BigQuery Logs Warehouse",
      desc: "Daily telemetry aggregation schedules consolidating millions of latency and resource indicators for performance audits.",
      icon: Database,
      lang: "sql",
      filename: "daily_ingestion_summary.sql",
      badge: "GOOGLE BIGQUERY"
    },
    {
      id: "FIREBASE" as const,
      title: "Firebase Firestore Rules",
      desc: "Declarative server-side security policies safeguarding decision documents and restricting write states to Operations Roles.",
      icon: ShieldCheck,
      lang: "javascript",
      filename: "firestore.rules",
      badge: "FIRESTORE SECURITIES"
    }
  ];

  const getCodeString = () => {
    if (!docs) return "// Loading blueprints from integrated server API...";
    switch (activeBlueprint) {
      case "SPRINGBOOT": return docs.springboot.trim();
      case "BIGQUERY": return docs.bigquery.trim();
      case "FIREBASE": return docs.firebase.trim();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Blueprint selector (4 cols) */}
      <div className="lg:col-span-4 space-y-3.5">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-white tracking-tight">Backend Blueprints</h2>
          <p className="text-xs text-slate-400">Review enterprise architecture models coordinating the core Spring Boot pipelines, SQL schemas, and database rules.</p>
        </div>

        <div className="space-y-2.5">
          {blueprints.map((bp) => (
            <button
              key={bp.id}
              onClick={() => setActiveBlueprint(bp.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 block ${
                activeBlueprint === bp.id
                  ? "border-blue-500/30 bg-blue-500/5 shadow-blue-500/5 shadow-md"
                  : "border-slate-850 hover:border-slate-800 bg-slate-900/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <bp.icon className={`w-4 h-4 ${activeBlueprint === bp.id ? "text-blue-400" : "text-slate-500"}`} />
                  <span className="font-semibold text-xs text-slate-200 font-sans">{bp.title}</span>
                </div>
                <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 bg-slate-950/60 text-slate-400 rounded">
                  {bp.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{bp.desc}</p>
            </button>
          ))}
        </div>

        {/* Integration verification block */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            VIRTUAL CONTAINER COMPLIANT
          </span>
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            This workspace replicates corporate Cloud Spring Boot dependencies on Node Express API channels (Port 3000) for local simulation fidelity.
          </p>
        </div>
      </div>

      {/* Code Viewer Panel (8 cols) */}
      <div className="lg:col-span-8 flex flex-col bg-slate-950 border border-slate-800 rounded-xl h-[480px] overflow-hidden">
        <div className="bg-slate-900 p-3 px-4 border-b border-slate-800/80 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-mono text-white tracking-wider uppercase">
              {blueprints.find(b => b.id === activeBlueprint)?.filename}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">SYSTEM SPECIFICATION V4.1</span>
        </div>

        {/* Scrollable code block */}
        <div className="flex-1 overflow-auto p-5 bg-slate-950 text-slate-300 font-mono text-xs leading-relaxed">
          {isLoading ? (
            <div className="h-full flex flex-col justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="text-xs text-slate-500 mt-4">Loading specification specs from API...</span>
            </div>
          ) : (
            <pre className="text-[11px] font-mono whitespace-pre text-slate-200">
              <code>{getCodeString()}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
