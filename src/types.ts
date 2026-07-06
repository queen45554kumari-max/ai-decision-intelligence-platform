export type UserRole = "EXECUTIVE" | "OPERATIONS_LEAD" | "DATA_ANALYST";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface Decision {
  id: string;
  title: string;
  domain: string;
  description: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactor: number;
  potentialImpact: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESOLVED";
  assignedTo: string;
  createdAt: string;
  coordinates: { lat: number; lng: number };
  locationName: string;
  metrics: { name: string; value: number; unit: string }[];
  history: { timestamp: string; action: string; actor: string; details: string }[];
}

export interface Alert {
  id: string;
  type: "WARNING" | "CRITICAL" | "INFO";
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  coordinates?: { lat: number; lng: number };
}

export interface BigQueryRow {
  id: string;
  timestamp: string;
  event_type: string;
  region: string;
  service: string;
  latency_ms: number;
  cost_impact: number;
}

export interface BigQueryOutput {
  columns: string[];
  rows: any[];
  meta: {
    execution_time_ms: number;
    rows_scanned: number;
    bytes_processed: string;
    message?: string;
  };
}

export interface SystemDocs {
  springboot: string;
  bigquery: string;
  firebase: string;
}

export interface CrimeIncident {
  id: string;
  location: string;
  type: string;
  date: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  latitude: number;
  longitude: number;
}

export interface TrafficCongestion {
  id: string;
  road: string;
  congestion: "NORMAL" | "MODERATE" | "HEAVY" | "CRITICAL";
  speed: number;
  time: string;
}

export interface WeatherCondition {
  location: string;
  condition: string;
  windSpeedKts: number;
  temperatureC: number;
  tempC: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  air_quality: string;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface RecommendationItem {
  id: string;
  title: string;
  type: string;
  confidence: number;
  potentialSavingsUSD: number;
  description: string;
}

export interface CitizenComplaint {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface ReportItem {
  id: string;
  title: string;
  type: "DECISION_BRIEF" | "INCIDENT_RUNBOOK" | "METRIC_AUDIT";
  date: string;
  content: string;
  generatedBy: string;
  summary: string;
  recommendations: string[];
  pdf?: string;
}


