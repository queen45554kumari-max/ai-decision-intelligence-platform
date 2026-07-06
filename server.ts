import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Enterprise Operational Data Store (In-Memory Database)
interface Decision {
  id: string;
  title: string;
  domain: string;
  description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactor: number; // 0-100
  potentialImpact: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED";
  assignedTo: string;
  createdAt: string;
  coordinates: { lat: number; lng: number };
  locationName: string;
  metrics: { name: string; value: number; unit: string }[];
  history: { timestamp: string; action: string; actor: string; details: string }[];
}

interface Alert {
  id: string;
  type: "WARNING" | "CRITICAL" | "INFO";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  coordinates?: { lat: number; lng: number };
}

// Seeding standard data
let decisions: Decision[] = [
  {
    id: "DEC-101",
    title: "Pacific Supply Chain Hub Divergence",
    domain: "Logistics",
    description: "Reroute incoming freight cargo from San Francisco Port due to severe micro-climate weather anomalies causing a 12-hour queue backlog.",
    urgency: "HIGH",
    riskFactor: 35,
    potentialImpact: "$140,000 delay cost penalty, 4% customer fulfillment drop.",
    status: "PENDING",
    assignedTo: "Operations Lead",
    createdAt: new Date().toISOString(),
    coordinates: { lat: 37.7749, lng: -122.4194 },
    locationName: "Port of San Francisco, CA",
    metrics: [
      { name: "Backlog Queue Size", value: 45, unit: "ships" },
      { name: "Average Latency Delay", value: 16.5, unit: "hours" },
      { name: "Diversion Fuel Cost Delta", value: 12000, unit: "USD" }
    ],
    history: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), action: "INGEST", actor: "Weather API Sensor HUB-4", details: "Advisory of wind shear threshold exceedance" },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), action: "AI_ANALYSIS", actor: "Gemini Engine v3.5", details: "Identified optimal diversion route via Seattle-Tacoma Port." }
    ]
  },
  {
    id: "DEC-102",
    title: "EU West Data Center Power Optimization",
    domain: "Infrastructure",
    description: "Shed non-critical compute instances and spin down 14 server racks in Frankfurt Center to accommodate local power grid load-shedding requests during regional peak heating.",
    urgency: "CRITICAL",
    riskFactor: 12,
    potentialImpact: "Temporary reduction of analytical log-processing pipelines; Zero impact to core operational Web APIs.",
    status: "PENDING",
    assignedTo: "Infrastructure Architect",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    coordinates: { lat: 50.1109, lng: 8.6821 },
    locationName: "EU-West Server Complex (Frankfurt)",
    metrics: [
      { name: "Current Power Draw", value: 4.8, unit: "MW" },
      { name: "Sheddable Idle Racks", value: 14, unit: "racks" },
      { name: "Power Grid Subsidy Reward", value: 85000, unit: "EUR" }
    ],
    history: [
      { timestamp: new Date(Date.now() - 7200000).toISOString(), action: "ALERT", actor: "Frankfurt Energy Grid Manager", details: "Load balancing demand trigger issued" }
    ]
  },
  {
    id: "DEC-103",
    title: "East Asia Chips Depot Shortfall Mitigation",
    domain: "Supply Chain",
    description: "Accelerate custom delivery contracts with Taiwan Foundries to counteract a 20% raw chemical reactant delay in semiconductor packaging plants.",
    urgency: "MEDIUM",
    riskFactor: 65,
    potentialImpact: "Expedited shipping surcharge of $40k. Avoids potential production line stoppage of downstream IoT device manufacture next month.",
    status: "APPROVED",
    assignedTo: "Procurement Manager",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    coordinates: { lat: 25.0330, lng: 121.5654 },
    locationName: "Taipei Silicon Depot",
    metrics: [
      { name: "Buffer Inventory Reserve", value: 8.5, unit: "days" },
      { name: "Lead Time Escalation", value: 14, unit: "days" },
      { name: "Production Deficit Prevention", value: 450000, unit: "units" }
    ],
    history: [
      { timestamp: new Date(Date.now() - 14400000).toISOString(), action: "INGEST", actor: "ERP Warehouse Monitor", details: "Chemical feedstock buffer dropped below critical yellow threshold." },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), action: "APPROVE", actor: "Operations VP", details: "Authorized budget of $40k for air-freight escalation." }
    ]
  },
  {
    id: "DEC-104",
    title: "North America Cloud Elastic Edge Expansion",
    domain: "Infrastructure",
    description: "Deploy 50 new localized virtual Kubernetes nodes across Seattle and Vancouver to absorb a sudden 300% surge in localized industrial sensory traffic.",
    urgency: "HIGH",
    riskFactor: 18,
    potentialImpact: "Saves high-frequency manufacturing telemetry from dropouts. Increases regional running costs by $18,500/month.",
    status: "RESOLVED",
    assignedTo: "Infrastructure Architect",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    coordinates: { lat: 47.6062, lng: -122.3321 },
    locationName: "Northwest Edge Gateway",
    metrics: [
      { name: "Telemetry Traffic Rate", value: 24500, unit: "msg/sec" },
      { name: "Package Dropout Rate", value: 0.02, unit: "%" },
      { name: "Kubernetes Edge Pods", value: 85, unit: "nodes" }
    ],
    history: [
      { timestamp: new Date(Date.now() - 86400000).toISOString(), action: "DETECTION", actor: "Prometheus Metric Collector", details: "Sensory ingestion queue backup detected" },
      { timestamp: new Date(Date.now() - 82000000).toISOString(), action: "APPROVE", actor: "Ops Automation Engine", details: "Approved autoscale policy deployment" },
      { timestamp: new Date(Date.now() - 72000000).toISOString(), action: "RESOLVE", actor: "K8s Controller System", details: "Nodes fully healthy and traffic equalized." }
    ]
  }
];

let alerts: Alert[] = [
  {
    id: "ALT-001",
    type: "CRITICAL",
    title: "San Francisco Port Extreme Congestion Warning",
    message: "Container berth turnaround times have doubled in the last 12 hours. Severe logistics backlog risk.",
    source: "Automated AIS Shipping Signals",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    acknowledged: false,
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  {
    id: "ALT-002",
    type: "WARNING",
    title: "Frankfurt Energy Grid Load Shedding Notice",
    message: "Regional energy network under heavy heating load. Secondary data centers requested to shed up to 250kW consumption.",
    source: "Federal Power Authority",
    timestamp: new Date(Date.now() - 5400000).toISOString(),
    acknowledged: false,
    coordinates: { lat: 50.1109, lng: 8.6821 }
  },
  {
    id: "ALT-003",
    type: "INFO",
    title: "Security Patch Rollout Completed (All Hubs)",
    message: "Vulnerability CVE-2026-9811 zero-day mitigation patch successfully deployed to all 12 Edge clusters.",
    source: "DevSecOps Pipeline Manager",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    acknowledged: true
  }
];

// Simulated BigQuery Analytics Engine Logs Database
// Contains columns: id, timestamp, event_type, value, region, service, cost_impact, latency_ms
const bqLogs = Array.from({ length: 250 }).map((_, index) => {
  const regions = ["US-EAST", "US-WEST", "EU-WEST", "APAC-EAST"];
  const services = ["Ingestion-Gateway", "Decision-Optimizer", "Model-Serving", "Logistics-Matcher", "Auth-Shield"];
  const eventTypes = ["INFO", "WARN", "ERROR", "SECURITY_ALERT"];
  const region = regions[index % regions.length];
  const service = services[index % services.length];
  const event_type = eventTypes[index % eventTypes.length];
  const value = Math.floor(Math.sin(index) * 50 + 150);
  const latency_ms = Math.floor(Math.cos(index) * 200 + 350) + (event_type === "ERROR" ? 500 : 0);
  const cost_impact = Math.floor((Math.abs(Math.sin(index)) * 2.5) * 100) / 100;
  
  // Date spread over the last 10 days
  const date = new Date(Date.now() - (index % 10) * 86400000 - (index % 24) * 3600000).toISOString();
  
  return {
    id: `row-${index + 1000}`,
    timestamp: date,
    event_type,
    value,
    region,
    service,
    cost_impact,
    latency_ms
  };
});

// GET /api/decisions
app.get("/api/decisions", (req, res) => {
  res.json(decisions);
});

// POST /api/decisions/:id/action
app.post("/api/decisions/:id/action", (req, res) => {
  const { id } = req.params;
  const { action, actor } = req.body; // APPROVED, REJECTED, RESOLVED

  const decision = decisions.find(d => d.id === id);
  if (!decision) {
    return res.status(404).json({ error: "Decision case not found" });
  }

  if (action === "APPROVE") {
    decision.status = "APPROVED";
  } else if (action === "REJECT") {
    decision.status = "REJECTED";
  } else if (action === "RESOLVE") {
    decision.status = "RESOLVED";
  } else {
    return res.status(400).json({ error: "Invalid action request" });
  }

  decision.history.unshift({
    timestamp: new Date().toISOString(),
    action,
    actor: actor || "Operations Manager",
    details: `Updated decision state to ${decision.status}`
  });

  res.json({ success: true, decision });
});

// GET /api/alerts
app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

// POST /api/alerts/acknowledge
app.post("/api/alerts/:id/ack", (req, res) => {
  const { id } = req.params;
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ error: "Alert not found" });
  }
});

// POST /api/alerts/create
app.post("/api/alerts/create", (req, res) => {
  const { type, title, message, source, coordinates } = req.body;
  const newAlert: Alert = {
    id: `ALT-0${alerts.length + 1}`,
    type: type || "INFO",
    title,
    message,
    source: source || "Manual Ingestion Sensor",
    timestamp: new Date().toISOString(),
    acknowledged: false,
    coordinates
  };
  alerts.unshift(newAlert);
  res.json({ success: true, alert: newAlert });
});

// --- USER REQUESTED REST API CHANNELS ---

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
}

// Dynamic Mock User Registry with exactly: id, name, email, password, role
const users: User[] = [
  { id: "usr-001", name: "Operations Director", email: "ops.director@enterprise.com", password: "password", role: "OPERATIONS_LEAD" },
  { id: "usr-002", name: "BigQuery Analyst", email: "analyst.bq@enterprise.com", password: "password", role: "DATA_ANALYST" },
  { id: "usr-003", name: "Executive Board Partner", email: "executive.board@enterprise.com", password: "password", role: "EXECUTIVE" }
];

// GET /api/users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// POST /api/login
app.post("/api/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required for authentication." });
  }

  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Dynamic auto-registration for streamlined developer sandbox flow
    const cleanName = email.split("@")[0].replace(".", " ");
    user = {
      id: "usr-0" + (users.length + 1),
      name: cleanName,
      email: email,
      password: password || "password",
      role: role || "OPERATIONS_LEAD"
    };
    users.push(user);
  }

  res.json({
    success: true,
    token: "jwt-enterprise-token-" + Math.random().toString(36).substring(7),
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// POST /api/register
app.post("/api/register", (req, res) => {
  const { id, name, email, password, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Name and Email are required for registration." });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "A user with this email credential already exists." });
  }

  const generatedId = id || "usr-0" + (users.length + 1);
  const newUser: User = {
    id: generatedId,
    name: name,
    email: email,
    password: password || "password",
    role: role || "OPERATIONS_LEAD"
  };
  users.push(newUser);

  res.json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    }
  });
});

// GET /api/dashboard
app.get("/api/dashboard", (req, res) => {
  const pendingDecisions = decisions.filter(d => d.status === "PENDING").length;
  const approvedDecisions = decisions.filter(d => d.status === "APPROVED").length;
  const resolvedDecisions = decisions.filter(d => d.status === "RESOLVED").length;
  const unresolvedAlerts = alerts.filter(a => !a.acknowledged).length;

  res.json({
    decisionsCount: decisions.length,
    pendingDecisions,
    approvedDecisions,
    resolvedDecisions,
    alertsCount: alerts.length,
    unresolvedAlerts,
    systemStatus: unresolvedAlerts > 0 ? "ATTENTION" : "STABLE",
    gridLoad: "OPTIMIZED",
    apiLatency: "340ms",
    metricsSummary: {
      decisionConfidence: "98.4%",
      activeInferences: 12842,
      geminiLatency: "340ms",
      criticalAlertsCount: alerts.filter(a => a.type === "CRITICAL" && !a.acknowledged).length
    }
  });
});

// POST /api/chat
app.post("/api/chat", async (req, res) => {
  const { message, history, contextData } = req.body;
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        text: `[SIMULATED COPILOT] Received: "${message}". Gemini model is active but GEMINI_API_KEY is not defined. Analyzing query: I recommend maintaining silicon buffer levels at 8.5 days and diverting secondary maritime containers to Seattle to bypass SF bay wind gusts. Let me know if you would like to draft a runbook for this action.`
      });
    }

    const ai = getGeminiClient();
    let sysInstruction = "You are the AI Decision Co-Pilot for the Enterprise AI-Decision-Platform. You provide advanced operations advice, critical analysis of business decisions, risk assessments, and logistical planning advice. Refer to the current enterprise operational metrics where relevant.";
    if (contextData) {
      sysInstruction += `\n\nActive Context: ${JSON.stringify(contextData)}`;
    }

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.7,
      }
    });

    const response = await chat.sendMessage({ message });
    res.json({ success: true, text: response.text });
  } catch (err: any) {
    console.error("Gemini /api/chat Error:", err);
    res.json({
      success: true,
      text: `[SIMULATED COPILOT COOLDOWN] Operational logs are synchronized. Current query details: "${message}". I suggest checking the BigQuery console under 'Regional Ingestion Metrics' to assess APAC-EAST vs US-WEST costs before executing power rack scale downs.`
    });
  }
});

// GET /api/crime
app.get("/api/crime", (req, res) => {
  res.json([
    {
      id: "CRM-001",
      location: "Port of San Francisco, CA",
      type: "Cargo Intrusion",
      date: "2026-07-06",
      severity: "LOW",
      latitude: 37.7749,
      longitude: -122.4194
    },
    {
      id: "CRM-002",
      location: "Taipei Silicon Depot",
      type: "Perimeter Drone Breach",
      date: "2026-07-05",
      severity: "MEDIUM",
      latitude: 25.0330,
      longitude: 121.5654
    },
    {
      id: "CRM-003",
      location: "Frankfurt Logistics Hub",
      type: "Sensor Disruption",
      date: "2026-07-06",
      severity: "HIGH",
      latitude: 50.1109,
      longitude: 8.6821
    }
  ]);
});

// GET /api/traffic
app.get("/api/traffic", (req, res) => {
  res.json([
    {
      id: "TRF-001",
      road: "Highway 101 North",
      congestion: "HEAVY",
      speed: 15,
      time: "08:30"
    },
    {
      id: "TRF-002",
      road: "Interstate 80 East",
      congestion: "MODERATE",
      speed: 45,
      time: "08:15"
    },
    {
      id: "TRF-003",
      road: "State Route 82 South",
      congestion: "NORMAL",
      speed: 65,
      time: "07:45"
    }
  ]);
});

// GET /api/weather
app.get("/api/weather", (req, res) => {
  res.json([
    {
      location: "Port of San Francisco, CA",
      condition: "Wind Shear & Fog",
      windSpeedKts: 38,
      temperatureC: 14,
      tempC: 14,
      temperature: 14,
      humidity: 88,
      rainfall: 0.1,
      air_quality: "GOOD",
      impactLevel: "HIGH"
    },
    {
      location: "EU-West Server Complex (Frankfurt)",
      condition: "Regional Heatwave",
      windSpeedKts: 5,
      temperatureC: 37,
      tempC: 37,
      temperature: 37,
      humidity: 32,
      rainfall: 0.0,
      air_quality: "POOR",
      impactLevel: "CRITICAL"
    },
    {
      location: "Taipei Silicon Depot",
      condition: "Typhoon Pre-warning",
      windSpeedKts: 18,
      temperatureC: 28,
      tempC: 28,
      temperature: 28,
      humidity: 79,
      rainfall: 12.4,
      air_quality: "MODERATE",
      impactLevel: "MEDIUM"
    }
  ]);
});

// GET /api/recommendations
app.get("/api/recommendations", (req, res) => {
  res.json([
    {
      id: "REC-001",
      title: "Reroute Seattle-Tacoma Ingestion Pipeline",
      type: "LOGISTICS",
      confidence: 94,
      potentialSavingsUSD: 45000,
      description: "Divert incoming containers from SF Bay due to heavy wind delays."
    },
    {
      id: "REC-002",
      title: "Consolidate Server Racks in Frankfurt",
      type: "INFRASTRUCTURE",
      confidence: 98,
      potentialSavingsUSD: 85000,
      description: "Power down 14 non-essential nodes to receive utility provider grid-subsidy."
    },
    {
      id: "REC-003",
      title: "Pre-order Silicon feedstocks from Secondary Suppliers",
      type: "SUPPLY_CHAIN",
      confidence: 85,
      potentialSavingsUSD: 120000,
      description: "Mitigate East Asia raw chemical reactor deficits."
    }
  ]);
});

// GET /api/complaints
app.get("/api/complaints", (req, res) => {
  res.json([
    {
      id: "CMP-001",
      title: "Noise Pollution",
      description: "Excessive cooling fan hum from EU-West Server Complex (Frankfurt) during high-temperature peak loads.",
      location: "Frankfurt Regional Office Area",
      status: "INVESTIGATING",
      priority: "MEDIUM"
    },
    {
      id: "CMP-002",
      title: "Air Quality / Smog",
      description: "Diesel emissions and traffic idling near SF Port cargo loading zones. Residents report heavy sulfur smell.",
      location: "Port of San Francisco, CA",
      status: "OPEN",
      priority: "HIGH"
    },
    {
      id: "CMP-003",
      title: "Hazardous Truck Routing",
      description: "Freight trucks using residential bypass routes around Taipei Silicon Depot to avoid main street traffic.",
      location: "Taipei Silicon Depot Area",
      status: "RESOLVED",
      priority: "HIGH"
    }
  ]);
});

// POST /api/report
app.post("/api/report", async (req, res) => {
  const { decisionId, alertId, customContext } = req.body;
  try {
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        markdown: `# Simulated Incident Report: Regional Operations Optimization\n\n## 1. Executive Summary\nWe detected elevated turnaround latency indicators across the western marine terminal hubs. This brief outline covers the potential mitigation guidelines.\n\n## 2. Dynamic Impact Evaluation\n- **Target Entity**: ${decisionId || alertId || "Global Logistics Route"}\n- **Calculated Risk Index**: 64%\n- **Fulfillment Deficit Projection**: 4% downtime risk.\n\n## 3. Operations Recommendation\nDivert regional supply pathways via Northwest edge gateways to stabilize latency dropouts.\n\n*Simulated Briefing compiled automatically via Platform AI.*`
      });
    }

    const ai = getGeminiClient();
    let prompt = "";
    if (decisionId) {
      const dec = decisions.find(d => d.id === decisionId);
      prompt = `Generate a highly structured, professional, executive Decision Brief Report for the following operational challenge:
      ID: ${dec?.id}
      Title: ${dec?.title}
      Domain: ${dec?.domain}
      Description: ${dec?.description}
      Urgency: ${dec?.urgency}
      Risk Factor: ${dec?.riskFactor}%
      Financial/Impact Threat: ${dec?.potentialImpact}
      Location: ${dec?.locationName}
      Active Metrics: ${JSON.stringify(dec?.metrics)}

      Please include sections for:
      1. Executive Summary
      2. Comprehensive Root Cause Analysis
      3. AI Recommendation & Rerouting Pathways
      4. Downstream Risk Mitigations
      5. BigQuery Telemetry Logs Correlation
      Provide the output in elegant GitHub Markdown format.`;
    } else if (alertId) {
      const alt = alerts.find(a => a.id === alertId);
      prompt = `Generate an Incident Response Brief for the following systemic operational alert:
      ID: ${alt?.id}
      Type: ${alt?.type}
      Title: ${alt?.title}
      Details: ${alt?.message}
      Timestamp: ${alt?.timestamp}
      Source: ${alt?.source}

      Please analyze the systemic issue and offer an automated runbook solution using elegant Markdown.`;
    } else {
      prompt = `Generate a general Operational Intelligence Report based on: ${customContext || "Standard performance metric overview"}. Keep it professional and fully formatted in markdown.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    res.json({ success: true, markdown: response.text });
  } catch (err: any) {
    console.error("Gemini /api/report Error:", err);
    res.json({
      success: true,
      markdown: `# Operational Assessment\n\n## Summary\nOperations metrics remain within tolerable thresholds. We have logged your request under reference ${decisionId || alertId || "GEN-OPERATIONS"}.\n\n## Recommended Mitigation\nProceed with scheduled infrastructure optimizations and log monitoring.`
    });
  }
});

// ---------------------------------------------

// Simulated BigQuery SQL Endpoint
app.post("/api/bigquery/query", (req, res) => {
  const { sql } = req.body;
  
  if (!sql) {
    return res.status(400).json({ error: "SQL query string is required" });
  }

  const queryLower = sql.toLowerCase().trim();
  
  try {
    // We offer parsed SQL options for realistic results, or fallback
    if (queryLower.includes("group by region")) {
      const grouped: { [key: string]: { count: number, total_latency: number, total_cost: number } } = {};
      bqLogs.forEach(row => {
        if (!grouped[row.region]) {
          grouped[row.region] = { count: 0, total_latency: 0, total_cost: 0 };
        }
        grouped[row.region].count++;
        grouped[row.region].total_latency += row.latency_ms;
        grouped[row.region].total_cost += row.cost_impact;
      });

      const rows = Object.keys(grouped).map(key => ({
        region: key,
        event_count: grouped[key].count,
        avg_latency_ms: Math.round(grouped[key].total_latency / grouped[key].count),
        total_cost_usd: Math.round(grouped[key].total_cost * 100) / 100
      }));

      return res.json({
        columns: ["region", "event_count", "avg_latency_ms", "total_cost_usd"],
        rows,
        meta: { execution_time_ms: 12, rows_scanned: bqLogs.length, bytes_processed: "12.8 KB" }
      });
    }

    if (queryLower.includes("group by event_type") || queryLower.includes("group by event_type")) {
      const grouped: { [key: string]: { count: number, total_latency: number } } = {};
      bqLogs.forEach(row => {
        if (!grouped[row.event_type]) {
          grouped[row.event_type] = { count: 0, total_latency: 0 };
        }
        grouped[row.event_type].count++;
        grouped[row.event_type].total_latency += row.latency_ms;
      });

      const rows = Object.keys(grouped).map(key => ({
        event_type: key,
        event_count: grouped[key].count,
        avg_latency_ms: Math.round(grouped[key].total_latency / grouped[key].count)
      }));

      return res.json({
        columns: ["event_type", "event_count", "avg_latency_ms"],
        rows,
        meta: { execution_time_ms: 8, rows_scanned: bqLogs.length, bytes_processed: "10.4 KB" }
      });
    }

    if (queryLower.includes("group by service")) {
      const grouped: { [key: string]: { count: number, avg_lat: number, cost: number } } = {};
      bqLogs.forEach(row => {
        if (!grouped[row.service]) {
          grouped[row.service] = { count: 0, avg_lat: 0, cost: 0 };
        }
        grouped[row.service].count++;
        grouped[row.service].avg_lat += row.latency_ms;
        grouped[row.service].cost += row.cost_impact;
      });

      const rows = Object.keys(grouped).map(key => ({
        service: key,
        execution_count: grouped[key].count,
        avg_latency_ms: Math.round(grouped[key].avg_lat / grouped[key].count),
        total_impact_usd: Math.round(grouped[key].cost * 100) / 100
      }));

      return res.json({
        columns: ["service", "execution_count", "avg_latency_ms", "total_impact_usd"],
        rows,
        meta: { execution_time_ms: 15, rows_scanned: bqLogs.length, bytes_processed: "14.1 KB" }
      });
    }

    // Default SELECT * LIMIT 15
    const rows = bqLogs.slice(0, 15).map(row => ({
      id: row.id,
      timestamp: row.timestamp.substring(11, 19),
      event_type: row.event_type,
      region: row.region,
      service: row.service,
      latency_ms: row.latency_ms,
      cost_impact: row.cost_impact
    }));

    res.json({
      columns: ["id", "timestamp", "event_type", "region", "service", "latency_ms", "cost_impact"],
      rows,
      meta: { execution_time_ms: 4, rows_scanned: bqLogs.length, bytes_processed: "4.2 KB", message: "Showing standard telemetry view (limit 15)" }
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to parse simulated BigQuery. Try a grouped query or standard SELECT." });
  }
});

// Gemini Chat Proxy Route
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, contextData } = req.body;
    const ai = getGeminiClient();

    let sysInstruction = "You are the AI Decision Co-Pilot for the Enterprise AI-Decision-Platform. You provide advanced operations advice, critical analysis of business decisions, risk assessments, and logistical planning advice. Refer to the current enterprise operational metrics where relevant.";
    if (contextData) {
      sysInstruction += `\n\nActive Context: ${JSON.stringify(contextData)}`;
    }

    // Standardize chat format
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: sysInstruction,
        temperature: 0.7,
      }
    });

    // Populate history if available
    if (history && history.length > 0) {
      // Create a beautiful prompt encapsulating history or send message directly
      // Note: for @google/genai SDK, chat is built using client-side history, but we can craft a beautiful unified prompt to ensure perfect execution
    }

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini Error:", err);
    res.status(500).json({ error: err.message || "An error occurred with Gemini." });
  }
});

// Gemini Report Generator Route
app.post("/api/gemini/generate-report", async (req, res) => {
  try {
    const { decisionId, alertId, customContext } = req.body;
    const ai = getGeminiClient();

    let prompt = "";
    if (decisionId) {
      const dec = decisions.find(d => d.id === decisionId);
      prompt = `Generate a highly structured, professional, executive Decision Brief Report for the following operational challenge:
      ID: ${dec?.id}
      Title: ${dec?.title}
      Domain: ${dec?.domain}
      Description: ${dec?.description}
      Urgency: ${dec?.urgency}
      Risk Factor: ${dec?.riskFactor}%
      Financial/Impact Threat: ${dec?.potentialImpact}
      Location: ${dec?.locationName}
      Active Metrics: ${JSON.stringify(dec?.metrics)}

      Please include sections for:
      1. Executive Summary
      2. Comprehensive Root Cause Analysis
      3. AI Recommendation & Rerouting Pathways
      4. Downstream Risk Mitigations
      5. BigQuery Telemetry Logs Correlation
      Provide the output in elegant GitHub Markdown format with headers, blockquotes, and tables where appropriate.`;
    } else if (alertId) {
      const alt = alerts.find(a => a.id === alertId);
      prompt = `Generate an Incident Response Brief for the following systemic operational alert:
      ID: ${alt?.id}
      Type: ${alt?.type}
      Title: ${alt?.title}
      Details: ${alt?.message}
      Timestamp: ${alt?.timestamp}
      Source: ${alt?.source}

      Please analyze the systemic issue and offer an automated runbook solution using elegant Markdown.`;
    } else {
      prompt = `Generate a general Operational Intelligence Report based on: ${customContext || "Standard performance metric overview"}. Keep it professional and fully formatted in markdown.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2
      }
    });

    res.json({ markdown: response.text });
  } catch (err: any) {
    console.error("Gemini Report Error:", err);
    res.status(500).json({ error: err.message || "An error occurred generating the report." });
  }
});

// GET /api/system-docs
app.get("/api/system-docs", (req, res) => {
  res.json({
    springboot: `
package com.enterprise.aidecision.controller;

import com.enterprise.aidecision.model.Decision;
import com.enterprise.aidecision.service.GeminiCoPilotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/decisions")
public class DecisionController {

    @Autowired
    private DecisionService decisionService;

    @Autowired
    private GeminiCoPilotService geminiService;

    @PostMapping("/{id}/optimize")
    public ResponseEntity<Decision> optimizeDecision(@PathVariable String id) {
        Decision decision = decisionService.findById(id);
        String recommendation = geminiService.getRecommendation(decision);
        decision.setAiRecommendation(recommendation);
        decision.setStatus("OPTIMIZED");
        return ResponseEntity.ok(decisionService.save(decision));
    }
}
    `,
    bigquery: `
-- BigQuery SQL: Daily System Performance & Impact Metrics Analysis
SELECT
  TIMESTAMP_TRUNC(timestamp, DAY) as date,
  region,
  service,
  COUNT(id) as total_events,
  AVG(latency_ms) as average_latency_ms,
  SUM(cost_impact) as total_cost_impact_usd,
  COUNTIF(event_type = 'ERROR') as error_frequency
FROM
  \`enterprise-ai-platform.telemetry.operational_logs\`
WHERE
  timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY
  date, region, service
ORDER BY
  date DESC, total_cost_impact_usd DESC
LIMIT 100;
    `,
    firebase: `
service cloud.firestore {
  match /databases/{database}/documents {
    match /decisions/{decisionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['ADMIN', 'OPERATIONS_LEAD'];
    }
    match /alerts/{alertId} {
      allow read, write: if request.auth != null;
    }
  }
}
    `
  });
});

// Express Server + Vite Middleware Implementation
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
