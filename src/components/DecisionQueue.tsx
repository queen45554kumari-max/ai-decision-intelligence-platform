import React, { useState } from "react";
import { Decision, UserRole } from "../types";
import { Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, User, HelpCircle, FileText, Sparkles, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DecisionQueueProps {
  decisions: Decision[];
  userRole: UserRole;
  onAction: (id: string, action: "APPROVE" | "REJECT" | "RESOLVE") => void;
  onTriggerCopilot: (decision: Decision) => void;
  onGenerateReport: (decision: Decision) => void;
}

export default function DecisionQueue({
  decisions,
  userRole,
  onAction,
  onTriggerCopilot,
  onGenerateReport
}: DecisionQueueProps) {
  const [selectedCase, setSelectedCase] = useState<Decision | null>(null);

  const getUrgencyColor = (urgency: Decision["urgency"]) => {
    switch (urgency) {
      case "CRITICAL": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "HIGH": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "MEDIUM": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusIcon = (status: Decision["status"]) => {
    switch (status) {
      case "APPROVED": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-rose-400" />;
      case "RESOLVED": return <CheckCircle2 className="w-4 h-4 text-sky-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
    }
  };

  const getStatusStyle = (status: Decision["status"]) => {
    switch (status) {
      case "APPROVED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "REJECTED": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "RESOLVED": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      default: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  // Safe checks for permissions
  const canAuthorize = userRole === "OPERATIONS_LEAD";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Decisions List View */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight">Active Operation Pipeline</h2>
            <p className="text-xs text-slate-400">Select an operational decision case to inspect telemetry logs, run risk simulations, and authorize intervention protocols.</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 font-mono px-2 py-1 rounded border border-slate-700">
            {decisions.length} CASES
          </span>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1.5">
          {decisions.map((decision) => (
            <motion.div
              layoutId={`case-card-${decision.id}`}
              key={decision.id}
              onClick={() => setSelectedCase(decision)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                selectedCase?.id === decision.id
                  ? "border-blue-500/40 bg-blue-500/5 shadow-blue-500/5 shadow-lg"
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{decision.id}</span>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getUrgencyColor(decision.urgency)}`}>
                    {decision.urgency}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-800 rounded">
                    {decision.domain}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded border ${getStatusStyle(decision.status)}`}>
                  {getStatusIcon(decision.status)}
                  {decision.status}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-white mt-2.5 tracking-tight group-hover:text-blue-400">
                {decision.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {decision.description}
              </p>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Assigned: {decision.assignedTo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{decision.locationName}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decision Inspector Panel */}
      <div className="lg:col-span-1">
        <AnimatePresence mode="wait">
          {selectedCase ? (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">CASE FILE // {selectedCase.id}</span>
                  <h3 className="text-base font-bold text-white tracking-tight mt-1">{selectedCase.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-slate-500 hover:text-slate-300 font-mono text-xs p-1"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Status and Risk Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-500">Risk Assessment</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-lg font-bold ${
                      selectedCase.riskFactor > 50 ? "text-rose-400" :
                      selectedCase.riskFactor > 30 ? "text-amber-400" : "text-emerald-400"
                    }`}>{selectedCase.riskFactor}%</span>
                    <span className="text-[10px] text-slate-400 font-mono">Factor</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] font-mono text-slate-500">Status</div>
                  <div className={`inline-flex items-center gap-1 mt-2 text-xs font-mono font-semibold`}>
                    <div className={`w-2 h-2 rounded-full ${
                      selectedCase.status === "APPROVED" ? "bg-emerald-400" :
                      selectedCase.status === "REJECTED" ? "bg-rose-400" :
                      selectedCase.status === "RESOLVED" ? "bg-sky-400" : "bg-amber-400 animate-pulse"
                    }`} />
                    <span className="text-white text-xs">{selectedCase.status}</span>
                  </div>
                </div>
              </div>

              {/* In-depth Impact Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Scenario Context</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                  {selectedCase.description}
                </p>
                <div className="text-xs text-slate-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-lg">
                  <strong className="text-rose-400">Impact Liability:</strong> {selectedCase.potentialImpact}
                </div>
              </div>

              {/* Active Sensor Metrics */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Ingestion Metrics</h4>
                <div className="space-y-2">
                  {selectedCase.metrics.map((metric) => (
                    <div key={metric.name} className="bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{metric.name}</span>
                        <span className="font-mono text-white font-semibold">
                          {metric.value} {metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((metric.value / (metric.value > 100 ? metric.value * 1.5 : 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive AI Tools */}
              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Co-Pilot Core</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onTriggerCopilot(selectedCase)}
                    className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-blue-400 py-2.5 px-3 rounded-xl transition-colors duration-150"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Anchor Copilot
                  </button>
                  <button
                    onClick={() => onGenerateReport(selectedCase)}
                    className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-indigo-400 py-2.5 px-3 rounded-xl transition-colors duration-150"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Draft Executive Brief
                  </button>
                </div>
              </div>

              {/* Authorized Action Console */}
              <div className="space-y-2 pt-4 border-t border-slate-800/60">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authorization Panel</h4>
                  {!canAuthorize && (
                    <span className="text-[9px] font-mono text-rose-400 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">
                      READ ONLY FOR ROLE
                    </span>
                  )}
                </div>

                {selectedCase.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      disabled={!canAuthorize}
                      onClick={() => {
                        onAction(selectedCase.id, "REJECT");
                        setSelectedCase({ ...selectedCase, status: "REJECTED" });
                      }}
                      className="flex-1 border border-rose-500/30 hover:border-rose-500/60 text-rose-400 hover:bg-rose-500/5 font-medium py-2 px-3 rounded-xl transition-all duration-150 text-xs disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      Deny Request
                    </button>
                    <button
                      disabled={!canAuthorize}
                      onClick={() => {
                        onAction(selectedCase.id, "APPROVE");
                        setSelectedCase({ ...selectedCase, status: "APPROVED" });
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-3 rounded-xl transition-all duration-150 text-xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve Action
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
                    <span className="text-xs text-slate-400 block mb-2">Intervention was successfully authorized</span>
                    {selectedCase.status !== "RESOLVED" && canAuthorize && (
                      <button
                        onClick={() => {
                          onAction(selectedCase.id, "RESOLVE");
                          setSelectedCase({ ...selectedCase, status: "RESOLVED" });
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-3 rounded-lg transition-colors duration-150 text-xs flex items-center justify-center gap-1"
                      >
                        Resolve Scenario
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Event Logs / History */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800/60">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Telemetry Lifecycle Logs</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {selectedCase.history.map((hist, i) => (
                    <div key={i} className="flex gap-2.5 text-xs">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-600 mt-1" />
                        {i < selectedCase.history.length - 1 && <div className="w-0.5 bg-slate-800 flex-1 my-0.5" />}
                      </div>
                      <div className="flex-1 bg-slate-950/20 p-2 rounded-lg border border-slate-800/40 text-[11px]">
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-0.5">
                          <span>{hist.actor} // {hist.action}</span>
                          <span>{new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300">{hist.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl p-8 text-center h-[520px] flex flex-col justify-center items-center">
              <HelpCircle className="w-10 h-10 text-slate-700 animate-pulse" />
              <h3 className="text-sm font-semibold text-slate-400 mt-4">No Case File Selected</h3>
              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Select an active case item from the operations grid pipeline to initiate analytical tracking, risk modeling, and trigger approval protocols.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
