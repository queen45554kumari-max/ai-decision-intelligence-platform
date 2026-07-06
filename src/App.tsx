import { useState, useEffect } from "react";
import { UserSession, Decision, Alert } from "./types";
import { fetchDecisions, fetchAlerts, triggerDecisionAction } from "./api";
import { 
  Radio, Cpu, LayoutDashboard, Map, Brain, FileText, Database, Bell, Shield, LogOut, Code, Clock, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Components
import AuthScreen from "./components/AuthScreen";
import MetricsRow from "./components/MetricsRow";
import DecisionQueue from "./components/DecisionQueue";
import InteractiveMap from "./components/InteractiveMap";
import AICopilot from "./components/AICopilot";
import ReportsCenter from "./components/ReportsCenter";
import BigQueryConsole from "./components/BigQueryConsole";
import AlertsFeed from "./components/AlertsFeed";
import BlueprintsView from "./components/BlueprintsView";
import DecisionIntelligence from "./components/DecisionIntelligence";

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>("decision-intelligence");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anchoredCase, setAnchoredCase] = useState<Decision | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Ingest data from Express backend
  const loadData = async () => {
    try {
      const [decList, alertList] = await Promise.all([
        fetchDecisions(),
        fetchAlerts()
      ]);
      setDecisions(decList);
      setAlerts(alertList);

      // Keep anchored case updated with fresh metrics if matched
      if (anchoredCase) {
        const fresh = decList.find(d => d.id === anchoredCase.id);
        if (fresh) setAnchoredCase(fresh);
      }
    } catch (err) {
      console.error("Data synchronization error:", err);
    }
  };

  useEffect(() => {
    if (session) {
      loadData();
      // Poll operational data every 8 seconds for real-time simulation feel
      const interval = setInterval(loadData, 8000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Real-time clock ticks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle operation approvals or interventions
  const handleDecisionAction = async (id: string, action: "APPROVE" | "REJECT" | "RESOLVE") => {
    if (!session) return;
    try {
      await triggerDecisionAction(id, action, session.name);
      await loadData();
    } catch (err: any) {
      alert(`Policy override failed: ${err.message || err}`);
    }
  };

  // Switch to co-pilot with anchored context preselected
  const handleAnchorToCopilot = (decision: Decision) => {
    setAnchoredCase(decision);
    setActiveTab("copilot");
  };

  // Switch to reports with case preselected
  const handleAnchorToReports = (decision: Decision) => {
    // Navigate straight to reports
    setActiveTab("reports");
  };

  const handleLogout = () => {
    setSession(null);
    setAnchoredCase(null);
    setActiveTab("dashboard");
  };

  // Filter unacknowledged critical warnings for top marquee banner
  const criticalWarnings = alerts.filter(a => a.type === "CRITICAL" && !a.acknowledged);

  if (!session) {
    return <AuthScreen onLogin={setSession} />;
  }

  const tabs = [
    { id: "decision-intelligence", label: "Decision Intelligence", icon: Sparkles },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "map", label: "Operational Map", icon: Map },
    { id: "copilot", label: "AI Co-Pilot", icon: Brain },
    { id: "reports", label: "Intelligence Reports", icon: FileText },
    { id: "bigquery", label: "BigQuery Console", icon: Database },
    { id: "alerts", label: "Alerts Monitor", icon: Bell },
    { id: "blueprints", label: "Architecture Blueprints", icon: Code }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased select-none">
      {/* Background Visual Design Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Real-time Scrolling Incident Marquee Header */}
      {criticalWarnings.length > 0 && (
        <div className="bg-rose-950/95 border-b border-rose-500/30 text-[10px] font-mono py-1.5 px-4 flex items-center justify-between shrink-0 relative overflow-hidden z-30">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            CRITICAL SYSTEMIC INCIDENTS ACTIVE //
          </div>
          <div className="flex-1 overflow-hidden relative mx-4">
            <div className="animate-[marquee_25s_linear_infinite] whitespace-nowrap text-rose-300">
              {criticalWarnings.map((w, idx) => (
                <span key={w.id} className="mr-12 inline-flex items-center gap-1.5">
                  <span className="font-bold">[{w.id}]</span> {w.title.toUpperCase()} — INGESTED {new Date(w.timestamp).toLocaleTimeString()} //
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab("alerts")}
            className="text-[9px] font-bold text-rose-400 hover:text-rose-200 underline shrink-0 font-mono"
          >
            RESOLVE CONSOLE
          </button>
        </div>
      )}

      {/* Main Command Room Header */}
      <header className="bg-slate-900/40 border-b border-slate-900/80 p-4 px-6 backdrop-blur-md sticky top-0 z-20 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider font-sans text-white">AI-DECISION-PLATFORM</h1>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full font-bold">
                ENTERPRISE CONTROL
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide mt-0.5">
              ROUTING CHANNELS: ACTIVE // PLATFORM SECURITY: ENFORCED
            </p>
          </div>
        </div>

        {/* User Identity, Date & Time */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Synchronized Live Clock */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/60 p-1.5 px-3 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>UTC {currentTime.toISOString().substring(11, 19)}</span>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <div className="text-right group relative">
              <span className="text-xs text-white block capitalize font-semibold cursor-help border-b border-dashed border-slate-700 pb-0.5">{session.name}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold mt-0.5 inline-block ${
                session.role === "OPERATIONS_LEAD" ? "bg-emerald-500/10 text-emerald-400" :
                session.role === "DATA_ANALYST" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"
              }`}>
                {session.role}
              </span>
              
              {/* Operator Credentials Hover Card */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-left font-mono text-[10px] space-y-1.5">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-800 pb-1 mb-1">
                  Active Operator Specs
                </div>
                <div><span className="text-slate-500">STATION ID:</span> <span className="text-blue-400 font-bold">{session.id}</span></div>
                <div><span className="text-slate-500">FULL NAME:</span> <span className="text-slate-200">{session.name}</span></div>
                <div><span className="text-slate-500">EMAIL:</span> <span className="text-slate-200">{session.email}</span></div>
                <div><span className="text-slate-500">SECURITY:</span> <span className="text-slate-400">•••••••• (ENCRYPTED)</span></div>
                <div><span className="text-slate-500">CLEARANCE:</span> <span className="text-emerald-400 font-bold">{session.role}</span></div>
              </div>
            </div>
            <div className="p-2 bg-slate-800 border border-slate-750 rounded-xl">
              <Shield className="w-4 h-4 text-slate-400" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
              title="Terminate Secure Session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tab Bar */}
      <nav className="bg-slate-950/80 border-b border-slate-900/60 px-6 p-2 flex gap-1.5 overflow-x-auto shrink-0 z-10 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs transition-all font-sans whitespace-nowrap border ${
                isActive
                  ? "bg-slate-900 border-slate-800 text-white font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/20"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Command Room Workspace Grid */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Contextual Metrics Row visible on operational views */}
            {activeTab !== "blueprints" && activeTab !== "bigquery" && (
              <MetricsRow 
                decisions={decisions} 
                alerts={alerts} 
                onTabChange={setActiveTab} 
              />
            )}

            {/* Injected Active Component Stages */}
            {activeTab === "decision-intelligence" && (
              <DecisionIntelligence onRefreshAllData={loadData} />
            )}

            {activeTab === "dashboard" && (
              <DecisionQueue
                decisions={decisions}
                userRole={session.role}
                onAction={handleDecisionAction}
                onTriggerCopilot={handleAnchorToCopilot}
                onGenerateReport={handleAnchorToReports}
              />
            )}

            {activeTab === "map" && (
              <InteractiveMap
                decisions={decisions}
                alerts={alerts}
                onTriggerDecision={handleAnchorToCopilot}
              />
            )}

            {activeTab === "copilot" && (
              <AICopilot
                decisions={decisions}
                anchoredCase={anchoredCase}
                onSelectAnchor={setAnchoredCase}
              />
            )}

            {activeTab === "reports" && (
              <ReportsCenter
                decisions={decisions}
                alerts={alerts}
              />
            )}

            {activeTab === "bigquery" && (
              <BigQueryConsole />
            )}

            {activeTab === "alerts" && (
              <AlertsFeed
                alerts={alerts}
                onRefreshAlerts={loadData}
              />
            )}

            {activeTab === "blueprints" && (
              <BlueprintsView />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic Keyframe style definitions for animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
