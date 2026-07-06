import React, { useState } from "react";
import { Alert } from "../types";
import { ackAlert, createAlert } from "../api";
import { Bell, AlertCircle, AlertTriangle, Info, Check, Radio, Send, Plus, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AlertsFeedProps {
  alerts: Alert[];
  onRefreshAlerts: () => void;
}

export default function AlertsFeed({ alerts, onRefreshAlerts }: AlertsFeedProps) {
  const [filter, setFilter] = useState<"ALL" | "UNACK" | "CRITICAL">("ALL");
  const [isIngesting, setIsIngesting] = useState(false);

  // Form states for custom alert simulator
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "WARNING" | "CRITICAL">("WARNING");
  const [source, setSource] = useState("Tokyo Turbine Sensor HUB-9");
  const [lat, setLat] = useState("35.6762");
  const [lng, setLng] = useState("139.6503");

  const handleAck = async (id: string) => {
    try {
      await ackAlert(id);
      onRefreshAlerts();
    } catch (err) {
      alert("Failed to acknowledge alert");
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setIsIngesting(true);

    try {
      const payload = {
        title,
        message,
        type,
        source,
        coordinates: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined
      };

      await createAlert(payload);
      onRefreshAlerts();

      // Reset form
      setTitle("");
      setMessage("");
    } catch (err) {
      alert("Failed to ingest alert");
    } finally {
      setIsIngesting(false);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === "UNACK") return !a.acknowledged;
    if (filter === "CRITICAL") return a.type === "CRITICAL" && !a.acknowledged;
    return true;
  });

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "CRITICAL": return <AlertCircle className="w-4.5 h-4.5 text-rose-400" />;
      case "WARNING": return <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />;
      default: return <Info className="w-4.5 h-4.5 text-sky-400" />;
    }
  };

  const getAlertRowStyle = (a: Alert) => {
    if (a.acknowledged) return "opacity-50 border-slate-900 bg-slate-950/20";
    switch (a.type) {
      case "CRITICAL": return "border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10";
      case "WARNING": return "border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10";
      default: return "border-sky-500/10 bg-sky-500/5 hover:bg-sky-500/10";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Live Alerts Feed (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-white tracking-tight">System Alerts Feed</h2>
            <p className="text-xs text-slate-400">Real-time unacknowledged sensor anomalies and systemic energy warnings.</p>
          </div>
          {/* Filters */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-mono">
            <button
              onClick={() => setFilter("ALL")}
              className={`p-1 px-2.5 rounded ${filter === "ALL" ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter("UNACK")}
              className={`p-1 px-2.5 rounded ${filter === "UNACK" ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              UNRESOLVED
            </button>
            <button
              onClick={() => setFilter("CRITICAL")}
              className={`p-1 px-2.5 rounded ${filter === "CRITICAL" ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              CRITICAL
            </button>
          </div>
        </div>

        {/* List of Alerts */}
        <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className={`p-4 rounded-xl border flex gap-4 transition-all duration-200 ${getAlertRowStyle(alert)}`}
              >
                {/* Icon Column */}
                <div className="shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>

                {/* Content Column */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      {alert.id} // {alert.source}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{alert.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{alert.message}</p>
                </div>

                {/* Actions Column */}
                {!alert.acknowledged && (
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => handleAck(alert.id)}
                      className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      ACK
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlerts.length === 0 && (
            <div className="text-center p-12 border border-dashed border-slate-850 rounded-xl text-slate-600 font-mono text-xs">
              NO ACTIVE ALERTS MATCHING CRITERIA
            </div>
          )}
        </div>
      </div>

      {/* IoT Alert Simulator (5 cols) */}
      <div className="lg:col-span-5">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Sensor Telemetry Ingestor
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Inject a simulated IoT anomaly warning or system failure to verify AI decision copilot loops and real-time GIS rendering.
            </p>
          </div>

          <form onSubmit={handleIngest} className="space-y-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block">ALERT HEADING</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Turbine Subsystem Overheating"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-slate-400 block">DETAILED INGESTION LOG</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details regarding threshold violations, temperatures, or vessel backlogs..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 h-16 resize-none focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Ingestion Source and Warning Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 block">WARNING LEVEL</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="INFO">INFO (Blue)</option>
                  <option value="WARNING">WARNING (Yellow)</option>
                  <option value="CRITICAL">CRITICAL (Red)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-slate-400 block">TELEMETRY SOURCE</label>
                <input
                  type="text"
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Tokyo Hub Sensor-4"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Geolocation Coordinates */}
            <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 space-y-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-400" />
                GIS Geolocation Coordinates
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-slate-400 block">LATITUDE</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="e.g. 35.6762"
                    className="w-full bg-slate-950 border border-slate-850 rounded text-xs text-white p-1.5 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-mono text-slate-400 block">LONGITUDE</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="e.g. 139.6503"
                    className="w-full bg-slate-950 border border-slate-850 rounded text-xs text-white p-1.5 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isIngesting}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-3 rounded-lg transition-colors duration-150 text-xs flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              INGEST TELEMETRY ALERT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
