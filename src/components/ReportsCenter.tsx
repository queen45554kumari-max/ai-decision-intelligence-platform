import { useState } from "react";
import { Decision, Alert, ReportItem } from "../types";
import { FileText, Sparkles, Copy, Check, Download, ClipboardCheck, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { generateGeminiReport } from "../api";
import { motion, AnimatePresence } from "motion/react";

interface ReportsCenterProps {
  decisions: Decision[];
  alerts: Alert[];
}


export default function ReportsCenter({ decisions, alerts }: ReportsCenterProps) {
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: "REP-901",
      title: "Quarterly Silicon Logistics Ingestion Vulnerabilities",
      type: "METRIC_AUDIT",
      date: new Date(Date.now() - 172800000).toISOString(),
      content: `# Operational Briefing: East Asia Silicon Logistics Shortfall

## 1. Executive Summary
An analysis of logistics and feedstock levels indicates a Yellow Alert in silicon substrate buffers at the **Taipei Silicon Depot**. Local raw chemical reactor delays have triggered buffer drops to **8.5 days**.

## 2. Root Cause Analysis
- **Supply Ingestion Backlog:** Core reactant shipping delays.
- **Logistics Latency:** Secondary packaging operations holding 14% higher volume due to local labor deficits.

## 3. Recommended Interventions
- **Air Freight Escalation:** Expedite alternative reactants via Tacoma carrier.
- **Buffer Balancing:** Divert 4,000 silicon wafers from Northern logistics channels.

---
*Report Compiled Automatically via Gemini AI Platform.*`,
      generatedBy: "Gemini-3.5-Flash (Platform Co-Pilot)",
      summary: "An analysis of logistics and feedstock levels indicates a Yellow Alert in silicon substrate buffers at the Taipei Silicon Depot due to raw chemical reactant delays.",
      recommendations: [
        "Air Freight Escalation: Expedite alternative reactants via Tacoma carrier.",
        "Buffer Balancing: Divert 4,000 silicon wafers from Northern logistics channels."
      ],
      pdf: "/reports/REP-901_compiled_document.pdf"
    }
  ]);

  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(reports[0]);
  const [selectedDecisionId, setSelectedDecisionId] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCompileReport = async () => {
    if (!selectedDecisionId && !selectedAlertId) return;
    setIsCompiling(true);

    try {
      let title = "Executive Operations Brief";
      let type: ReportItem["type"] = "METRIC_AUDIT";
      let targetName = "";

      if (selectedDecisionId) {
        const dec = decisions.find(d => d.id === selectedDecisionId);
        title = `Executive Briefing: ${dec?.title || "Intervention Report"}`;
        type = "DECISION_BRIEF";
        targetName = dec?.title || "";
      } else if (selectedAlertId) {
        const alt = alerts.find(a => a.id === selectedAlertId);
        title = `Incident Runbook: ${alt?.title || "Alert Diagnostics"}`;
        type = "INCIDENT_RUNBOOK";
        targetName = alt?.title || "";
      }

      const markdown = await generateGeminiReport({
        decisionId: selectedDecisionId || undefined,
        alertId: selectedAlertId || undefined
      });

      // Parse the output markdown to extract executive summary and recommendations
      let parsedSummary = "";
      let parsedRecs: string[] = [];
      const lines = markdown.split("\n");
      
      let inSummary = false;
      let inRecs = false;
      
      for (const line of lines) {
        const t = line.trim();
        if (!t) continue;
        
        // detect sections
        if (t.startsWith("#") || t.startsWith("##")) {
          const lower = t.toLowerCase();
          if (lower.includes("summary") || lower.includes("overview")) {
            inSummary = true;
            inRecs = false;
          } else if (lower.includes("recommend") || lower.includes("mitigation") || lower.includes("runbook") || lower.includes("intervention")) {
            inSummary = false;
            inRecs = true;
          } else {
            inSummary = false;
            inRecs = false;
          }
          continue;
        }
        
        if (inSummary) {
          if (!t.startsWith("-") && !t.startsWith("*")) {
            parsedSummary += (parsedSummary ? " " : "") + t;
          }
        }
        
        if (inRecs) {
          if (t.startsWith("- ") || t.startsWith("* ")) {
            parsedRecs.push(t.substring(2).trim());
          } else if (t.match(/^\d+\.\s/)) {
            parsedRecs.push(t.replace(/^\d+\.\s/, "").trim());
          }
        }
      }

      // fallback defaults
      if (!parsedSummary) {
        parsedSummary = `Operations and telemetry audit report generated for ${targetName || "operational entity"} to resolve active alerts and route pathways.`;
      }
      if (parsedRecs.length === 0) {
        parsedRecs = [
          "Divert high-load micro-service lanes via redundant routing grids.",
          "Coordinate with local chemical logistics reactors to expedite raw reactants."
        ];
      }

      const reportId = `REP-90${reports.length + 1}`;

      const newReport: ReportItem = {
        id: reportId,
        title,
        type,
        date: new Date().toISOString(),
        content: markdown,
        generatedBy: "Gemini-3.5-Flash (Platform Co-Pilot)",
        summary: parsedSummary.slice(0, 240) + (parsedSummary.length > 240 ? "..." : ""),
        recommendations: parsedRecs,
        pdf: `/reports/${reportId}_compiled_document.pdf`
      };

      setReports(prev => [newReport, ...prev]);
      setSelectedReport(newReport);
    } catch (err: any) {
      alert(`Report compilation error: ${err.message || err}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const copyToClipboard = () => {
    if (!selectedReport) return;
    navigator.clipboard.writeText(selectedReport.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdfDocument = (rep: ReportItem) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${rep.id} - ${rep.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 30px;
      background-color: #ffffff;
    }
    .header-bar {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 26px;
      color: #0f172a;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .doc-subtitle {
      font-size: 14px;
      color: #64748b;
      font-family: monospace;
      margin: 0;
    }
    h2 {
      font-size: 18px;
      color: #2563eb;
      margin-top: 30px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .meta-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .meta-value {
      font-size: 13px;
      color: #0f172a;
    }
    .meta-badge {
      display: inline-block;
      background-color: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11px;
    }
    .recs-list {
      padding-left: 18px;
      margin: 0;
      font-size: 13px;
    }
    .recs-list li {
      margin-bottom: 6px;
      color: #334155;
    }
    .content-body {
      font-size: 14px;
      color: #334155;
    }
    .content-body p {
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 50px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      .no-print { display: none; }
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: right; margin-bottom: 25px;">
    <button onclick="window.print()" style="background-color: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      Print or Save as PDF
    </button>
  </div>
  
  <div class="header-bar">
    <h1>${rep.title}</h1>
    <p class="doc-subtitle">SYSTEM REFERENCE: ${rep.id} // SECURE ARCHIVE RECORD</p>
  </div>
  
  <div class="meta-box">
    <div class="meta-grid">
      <div class="meta-col">
        <div class="meta-item">
          <span class="meta-label">Report ID</span>
          <span class="meta-value" style="font-family: monospace; font-weight: bold;">${rep.id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Generated By</span>
          <span class="meta-value">
            <span class="meta-badge">${rep.generatedBy}</span>
          </span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Compilation Date</span>
          <span class="meta-value">${new Date(rep.date).toLocaleString()}</span>
        </div>
      </div>
      <div class="meta-col">
        <div class="meta-item">
          <span class="meta-label">Executive Summary</span>
          <span class="meta-value" style="font-style: italic; line-height: 1.5; color: #334155;">
            ${rep.summary}
          </span>
        </div>
        <div class="meta-item" style="margin-top: 6px;">
          <span class="meta-label">Key Actions & Recommendations</span>
          <ul class="recs-list">
            ${rep.recommendations.map(r => `<li>${r}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>
  </div>
  
  <div class="content-body">
    ${rep.content.split('\n').map(line => {
      if (line.startsWith('# ')) return `<h2>${line.replace('# ', '')}</h2>`;
      if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
      if (line.startsWith('### ')) return `<h3 style="font-size:15px; color:#1e293b; margin-top:20px;">${line.replace('### ', '')}</h3>`;
      if (line.startsWith('- ')) return `<div style="margin-left: 15px; margin-bottom: 5px;">• ${line.replace('- ', '')}</div>`;
      if (line.trim() === '---') return `<hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;" />`;
      if (line.trim() === '') return '';
      return `<p>${line}</p>`;
    }).join('\n')}
  </div>
  
  <div class="footer">
    Operational briefing compiled securely on behalf of user queen45554kumari@gmail.com. Confidential Document.
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${rep.id}_Executive_Report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Sidebar Report Compilation Panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* Compilation Terminal */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Report Architect
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Leverage Gemini's reasoning layers to synthesize root-cause documents and draft incident response briefings.
            </p>
          </div>

          <div className="space-y-3">
            {/* Compile Decision Report option */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block">SOURCE DECISION RECORD</label>
              <select
                value={selectedDecisionId}
                onChange={(e) => {
                  setSelectedDecisionId(e.target.value);
                  setSelectedAlertId("");
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Decision Case --</option>
                {decisions.map(d => (
                  <option key={d.id} value={d.id}>[{d.id}] {d.title.slice(0, 24)}...</option>
                ))}
              </select>
            </div>

            {/* Compile Alert Report option */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[9px] font-mono text-slate-400 block">SOURCE SYSTEMIC ALERT</label>
                <span className="text-[9px] text-slate-600 font-mono">OR</span>
              </div>
              <select
                value={selectedAlertId}
                onChange={(e) => {
                  setSelectedAlertId(e.target.value);
                  setSelectedDecisionId("");
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Live Alert --</option>
                {alerts.map(a => (
                  <option key={a.id} value={a.id}>[{a.id}] {a.title.slice(0, 24)}...</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCompileReport}
              disabled={(!selectedDecisionId && !selectedAlertId) || isCompiling}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-150 text-xs flex items-center justify-center gap-1.5 mt-2"
            >
              {isCompiling ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  COMPILING REPORT...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Compile Executive Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Historical Archive of Reports */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1.5">
            Briefing Archives
          </h3>
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-colors duration-150 block ${
                  selectedReport?.id === rep.id
                    ? "border-blue-500/30 bg-blue-500/5 text-blue-400 font-semibold"
                    : "border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300"
                }`}
              >
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mb-1">
                  <span>{rep.id} // {rep.type}</span>
                  <span>{new Date(rep.date).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                </div>
                <div className="truncate text-white font-sans text-xs">{rep.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Viewer Panel */}
      <div className="lg:col-span-2">
        {selectedReport ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[650px]">
            {/* Viewer Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4.5 h-4.5 text-blue-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wide">
                  REPORT VIEWPORT // {selectedReport.id}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono px-2.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      COPIED
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      COPY
                    </>
                  )}
                </button>
                <button
                  onClick={() => downloadPdfDocument(selectedReport)}
                  className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-[10px] font-mono px-2.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF EXPORT
                </button>
              </div>
            </div>

            {/* Structured Metadata Panel */}
            <div className="bg-slate-950 border-b border-slate-800/80 p-5 space-y-4 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_0%,rgba(59,130,246,0.02),transparent)] pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    System Registry Metadata
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-mono">REPORT ID</span>
                      <span className="text-sm font-mono font-bold text-white">{selectedReport.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-mono">GENERATED BY</span>
                      <span className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                        {selectedReport.generatedBy}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-mono">PDF EXPORT REF</span>
                      <span className="text-[10px] font-mono text-slate-300 underline cursor-pointer" onClick={() => downloadPdfDocument(selectedReport)}>
                        {selectedReport.id}_compiled.pdf
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase tracking-wider">Executive Summary</span>
                    <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 mt-1">
                      {selectedReport.summary}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    AI-Derived Operational Actions
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 space-y-2 max-h-[115px] overflow-y-auto">
                    {selectedReport.recommendations && selectedReport.recommendations.length > 0 ? (
                      selectedReport.recommendations.map((rec, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs text-slate-300">
                          <span className="text-emerald-500 font-bold font-mono text-[10px] bg-emerald-500/10 rounded px-1 mt-0.5">{i+1}</span>
                          <span className="leading-normal">{rec}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No operational recommendations compiled.</span>
                    )}
                  </div>
                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => downloadPdfDocument(selectedReport)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold py-1 px-3 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      DOWNLOAD PDF BRIEF
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Document body (Beautiful Styled Markdown Renderer) */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-300 space-y-4 font-sans bg-slate-950/20">
              <div className="prose prose-invert max-w-none text-slate-300">
                {selectedReport.content.split("\n").map((line, idx) => {
                  if (line.startsWith("# ")) {
                    return <h1 key={idx} className="text-xl font-bold font-sans text-white border-b border-slate-800 pb-2 mt-4 mb-2 tracking-tight">{line.replace("# ", "")}</h1>;
                  }
                  if (line.startsWith("## ")) {
                    return <h2 key={idx} className="text-base font-bold font-sans text-blue-400 mt-4 mb-1.5 tracking-tight">{line.replace("## ", "")}</h2>;
                  }
                  if (line.startsWith("### ")) {
                    return <h3 key={idx} className="text-sm font-semibold font-sans text-white mt-3 mb-1">{line.replace("### ", "")}</h3>;
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <div key={idx} className="flex gap-2 pl-3 py-0.5">
                        <span className="text-blue-500">•</span>
                        <p className="text-slate-300 leading-relaxed text-xs">{line.replace("- ", "")}</p>
                      </div>
                    );
                  }
                  if (line.startsWith("* ")) {
                    return <p key={idx} className="text-slate-400 italic text-[11px] border-t border-slate-850 pt-2 mt-4">{line.replace("* ", "")}</p>;
                  }
                  if (line.trim() === "---") {
                    return <hr key={idx} className="border-slate-800 my-4" />;
                  }
                  if (line.trim() === "") return <div key={idx} className="h-2" />;
                  return <p key={idx} className="leading-relaxed mb-2.5">{line}</p>;
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/10 border border-dashed border-slate-800 rounded-xl p-8 text-center h-[520px] flex flex-col justify-center items-center">
            <AlertCircle className="w-10 h-10 text-slate-700 animate-bounce" />
            <h3 className="text-sm font-semibold text-slate-400 mt-4">Select or Architect a Report</h3>
            <p className="text-xs text-slate-600 max-w-xs mt-1">
              Choose a decision profile or sensor warning in the sidebar and trigger the Gemini report compiler to assemble an operational brief.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
