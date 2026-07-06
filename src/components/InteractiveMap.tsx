import { useState, useEffect } from "react";
import { Decision, Alert } from "../types";
import { MapPin, ShieldAlert, Navigation, Sun, CloudRain, Wind, Compass, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InteractiveMapProps {
  decisions: Decision[];
  alerts: Alert[];
  onTriggerDecision: (decision: Decision) => void;
}

interface MapNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  x: number; // mapped SVG percentage x
  y: number; // mapped SVG percentage y
  type: "PORT" | "DC" | "FACTORY" | "GATEWAY";
  status: "HEALTHY" | "ALERT" | "CRITICAL";
  weather: string;
  temp: string;
  metric: string;
  metricValue: string;
}

export default function InteractiveMap({ decisions, alerts, onTriggerDecision }: InteractiveMapProps) {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [showRerouteAnimation, setShowRerouteAnimation] = useState(false);
  const [animationPath, setAnimationPath] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Hardcoded coordinate mapping to SVG percentage space (x: 5% - 95%, y: 15% - 85%)
  const [nodes, setNodes] = useState<MapNode[]>([
    {
      id: "DEC-101",
      name: "Port of San Francisco",
      lat: 37.7749,
      lng: -122.4194,
      x: 18,
      y: 42,
      type: "PORT",
      status: "CRITICAL",
      weather: "Foggy & High Winds",
      temp: "14°C",
      metric: "Berth Delay",
      metricValue: "16.5 Hours"
    },
    {
      id: "DEC-102",
      name: "EU-West Server Complex",
      lat: 50.1109,
      lng: 8.6821,
      x: 52,
      y: 35,
      type: "DC",
      status: "ALERT",
      weather: "Clear / Dry Peak",
      temp: "32°C",
      metric: "Grid Power Draw",
      metricValue: "4.8 MW"
    },
    {
      id: "DEC-103",
      name: "Taipei Silicon Depot",
      lat: 25.0330,
      lng: 121.5654,
      x: 82,
      y: 52,
      type: "FACTORY",
      status: "ALERT",
      weather: "Heavy Rain (Typhoon Outer Ring)",
      temp: "28°C",
      metric: "Feedstock Buffer",
      metricValue: "8.5 Days"
    },
    {
      id: "DEC-104",
      name: "Northwest Edge Gateway",
      lat: 47.6062,
      lng: -122.3321,
      x: 17,
      y: 34,
      type: "GATEWAY",
      status: "HEALTHY",
      weather: "Cool Air Currents",
      temp: "19°C",
      metric: "Sensory Ingestion Rate",
      metricValue: "24,500 msg/s"
    }
  ]);

  // Synchronize status colors with the decisions & alerts from backend
  useEffect(() => {
    setNodes(prev => prev.map(node => {
      const dec = decisions.find(d => d.id === node.id);
      const activeAlerts = alerts.filter(a => !a.acknowledged && a.coordinates && 
        Math.abs(a.coordinates.lat - node.lat) < 1 && Math.abs(a.coordinates.lng - node.lng) < 1);
      
      let status: MapNode["status"] = "HEALTHY";
      if (activeAlerts.some(a => a.type === "CRITICAL") || dec?.urgency === "CRITICAL") {
        status = "CRITICAL";
      } else if (activeAlerts.length > 0 || dec?.urgency === "HIGH" || dec?.status === "PENDING") {
        status = "ALERT";
      } else if (dec?.status === "RESOLVED" || dec?.status === "APPROVED") {
        status = "HEALTHY";
      }

      return { ...node, status };
    }));
  }, [decisions, alerts]);

  // Handle simulated GIS Rerouting Visual Path Action
  const triggerSimulatedReroute = (node: MapNode) => {
    if (node.id === "DEC-101") {
      // Port of SF -> Seattle-Tacoma Port reroute line
      setAnimationPath({ x1: 18, y1: 42, x2: 17, y2: 34 });
    } else if (node.id === "DEC-102") {
      // Frankfurt Grid -> Munich Aux Power Line
      setAnimationPath({ x1: 52, y1: 35, x2: 56, y2: 45 });
    } else {
      setAnimationPath({ x1: node.x, y1: node.y, x2: node.x - 10, y2: node.y + 10 });
    }

    setShowRerouteAnimation(true);
    setTimeout(() => {
      setShowRerouteAnimation(false);
      setAnimationPath(null);
      
      // Update decision locally if possible, or trigger callback
      const targetDec = decisions.find(d => d.id === node.id);
      if (targetDec) {
        onTriggerDecision(targetDec);
      }
    }, 2800);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-2xl relative font-sans overflow-hidden">
      {/* Background World Schematic Map SVG Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.08)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full bg-slate-950/40 text-[9px] font-mono p-1.5 px-3 border-b border-slate-800/60 flex justify-between z-10 text-slate-500">
        <span>SCHEMATIC OPERATIONAL MAP // MERCATOR GRID V5.0</span>
        <span>GEO-SYNCHRONIZED // LATENCY OVERRIDE 0.04s</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
        {/* Interactive SVG GIS Map Stage */}
        <div className="lg:col-span-3 relative bg-slate-950 border border-slate-800 rounded-xl h-[460px] flex items-center justify-center overflow-hidden">
          {/* Schematic World Vector Contour Drawings */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Mock Continents */}
            <path d="M 5 20 Q 15 15 25 25 T 35 15 T 45 35 T 25 65 Z" fill="rgba(100,116,139,0.15)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
            <path d="M 45 40 Q 55 20 65 30 T 75 15 T 85 45 T 65 75 Z" fill="rgba(100,116,139,0.15)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
            <path d="M 10 70 Q 25 65 35 80 T 25 95 Z" fill="rgba(100,116,139,0.15)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
            <path d="M 70 65 Q 85 60 95 85 Z" fill="rgba(100,116,139,0.15)" stroke="rgba(100,116,139,0.3)" strokeWidth="0.5" />
            
            {/* Latitude / Longitude lines */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="33" y1="0" x2="33" y2="100" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
            <line x1="66" y1="0" x2="66" y2="100" stroke="rgba(51,65,85,0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
          </svg>

          {/* Connected Route Animation Pathways (Freight, Grid Routing etc.) */}
          {showRerouteAnimation && animationPath && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <defs>
                <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <line
                x1={`${animationPath.x1}%`}
                y1={`${animationPath.y1}%`}
                x2={`${animationPath.x2}%`}
                y2={`${animationPath.y2}%`}
                stroke="url(#glow-grad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-[dash_2.5s_linear_infinite]"
                style={{
                  strokeDasharray: "8, 5",
                }}
              />
              <circle cx={`${animationPath.x2}%`} cy={`${animationPath.y2}%`} r="6" className="fill-blue-500 animate-ping" />
            </svg>
          )}

          {/* SVG Map Pins Grid layer */}
          <div className="absolute inset-0 pointer-events-auto">
            {nodes.map((node) => {
              const colorClass = 
                node.status === "CRITICAL" ? "bg-rose-500 shadow-rose-500/50" :
                node.status === "ALERT" ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50";
              const borderClass = 
                node.status === "CRITICAL" ? "border-rose-400" :
                node.status === "ALERT" ? "border-amber-400" : "border-emerald-400";

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Glowing Radar Rings */}
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-blue-500/25 pointer-events-none scale-200" />
                  
                  {/* Glowing Core Pin */}
                  <div className={`w-4.5 h-4.5 rounded-full border-2 ${borderClass} ${colorClass} shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-125`}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>

                  {/* Tiny monospaced location flag */}
                  <div className="absolute left-6 -top-2 bg-slate-950/90 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded text-white whitespace-nowrap shadow-md pointer-events-none select-none">
                    {node.name.split(" ").slice(-1)[0]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SVG coordinate reference bottom corner */}
          <div className="absolute bottom-3 left-4 text-[9px] font-mono text-slate-500 pointer-events-none">
            GEO-COORDINATES MATCHED ON CANVAS (Mercator Aspect: 16:9)
          </div>
        </div>

        {/* GIS Node Inspector Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 space-y-4"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      selectedNode.status === "CRITICAL" ? "bg-rose-500" :
                      selectedNode.status === "ALERT" ? "bg-amber-500" : "bg-emerald-500"
                    }`} />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{selectedNode.type} CASE</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 tracking-tight">{selectedNode.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    LAT: {selectedNode.lat.toFixed(4)} // LNG: {selectedNode.lng.toFixed(4)}
                  </p>
                </div>

                {/* Weather Grounding Info */}
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-mono text-slate-500">Live Weather Ingestion</div>
                    <div className="text-xs text-slate-200">{selectedNode.weather}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-400 font-mono">{selectedNode.temp}</div>
                    {selectedNode.weather.includes("Rain") ? <CloudRain className="w-4 h-4 text-slate-400 ml-auto mt-1" /> :
                     selectedNode.weather.includes("Wind") ? <Wind className="w-4 h-4 text-slate-400 ml-auto mt-1" /> :
                     <Sun className="w-4 h-4 text-amber-400 ml-auto mt-1" />}
                  </div>
                </div>

                {/* Sensor Metric Indicator */}
                <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/60 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">{selectedNode.metric}</span>
                  <div className="text-base font-bold text-white font-mono">{selectedNode.metricValue}</div>
                </div>

                {/* Simulated Path Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Rerouting Co-pilot</span>
                  
                  {selectedNode.status !== "HEALTHY" ? (
                    <button
                      onClick={() => triggerSimulatedReroute(selectedNode)}
                      className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-150 text-xs flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Trigger Optimal Rerouting
                    </button>
                  ) : (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-center">
                      <span className="text-xs text-emerald-400 font-mono">No active congestion detected</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const dec = decisions.find(d => d.id === selectedNode.id);
                      if (dec) onTriggerDecision(dec);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium py-2 px-3 rounded-lg transition-colors duration-150 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-slate-500" />
                    Open Detailed Case File
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-900/10 border border-dashed border-slate-800 rounded-xl p-6 text-center h-[410px] flex flex-col justify-center items-center">
                <Compass className="w-8 h-8 text-slate-700 animate-spin" style={{ animationDuration: "12s" }} />
                <h3 className="text-xs font-semibold text-slate-400 mt-4">No GIS Pin Selected</h3>
                <p className="text-[11px] text-slate-600 max-w-xs mt-1">
                  Click any pulsing coordinate pin on the operational grid map to display localized telemetries, environmental factors, and activate routing algorithms.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
