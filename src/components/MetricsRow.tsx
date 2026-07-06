import { AlertTriangle, TrendingDown, Server, ClipboardList } from "lucide-react";
import { Decision, Alert } from "../types";
import { motion } from "motion/react";

interface MetricsRowProps {
  decisions: Decision[];
  alerts: Alert[];
  onTabChange: (tab: string) => void;
}

export default function MetricsRow({ decisions, alerts, onTabChange }: MetricsRowProps) {
  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const criticalAlertsCount = alerts.filter(a => a.type === "CRITICAL" && !a.acknowledged).length;
  
  const pendingDecisionsCount = decisions.filter(d => d.status === "PENDING").length;
  
  // Calculate potential financial cost impact from pending decisions
  const totalCostEstimate = decisions
    .filter(d => d.status === "PENDING")
    .reduce((acc, curr) => {
      // Parse numbers from strings like "$140,000 delay cost penalty..."
      const match = curr.potentialImpact.match(/\$?([0-9,]+)/);
      if (match) {
        const val = parseInt(match[1].replace(/,/g, ""), 10);
        return acc + val;
      }
      return acc + 15000; // default estimated buffer
    }, 0);

  // Frankfurt metric calculation (or mock draw)
  const frankfurtMetric = decisions.find(d => d.id === "DEC-102");
  const frankfurtPower = frankfurtMetric ? frankfurtMetric.metrics.find(m => m.name.includes("Power"))?.value || 4.8 : 4.8;

  const cards = [
    {
      title: "Active Urgent Alerts",
      value: activeAlertsCount,
      subtext: `${criticalAlertsCount} critical unresolved`,
      icon: AlertTriangle,
      color: activeAlertsCount > 0 ? "text-rose-400 border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40" : "text-slate-400 border-slate-800 bg-slate-900/40",
      action: () => onTabChange("alerts"),
      label: "LIVE TICKER FEED"
    },
    {
      title: "Logistics Threat Impact",
      value: `$${totalCostEstimate.toLocaleString()}`,
      subtext: "Accumulated pending risk",
      icon: TrendingDown,
      color: totalCostEstimate > 100000 ? "text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40" : "text-slate-400 border-slate-800 bg-slate-900/40",
      action: () => onTabChange("dashboard"),
      label: "ESTIMATED LOSS LIABILITY"
    },
    {
      title: "Core Infrastructure Draw",
      value: `${frankfurtPower} MW`,
      subtext: "Frankfurt cluster demand",
      icon: Server,
      color: frankfurtPower > 4.5 ? "text-sky-400 border-sky-500/20 bg-sky-500/5 hover:border-sky-500/40" : "text-slate-400 border-slate-800 bg-slate-900/40",
      action: () => onTabChange("blueprints"),
      label: "GRID SENSOR HUB"
    },
    {
      title: "Intervention Pipeline",
      value: pendingDecisionsCount,
      subtext: `${decisions.filter(d => d.status === "RESOLVED").length} automated approvals`,
      icon: ClipboardList,
      color: pendingDecisionsCount > 0 ? "text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40" : "text-slate-400 border-slate-800 bg-slate-900/40",
      action: () => onTabChange("dashboard"),
      label: "PENDING AI REVIEWS"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {cards.map((card, idx) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.08 }}
          onClick={card.action}
          className={`p-5 rounded-2xl border backdrop-blur-sm cursor-pointer flex flex-col justify-between transition-all duration-300 shadow-md ${card.color}`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-wider opacity-60 uppercase">{card.label}</span>
              <h3 className="text-sm font-medium text-slate-300 font-sans">{card.title}</h3>
            </div>
            <div className="p-2 bg-slate-950/40 rounded-lg">
              <card.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold tracking-tight font-sans text-white">{card.value}</div>
            <p className="text-xs text-slate-400 mt-1 font-sans">{card.subtext}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
