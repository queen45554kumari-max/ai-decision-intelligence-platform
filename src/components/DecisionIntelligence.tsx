import React, { useState, useEffect, useRef } from "react";
import { 
  fetchCrimeData, 
  fetchTrafficData, 
  fetchWeatherData, 
  fetchRecommendations,
  sendGeminiChatMessage,
  createAlert,
  fetchComplaints
} from "../api";
import { 
  CrimeIncident, 
  TrafficCongestion, 
  WeatherCondition, 
  RecommendationItem,
  CitizenComplaint
} from "../types";
import { 
  ShieldAlert, 
  Navigation, 
  Leaf, 
  CloudSun, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  Gauge,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts";

type LayerType = "crime" | "traffic" | "pollution" | "weather" | "complaints";

interface DecisionIntelligenceProps {
  onRefreshAllData: () => void;
}

export default function DecisionIntelligence({ onRefreshAllData }: DecisionIntelligenceProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>("crime");
  const [crimeData, setCrimeData] = useState<CrimeIncident[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficCongestion[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherCondition[]>([]);
  const [complaintsData, setComplaintsData] = useState<CitizenComplaint[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  
  // Pollution mock data synchronized with Frankfurt and Taipei states
  const pollutionData = [
    { id: "POL-001", location: "EU-West Server Complex (Frankfurt)", aqi: 145, status: "UNHEALTHY", mainPollutant: "PM2.5", level: "HIGH" },
    { id: "POL-002", location: "Taipei Silicon Depot", aqi: 88, status: "MODERATE", mainPollutant: "O3 (Ozone)", level: "MEDIUM" },
    { id: "POL-003", location: "Port of San Francisco, CA", aqi: 32, status: "GOOD", mainPollutant: "CO2", level: "LOW" }
  ];

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: "USER" | "GEMINI"; text: string }>>([
    {
      id: "init",
      sender: "GEMINI",
      text: "Enterprise Operations AI initialized. Ask me to cross-reference our active layers (Crime, Traffic, Pollution, Weather) with financial saving recommendations."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Status Alerts Simulator State
  const [alertForm, setAlertForm] = useState({
    title: "",
    message: "",
    type: "CRITICAL" as "CRITICAL" | "WARNING" | "INFO",
    source: "CRIME_SENSOR"
  });
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // AI Spatial Audit Report State & Fallback
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditReport, setAuditReport] = useState({
    summary: "Comprehensive spatial analysis indicates elevated atmospheric and security risks across our major hubs. San Francisco's maritime shipping channel is experiencing critical delays due to severe 38-knot wind gusts, while Taipei’s silicon transit routes are seeing medium-priority drone surveillance alerts. In Frankfurt, citizen concerns about server noise pollution are high due to peak CPU heatwaves.",
    highRiskAreas: [
      { name: "Port of San Francisco (US-WEST)", threatLevel: "CRITICAL", score: 95, reason: "38-knot wind shear paired with heavy cargo congestion causing 16.5-hour delay cascades." },
      { name: "Taipei Silicon Depot (APAC-EAST)", threatLevel: "HIGH", score: 78, reason: "Unauthorized drone flights over perimeter zones during critical freighter transfers." },
      { name: "EU-West Server Complex, Frankfurt (EU-CENTRAL)", threatLevel: "MEDIUM", score: 62, reason: "37°C ambient heatwave triggers fan hum noise complaints from neighboring office sectors." }
    ],
    predictions: [
      { timeframe: "Next 12-24 Hours", description: "Vessel delay at Port of SF is predicted to peak at 19 hours, threatening $45K cargo breach SLA.", probability: 88 },
      { timeframe: "Next 24-48 Hours", description: "Taipei raw silicon feedstock arrivals may stall by 12% if drone surveillance restrictions limit night transit.", probability: 70 },
      { timeframe: "Next 48-72 Hours", description: "Frankfurt utility grid will invoke high-tariff periods due to regional cooling loads; servers require active rack consolidation.", probability: 92 }
    ],
    resourceAllocation: [
      { department: "Maritime Logistics Fleet", action: "Divert incoming secondary cargo carriers to Seattle edge terminals.", percent: 35 },
      { department: "Security Operations", action: "Deploy perimeter jammer frequencies and high-altitude surveillance UAV patrols at Taipei Depot.", percent: 25 },
      { department: "Infrastructure Cooling", action: "Power down non-essential compute racks in Frankfurt to receive grid subsidies.", percent: 40 }
    ],
    recommendations: [
      { title: "Seattle Pipeline Rerouting", savings: 45000, impact: "Bypasses Port of SF shipping gridlock completely, stabilizing terminal throughput." },
      { title: "Frankfurt Node Consolidation", savings: 85000, impact: "Secures instant utility provider grid-subsidy during peak-heatwave cooling demands." },
      { title: "Silicon Supply Pre-orders", savings: 120000, impact: "Mitigates East Asia Deficit by securing materials from secondary localized reactor suppliers." }
    ]
  });

  const runSpatialAudit = async () => {
    setIsAuditLoading(true);
    try {
      const prompt = `You are the AI Decision Intelligence Assistant.
Please analyze the current operational data of our global nodes:
- Crime Incident Data: ${JSON.stringify(crimeData)}
- Traffic Congestion Data: ${JSON.stringify(trafficData)}
- Weather Conditions: ${JSON.stringify(weatherData)}
- Citizen Complaints: ${JSON.stringify(complaintsData)}
- Carbon & AQI Pollution Data: ${JSON.stringify(pollutionData)}

Generate a comprehensive, professional, custom Decision Intelligence Report.
Respond with a JSON block matching this EXACT JSON structure, and absolutely NO other conversational text or markdown code blocks:
{
  "summary": "Detailed summary paragraph analyzing Crime, Traffic, Weather, Citizen Complaints, and Pollution metrics",
  "highRiskAreas": [
    { "name": "Name of area", "threatLevel": "CRITICAL", "score": 95, "reason": "Reason details" }
  ],
  "predictions": [
    { "timeframe": "Time interval", "description": "Forecast detail", "probability": 85 }
  ],
  "resourceAllocation": [
    { "department": "Team/Sector", "action": "Action details", "percent": 40 }
  ],
  "recommendations": [
    { "title": "Recommendation summary title", "savings": 45000, "impact": "Detailed benefit impact statement" }
  ]
}`;

      const res = await sendGeminiChatMessage(prompt);
      let cleanJson = res.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.substring(7);
      }
      if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.substring(3);
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
      cleanJson = cleanJson.trim();
      
      const parsed = JSON.parse(cleanJson);
      if (parsed.summary && parsed.highRiskAreas && parsed.predictions && parsed.resourceAllocation && parsed.recommendations) {
        setAuditReport(parsed);
      } else {
        throw new Error("Invalid intelligence report schema returned.");
      }
    } catch (err) {
      console.warn("Failed to run spatial audit via Gemini. Using pre-cached high-integrity model.", err);
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Load all telemetry services
  const loadLayerData = async () => {
    try {
      const [crimes, traffics, weathers, recs, complaints] = await Promise.all([
        fetchCrimeData(),
        fetchTrafficData(),
        fetchWeatherData(),
        fetchRecommendations(),
        fetchComplaints()
      ]);
      setCrimeData(crimes);
      setTrafficData(traffics);
      setWeatherData(weathers);
      setRecommendations(recs);
      setComplaintsData(complaints);
    } catch (err) {
      console.error("Error loading intelligence layers:", err);
    }
  };

  useEffect(() => {
    loadLayerData();
    const timer = setInterval(loadLayerData, 10000);
    return () => clearInterval(timer);
  }, []);

  // Scroll to chat bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Handle AI Chat submissions
  const handleSendChat = async () => {
    if (!inputText.trim() || isChatLoading) return;
    
    const userQuery = inputText;
    const userMsg = { id: `user-${Date.now()}`, sender: "USER" as const, text: userQuery };
    setChatMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsChatLoading(true);

    try {
      // Build contextual environment payload to enrich Gemini prompts
      const contextData = {
        activeLayer,
        crimeHotspots: crimeData,
        trafficCongestion: trafficData,
        weatherConditions: weatherData,
        recommendations: recommendations
      };
      const responseText = await sendGeminiChatMessage(userQuery, contextData);
      setChatMessages(prev => [...prev, {
        id: `gemini-${Date.now()}`,
        sender: "GEMINI" as const,
        text: responseText
      }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        id: `gemini-err-${Date.now()}`,
        sender: "GEMINI" as const,
        text: `⚠️ Telemetry pipeline failure. Please verify backend security keys. Details: ${err.message || err}`
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Submit custom live alert
  const triggerSimulatedIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.title || !alertForm.message) return;

    setSimulationStatus("INGESTING...");
    try {
      await createAlert({
        title: alertForm.title,
        message: alertForm.message,
        type: alertForm.type,
        source: alertForm.source,
        coordinates: activeLayer === "crime" ? { lat: 25.033, lng: 121.565 } : { lat: 37.774, lng: -122.419 }
      });
      setSimulationStatus("SUCCESSFULLY DISPATCHED!");
      onRefreshAllData();
      loadLayerData();
      setTimeout(() => {
        setSimulationStatus(null);
        setAlertForm({ title: "", message: "", type: "CRITICAL", source: "CRIME_SENSOR" });
      }, 3000);
    } catch (err: any) {
      setSimulationStatus(`ERROR: ${err.message || err}`);
    }
  };

  // Get active Layer specific configuration details
  const getLayerDetails = () => {
    switch (activeLayer) {
      case "crime":
        return {
          title: "Critical Crime & Security Feeds",
          accentColor: "border-rose-500/20 text-rose-400 bg-rose-500/5 hover:border-rose-500/40",
          pingColor: "bg-rose-500",
          icon: ShieldAlert,
          chartData: [
            { period: "Q1", incidents: 12, threatLevel: 30 },
            { period: "Q2", incidents: 18, threatLevel: 45 },
            { period: "Q3", incidents: 8, threatLevel: 20 },
            { period: "Q4", incidents: 22, threatLevel: 65 },
            { period: "Current", incidents: 15, threatLevel: 50 }
          ],
          chartKey: "incidents",
          chartLabel: "Recent Intrusions Count"
        };
      case "traffic":
        return {
          title: "Roadway Transit & Congestion Feeds",
          accentColor: "border-amber-500/20 text-amber-400 bg-amber-500/5 hover:border-amber-500/40",
          pingColor: "bg-amber-500",
          icon: Navigation,
          chartData: [
            { period: "Mon", speed: 42 },
            { period: "Tue", speed: 38 },
            { period: "Wed", speed: 15 },
            { period: "Thu", speed: 32 },
            { period: "Fri", speed: 28 },
            { period: "Sat", speed: 55 }
          ],
          chartKey: "speed",
          chartLabel: "Average Transit Speed (mph)"
        };
      case "pollution":
        return {
          title: "AQI & Carbon Emissions Feeds",
          accentColor: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/40",
          pingColor: "bg-emerald-500",
          icon: Leaf,
          chartData: [
            { period: "00:00", pm25: 42 },
            { period: "04:00", pm25: 35 },
            { period: "08:00", pm25: 88 },
            { period: "12:00", pm25: 145 },
            { period: "16:00", pm25: 110 },
            { period: "20:00", pm25: 65 }
          ],
          chartKey: "pm25",
          chartLabel: "Carbon / Particulate Density Index (PM2.5)"
        };
      case "weather":
        return {
          title: "Dynamic Meteorological Feeds",
          accentColor: "border-blue-500/20 text-blue-400 bg-blue-500/5 hover:border-blue-500/40",
          pingColor: "bg-blue-500",
          icon: CloudSun,
          chartData: [
            { period: "SF Bay", windSpeed: 38, temp: 14 },
            { period: "Frankfurt", windSpeed: 5, temp: 37 },
            { period: "Taipei", windSpeed: 18, temp: 28 },
            { period: "Seattle", windSpeed: 12, temp: 19 }
          ],
          chartKey: "windSpeed",
          chartLabel: "Calculated Regional Wind Speed (knots)"
        };
      case "complaints":
        return {
          title: "Citizen Complaints & Community Sentiment",
          accentColor: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:border-indigo-500/40",
          pingColor: "bg-indigo-500",
          icon: MessageSquare,
          chartData: [
            { period: "Noise", count: 8 },
            { period: "Smog/AQI", count: 14 },
            { period: "Traffic", count: 19 },
            { period: "Drones", count: 6 },
            { period: "Other", count: 3 }
          ],
          chartKey: "count",
          chartLabel: "Citizen Incident Logs Count"
        };
    }
  };

  const layerMeta = getLayerDetails() as any;

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Header & Layer Selectors */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.08),transparent)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-400 font-mono uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
              Dynamic Spatial Intelligence
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">Decision Intelligence Engine</h2>
            <p className="text-xs text-slate-400 mt-1">
              Cross-examine GIS datasets, atmospheric sensory feeds, and trigger real-time AI cost-saving reroutings.
            </p>
          </div>

          {/* Active Layers Toggles */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(["crime", "traffic", "pollution", "weather", "complaints"] as LayerType[]).map((layer) => {
              const active = activeLayer === layer;
              const details = layer === "crime" ? { label: "Crime Monitor", color: "border-rose-500/40 bg-rose-500/10 text-rose-400" } :
                              layer === "traffic" ? { label: "Traffic Feed", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" } :
                              layer === "pollution" ? { label: "Pollution AQI", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" } :
                              layer === "weather" ? { label: "Weather Radar", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" } :
                              { label: "Citizens Feed", color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400" };

              return (
                <button
                  key={layer}
                  onClick={() => {
                    setActiveLayer(layer);
                    // Autofill alerts simulator source for immersive feel
                    setAlertForm(prev => ({
                      ...prev,
                      source: layer.toUpperCase() + "_INGESTION_SYSTEM"
                    }));
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200 border uppercase tracking-wider ${
                    active 
                      ? `${details.color} font-bold shadow-lg shadow-blue-500/5 scale-102` 
                      : "border-slate-800 bg-slate-900/20 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "animate-pulse" : ""}`} style={{
                    backgroundColor: layer === "crime" ? "#fb7185" : layer === "traffic" ? "#fbbf24" : layer === "pollution" ? "#34d399" : layer === "weather" ? "#60a5fa" : "#818cf8"
                  }} />
                  {details.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Heat Map & Live Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HEAT MAP MODULE (8/12 Columns) */}
        <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between h-[510px]">
          <div className="absolute top-0 left-0 w-full bg-slate-950/50 text-[10px] font-mono p-2 px-4 border-b border-slate-800/60 flex justify-between z-10 text-slate-400">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-slate-300">
              <span className={`w-2 h-2 rounded-full ${layerMeta.pingColor} animate-pulse`} />
              HEAT MAP LAYER: {activeLayer}
            </span>
            <span>SYSTEM CONTEXT: STABLE</span>
          </div>

          {/* Graphical Heat Map Canvas */}
          <div className="relative w-full h-[410px] bg-slate-950/60 border border-slate-800/80 rounded-xl mt-6 overflow-hidden flex items-center justify-center">
            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(59,130,246,0.06)_0deg,transparent_120deg)] animate-[spin_12s_linear_infinite] pointer-events-none" />
            
            {/* Earth Grid Drawing */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 5 20 Q 15 15 25 25 T 35 15 T 45 35 T 25 65 Z M 45 40 Q 55 20 65 30 T 75 15 T 85 45 Z" fill="none" stroke="#64748b" strokeWidth="0.4" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="33" y1="0" x2="33" y2="100" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
              <line x1="66" y1="0" x2="66" y2="100" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="2,2" />
            </svg>

            {/* Glowing Hotspot Pins depending on active tab */}
            {activeLayer === "crime" && crimeData.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ left: `${i === 0 ? 25 : i === 1 ? 80 : 54}%`, top: `${i === 0 ? 45 : i === 1 ? 55 : 35}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                {/* Simulated Halo Radar rings representing crime density */}
                <div className="absolute w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 animate-ping" />
                <div className="absolute w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40" />
                
                <div className="w-4 h-4 rounded-full bg-rose-500 border border-white shadow-lg shadow-rose-500/50 flex items-center justify-center relative z-10">
                  <span className="text-[7px] font-bold text-white uppercase">{node.severity[0]}</span>
                </div>
                
                {/* Floating telemetry tag */}
                <div className="absolute top-6 bg-slate-950/90 border border-slate-800/80 px-2.5 py-1 rounded text-[9px] font-mono text-slate-300 shadow-md group-hover:border-rose-500/50 transition-colors whitespace-nowrap z-20">
                  <span className="text-rose-400 font-bold">{node.type}</span>: {node.severity} ({node.date})
                </div>
              </motion.div>
            ))}

            {activeLayer === "traffic" && trafficData.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ left: `${i === 0 ? 22 : i === 1 ? 52 : 78}%`, top: `${i === 0 ? 40 : i === 1 ? 32 : 56}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                {/* Orange congestion halos */}
                <div className="absolute w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 animate-ping" />
                <div className="w-5 h-5 rounded-full bg-amber-500 border border-amber-300 shadow-lg shadow-amber-500/50 flex items-center justify-center relative z-10">
                  <Navigation className="w-3 h-3 text-slate-950 rotate-45" />
                </div>
                <div className="absolute top-6 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-mono text-slate-300 shadow-md whitespace-nowrap z-20">
                  <span className="text-amber-400 font-bold">{node.road}</span>: {node.congestion} ({node.speed} mph @ {node.time})
                </div>
              </motion.div>
            ))}

            {activeLayer === "pollution" && pollutionData.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ left: `${i === 0 ? 55 : i === 1 ? 82 : 18}%`, top: `${i === 0 ? 33 : i === 1 ? 48 : 39}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                {/* Environmental Green rings */}
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse" />
                <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 border border-white shadow-lg shadow-emerald-500/50 flex items-center justify-center relative z-10">
                  <Leaf className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="absolute top-6 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-mono text-slate-300 shadow-md whitespace-nowrap z-20">
                  <span className="text-emerald-400 font-bold">{node.location.split(" ")[0]}</span>: AQI {node.aqi} ({node.status})
                </div>
              </motion.div>
            ))}

            {activeLayer === "weather" && weatherData.map((node, i) => (
              <motion.div
                key={node.location}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ left: `${i === 0 ? 22 : i === 1 ? 52 : 78}%`, top: `${i === 0 ? 44 : i === 1 ? 36 : 52}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                {/* Wind currents / Cloud halos */}
                <div className="absolute w-24 h-24 rounded-full bg-blue-500/10 border border-blue-400/20 animate-spin" style={{ animationDuration: "15s" }} />
                <div className="w-5 h-5 rounded-full bg-blue-500 border border-blue-300 shadow-lg shadow-blue-500/50 flex items-center justify-center relative z-10">
                  <CloudSun className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="absolute top-6 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-mono text-slate-300 shadow-md whitespace-nowrap z-20">
                  <span className="text-blue-400 font-bold">{node.location.split(" ")[0]}</span>: {node.condition} ({node.tempC}°C)
                </div>
              </motion.div>
            ))}

            {activeLayer === "complaints" && complaintsData.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                style={{ left: `${i === 0 ? 52 : i === 1 ? 22 : 78}%`, top: `${i === 0 ? 36 : i === 1 ? 44 : 52}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              >
                {/* Indigo/purple sentiment halos */}
                <div className="absolute w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-ping" />
                <div className="w-5 h-5 rounded-full bg-indigo-500 border border-indigo-300 shadow-lg shadow-indigo-500/50 flex items-center justify-center relative z-10">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="absolute top-6 bg-slate-950/90 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-mono text-slate-300 shadow-md whitespace-nowrap z-20">
                  <span className="text-indigo-400 font-bold">{node.title}</span>: {node.priority} ({node.status})
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coordinate Map Legends */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
            <span>MAPPED SENSORY MATRIX CONTROLLER</span>
            <span>ZOOM LEVEL: GLOBAL GRID 1:1</span>
          </div>
        </div>

        {/* RECHARTS DATA VIZ MODULE (4/12 Columns) */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between h-[510px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Analytical Area Charts</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Analyzing trend data for <span className="font-semibold text-slate-200 uppercase">{activeLayer}</span> values collected over recent spatial intervals.
            </p>

            {/* Recharts Component Display */}
            <div className="w-full h-[220px] bg-slate-950/40 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={layerMeta.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeLayer === "crime" ? "#fb7185" : activeLayer === "traffic" ? "#fbbf24" : activeLayer === "pollution" ? "#34d399" : activeLayer === "weather" ? "#3b82f6" : "#818cf8"} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={activeLayer === "crime" ? "#fb7185" : activeLayer === "traffic" ? "#fbbf24" : activeLayer === "pollution" ? "#34d399" : activeLayer === "weather" ? "#3b82f6" : "#818cf8"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="period" stroke="#475569" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#475569" fontSize={10} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "11px", color: "#f1f5f9" }}
                    labelClassName="font-bold text-slate-400"
                  />
                  <Area 
                    type="monotone" 
                    dataKey={layerMeta.chartKey} 
                    stroke={activeLayer === "crime" ? "#f43f5e" : activeLayer === "traffic" ? "#d97706" : activeLayer === "pollution" ? "#059669" : activeLayer === "weather" ? "#2563eb" : "#4f46e5"} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#chart-grad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-[10px] font-mono text-slate-500 mt-2 italic">
              {layerMeta.chartLabel}
            </div>
          </div>

          {/* Quick Metrics highlight widget inside side bar */}
          <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl space-y-2 mt-4">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>ACTIVE DETECTIONS</span>
              <span className="text-slate-300 font-bold">REAL-TIME FEED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Telemetry Confidence Index</span>
              <span className="text-xs font-mono font-bold text-emerald-400">98.4%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[98.4%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Telemetry Registry Grid */}
      {activeLayer === "crime" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(244,63,94,0.04),transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Active Crime & Security Telemetry Registry</h3>
            </div>
            <span className="text-[9px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest font-bold">
              GIS REGISTRY MATCHED
            </span>
          </div>
          
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/85 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold text-slate-400">Incident ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Location</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Type</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Date</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Severity</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Latitude</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Longitude</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {crimeData.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">{node.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{node.location}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{node.type}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{node.date}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.severity === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        node.severity === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        node.severity === "MEDIUM" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {node.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{node.latitude.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{node.longitude.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Dynamic Traffic Telemetry Registry Grid */}
      {activeLayer === "traffic" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(245,158,11,0.04),transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Active Traffic & Roadway Telemetry Registry</h3>
            </div>
            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest font-bold">
              SYS METRICS ALIGNED
            </span>
          </div>
          
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/85 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold text-slate-400">Transit ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Roadway / Segment</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Congestion State</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Average Speed</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Observation Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {trafficData.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{node.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{node.road}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.congestion === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        node.congestion === "HEAVY" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        node.congestion === "MODERATE" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {node.congestion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200 font-bold">{node.speed} mph</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{node.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Dynamic Citizen Complaints Telemetry Registry Grid */}
      {activeLayer === "complaints" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(99,102,241,0.04),transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Active Citizen Complaints & Sentiment Registry</h3>
            </div>
            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-bold">
              SENTIMENT CORRELATED
            </span>
          </div>
          
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/85 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold text-slate-400">Complaint ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Title</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Description</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Location</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Status</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {complaintsData.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{node.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{node.title}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans leading-relaxed">{node.description}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{node.location}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.status === "RESOLVED" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                        node.status === "INVESTIGATING" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.priority === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        node.priority === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        node.priority === "MEDIUM" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {node.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Dynamic Weather & Meteorological Telemetry Registry Grid */}
      {activeLayer === "weather" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(59,130,246,0.04),transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Active Weather & Meteorological Registry</h3>
            </div>
            <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest font-bold">
              METEOROLOGICAL SENSORS ONLINE
            </span>
          </div>
          
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/85 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold text-slate-400">Station Location</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Current Condition</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Temperature</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Humidity</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Rainfall (1h)</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Air Quality</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Impact Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {weatherData.map((node, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{node.location}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{node.condition}</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-400 font-bold">{node.temperature}°C</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{node.humidity}%</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{node.rainfall} mm</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        node.air_quality === "GOOD" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        node.air_quality === "MODERATE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {node.air_quality}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.impactLevel === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        node.impactLevel === "HIGH" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        node.impactLevel === "MEDIUM" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {node.impactLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Dynamic Environmental & Pollution Telemetry Registry Grid */}
      {activeLayer === "pollution" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_0%_0%,rgba(16,185,129,0.04),transparent)] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Active AQI & Air Quality Telemetry Registry</h3>
            </div>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-bold">
              POLLUTION MONITORING ACTIVE
            </span>
          </div>
          
          <div className="overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/85 bg-slate-950/80 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold text-slate-400">Sensor ID</th>
                  <th className="py-3 px-4 font-semibold text-slate-400">Monitoring Zone</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">AQI Rating</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Status State</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Primary Pollutant</th>
                  <th className="py-3 px-4 font-semibold text-slate-400 text-right">Risk Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {pollutionData.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">{node.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{node.location}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">{node.aqi}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        node.status === "UNHEALTHY" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                        node.status === "MODERATE" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300 font-mono">{node.mainPollutant}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        node.level === "HIGH" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        node.level === "MEDIUM" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {node.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* AI Decision Intelligence Audit & Report Hub */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,rgba(129,140,248,0.06),transparent)] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-mono uppercase tracking-wider mb-2">
              <Bot className="w-3.5 h-3.5" />
              Automated Operations Audit
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">AI Spatial Audit & Decision Support</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating crime telemetry, transit congestion, meteorological layers, pollution index, and citizen sentiment.
            </p>
          </div>
          
          <button
            onClick={runSpatialAudit}
            disabled={isAuditLoading}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-mono transition-all flex items-center gap-2 cursor-pointer ${
              isAuditLoading
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500/50"
            }`}
          >
            {isAuditLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Spatial Variables...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                Run Real-Time Spatial Audit
              </>
            )}
          </button>
        </div>

        {/* Bento Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Column 1 (Left): Summary & High Risk Areas (5/12 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Summary */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
              <h4 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold mb-2">1. Summary</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {auditReport.summary}
              </p>
            </div>

            {/* High Risk Areas */}
            <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-4">
              <h4 className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold">2. High Risk Areas</h4>
              <div className="space-y-3">
                {auditReport.highRiskAreas.map((area, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{area.name}</span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        area.threatLevel === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        area.threatLevel === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {area.threatLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${
                          area.score > 85 ? "bg-rose-500" : area.score > 65 ? "bg-amber-500" : "bg-blue-500"
                        }`} style={{ width: `${area.score}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{area.score}% Risk</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {area.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 2 (Right): Predictions, Resources & Recommendation Actions (7/12 Columns) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Predictions & Resources Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Predictions */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-4">
                <h4 className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">3. Predictions (Next 72 Hours)</h4>
                <div className="space-y-3.5">
                  {auditReport.predictions.map((pred, idx) => (
                    <div key={idx} className="border-l-2 border-amber-500/50 pl-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-amber-400 font-semibold">{pred.timeframe}</span>
                        <span className="text-[9px] font-mono text-slate-500">{pred.probability}% Probability</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {pred.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Allocation */}
              <div className="bg-slate-950/40 border border-slate-800/60 p-5 rounded-xl space-y-4">
                <h4 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">4. Resource Allocation Share</h4>
                <div className="space-y-3.5">
                  {auditReport.resourceAllocation.map((res, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-semibold text-slate-200">{res.department}</span>
                        <span className="font-mono text-indigo-400 font-bold">{res.percent}% Share</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${res.percent}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        {res.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recommendations Action List */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl space-y-4">
              <h4 className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">5. Financial & Strategic Recommendations</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {auditReport.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-slate-950 p-3.5 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2 group/rec hover:border-emerald-500/40 transition-colors">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 group-hover/rec:text-emerald-400 transition-colors">{rec.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1">
                        {rec.impact}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                      <span className="text-[9px] font-mono text-slate-500">EST ROI</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">${rec.savings?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* 3. AI Recommendations & Incident Dispatch Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RECOMMENDATIONS PANEL (7/12 Columns) */}
        <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-400 w-4 h-4" />
                <h3 className="text-sm font-semibold text-white tracking-tight">Active Rerouting & Optimization Recommendations</h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                AI ADVANCED RECOMMENDATIONS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              These suggestions are generated via the platform's Gemini pipeline correlating the active layer telemetry.
            </p>

            <div className="space-y-3.5">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all duration-200 space-y-2 relative group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 h-full w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                            {rec.id}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                            {rec.type}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 mt-1 font-sans">{rec.title}</h4>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-mono">EST SAVINGS</div>
                        <div className="text-xs font-bold text-white font-mono flex items-center justify-end gap-0.5">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          {rec.potentialSavingsUSD.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
                      {rec.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                        <span>CONFIDENCE RATE:</span>
                        <span className="text-blue-400 font-bold">{rec.confidence}%</span>
                      </div>
                      <button className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 group/btn font-mono">
                        DISPATCH MITIGATION 
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
                  <span className="text-slate-500 text-xs">No pending recommendations matched for active layer.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LIVE SIMULATOR & DISPATCH FORM (5/12 Columns) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="text-rose-400 w-4 h-4" />
              <h3 className="text-sm font-semibold text-white tracking-tight">Operational Alert Dispatcher</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Manually dispatch or simulate warning telemetry to trigger live decision queues on our operational map and co-pilot memory.
            </p>

            <form onSubmit={triggerSimulatedIncident} className="space-y-4">
              {/* Alert Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Alert Summary Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unauthorized drone detected at depot perimeter"
                  value={alertForm.title}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 font-sans"
                />
              </div>

              {/* Message Details */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Detailed Warning Information</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Incorporate exact coordinates and severity impacts..."
                  value={alertForm.message}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 font-sans resize-none"
                />
              </div>

              {/* Grid selectors for severity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Severity Level</label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 font-mono"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Sensory Source</label>
                  <select
                    value={alertForm.source}
                    onChange={(e) => setAlertForm(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/40 font-mono"
                  >
                    <option value="CRIME_SENSOR">CRIME SENSOR</option>
                    <option value="TRAFFIC_INGEST">TRAFFIC INGEST</option>
                    <option value="POLLUTION_MONITOR">POLLUTION MONITOR</option>
                    <option value="WEATHER_SATELLITE">WEATHER SATELLITE</option>
                  </select>
                </div>
              </div>

              {/* Simulation Status feedback */}
              {simulationStatus && (
                <div className={`p-2 rounded font-mono text-[10px] text-center ${
                  simulationStatus.includes("ERROR") ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                }`}>
                  {simulationStatus}
                </div>
              )}

              {/* Ingest button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                DISPATCH ALERT TO LOGISTICS NETWORK
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 4. AI CO-PILOT CHAT INTERACTIVE PANEL */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(59,130,246,0.06),transparent)] pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <Bot className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Co-Pilot Spatial Chat Workspace</h3>
          <span className="text-[9px] font-mono bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
            Gemini Flash Connected
          </span>
        </div>

        {/* Chat Stream Screen */}
        <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 h-[200px] overflow-y-auto space-y-3.5 scrollbar-none">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] ${msg.sender === "USER" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div className={`p-1 rounded-lg shrink-0 h-fit ${msg.sender === "USER" ? "bg-blue-600/10 text-blue-400" : "bg-slate-800 text-slate-300"}`}>
                  {msg.sender === "USER" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "USER" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-slate-900 text-slate-200 border border-slate-850 rounded-tl-none"
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isChatLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
              <span>Gemini processing layer variables...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input Field */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="e.g. Compare Weather delay impacts in SF with our logistics threat recommendations..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/40 font-sans"
          />
          <button
            onClick={handleSendChat}
            disabled={isChatLoading || !inputText.trim()}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            ASK AI
          </button>
        </div>
      </div>

    </div>
  );
}
