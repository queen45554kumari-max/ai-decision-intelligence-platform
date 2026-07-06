import React, { useState } from "react";
import { UserRole, UserSession } from "../types";
import { Shield, Key, Eye, EyeOff, Terminal, Cpu, User as UserIcon, Mail, Fingerprint, Lock, Tag } from "lucide-react";
import { motion } from "motion/react";
import { loginUser, registerUser } from "../api";

interface AuthScreenProps {
  onLogin: (session: UserSession) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");
  
  // Login fields
  const [email, setEmail] = useState("ops.director@enterprise.com");
  const [password, setPassword] = useState("password");
  const [selectedRole, setSelectedRole] = useState<UserRole>("OPERATIONS_LEAD");
  
  // Register fields
  const [registerId, setRegisterId] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("OPERATIONS_LEAD");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const session = await loginUser({
        email,
        password,
        role: selectedRole
      });
      onLogin(session);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate Station Workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setErrorMessage("Please fill in all required credentials.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    try {
      const res = await registerUser({
        id: registerId.trim() || undefined,
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        role: registerRole
      });
      
      setSuccessMessage(`Station authorized successfully for ${res.user.name}!`);
      // Prefill sign in form and switch mode
      setEmail(res.user.email);
      setPassword(registerPassword);
      setSelectedRole(res.user.role);
      setMode("LOGIN");
      
      // Reset registration form inputs
      setRegisterId("");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Operator registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolesConfig = [
    {
      id: "OPERATIONS_LEAD" as UserRole,
      title: "Operations Lead",
      desc: "Full clearance. Can authorize reroutings, allocate budgets, and execute incident mitigations.",
      color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400 focus:ring-emerald-500"
    },
    {
      id: "DATA_ANALYST" as UserRole,
      title: "BigQuery Analyst",
      desc: "Clearance for SQL sandboxes, metrics modeling, and automated report compilation.",
      color: "border-sky-500/30 bg-sky-500/5 text-sky-400 focus:ring-sky-500"
    },
    {
      id: "EXECUTIVE" as UserRole,
      title: "Executive Partner",
      desc: "Read-only global operational summary, high-level impact analysis, and report access.",
      color: "border-amber-500/30 bg-amber-500/5 text-amber-400 focus:ring-amber-500"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative p-4 overflow-hidden font-sans">
      {/* Visual Design Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(51,65,85,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Top Branding Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-mono mb-4">
            <Cpu className="w-3 h-3 animate-pulse" />
            SECURE INTEGRATED GATEWAY
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center justify-center gap-2">
            AI DECISION PLATFORM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Decision Intelligence, Real-time Logistics & User Management
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 mb-6 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("LOGIN");
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center font-semibold transition-all border-b-2 ${
              mode === "LOGIN" 
                ? "text-blue-400 border-blue-500 bg-blue-500/5" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            STATION SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("REGISTER");
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center font-semibold transition-all border-b-2 ${
              mode === "REGISTER" 
                ? "text-blue-400 border-blue-500 bg-blue-500/5" 
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            REGISTER OPERATOR
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono">
            {successMessage}
          </div>
        )}

        {mode === "LOGIN" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Operator Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Operator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  placeholder="name@enterprise.com"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                  Station Key (Password)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED SHIELD</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  placeholder="Enter key"
                />
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Preset Roles / Clearance Level selector */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Preset Clearance Level
              </label>
              <div className="grid grid-cols-1 gap-2">
                {rolesConfig.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      if (role.id === "OPERATIONS_LEAD") setEmail("ops.director@enterprise.com");
                      else if (role.id === "DATA_ANALYST") setEmail("analyst.bq@enterprise.com");
                      else setEmail("executive.board@enterprise.com");
                    }}
                    className={`flex items-start text-left p-3 rounded-xl border transition-all duration-150 ${
                      selectedRole === role.id 
                        ? "border-blue-500/50 bg-blue-500/5" 
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                    }`}
                  >
                    <div className="pt-0.5 pr-3">
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        selectedRole === role.id ? "border-blue-400" : "border-slate-700"
                      }`}>
                        {selectedRole === role.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-100">{role.title}</span>
                        <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded ${
                          role.id === "OPERATIONS_LEAD" ? "bg-emerald-500/10 text-emerald-400" :
                          role.id === "DATA_ANALYST" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {role.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                        {role.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono font-medium py-3 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  VERIFYING CREDENTIALS...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  AUTHENTICATE STATION
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Operator Station ID (id) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                  Operator Station ID (id)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">OPTIONAL // AUTO-GENERATE</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={registerId}
                  onChange={(e) => setRegisterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  placeholder="e.g. usr-004"
                />
                <Fingerprint className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Operator Full Name (name) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Operator Full Name (name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="e.g. Rachel Adams"
                />
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Operator Email (email) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Operator Email (email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  placeholder="e.g. r.adams@enterprise.com"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Security Key (password) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Security Key (password)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-10 pr-10 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
                  placeholder="Choose security password"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Clearance selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
                Assign Station Clearance Level (role)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {rolesConfig.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => setRegisterRole(role.id)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      registerRole === role.id 
                        ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                        : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] font-bold tracking-tight">{role.title.split(" ")[0]}</div>
                    <div className="text-[8px] font-mono mt-0.5 uppercase tracking-wide">{role.id.split("_")[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Register Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-mono font-medium py-3 px-4 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  COMMITTING WORKSPACE OPERATOR...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  AUTHORIZE & DEPLOY ACCOUNT
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>

      {/* Footer System Specs */}
      <div className="mt-8 text-center text-[10px] font-mono text-slate-600 flex flex-col gap-1 z-10">
        <div>SPRING SECURITY v6.2.2 // NODE INTEGRATED SERVER PORT 3000</div>
        <div>STATION ID CREDENTIAL SCHEMAS: id // name // email // password // role</div>
      </div>
    </div>
  );
}
