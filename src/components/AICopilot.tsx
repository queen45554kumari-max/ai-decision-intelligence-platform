import { useState, useRef, useEffect } from "react";
import { Decision } from "../types";
import { Sparkles, Send, Brain, Bot, User, Trash2, Anchor, HelpCircle, ArrowRight } from "lucide-react";
import { sendGeminiChatMessage } from "../api";
import { motion, AnimatePresence } from "motion/react";

interface AICopilotProps {
  decisions: Decision[];
  anchoredCase: Decision | null;
  onSelectAnchor: (decision: Decision | null) => void;
}

interface Message {
  id: string;
  sender: "USER" | "GEMINI";
  text: string;
  timestamp: string;
}

export default function AICopilot({ decisions, anchoredCase, onSelectAnchor }: AICopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "GEMINI",
      text: "Greetings. I am your Gemini-powered Decision Co-Pilot. I am synchronized with live BigQuery telemetry logs, regional energy grid sensors, and maritime shipping queues.\n\nSelect or anchor a specific Case File below to start contextual risk analysis, or ask general operations planning questions.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const prebuiltQueries = [
    { label: "Conduct Risk Profile", text: "Evaluate risk factor, urgency metrics and potential financial liability. List 3 distinct operational mitigation pathways." },
    { label: "Optimize Asset Routing", text: "Propose an optimal cargo rerouting matrix based on maritime latency queues and weather patterns." },
    { label: "Draft Internal Bulletin", text: "Draft a high-level incident notification bulletin for corporate executives explaining the root cause and mitigation steps." }
  ];

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "USER",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputText("");
    setIsLoading(true);

    try {
      // Package context
      const contextData = anchoredCase ? {
        caseId: anchoredCase.id,
        title: anchoredCase.title,
        domain: anchoredCase.domain,
        description: anchoredCase.description,
        urgency: anchoredCase.urgency,
        riskFactor: anchoredCase.riskFactor,
        metrics: anchoredCase.metrics,
        potentialImpact: anchoredCase.potentialImpact,
        location: anchoredCase.locationName
      } : null;

      const aiResponse = await sendGeminiChatMessage(textToSend, contextData);

      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: "GEMINI",
        text: aiResponse,
        timestamp: new Date().toISOString()
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        sender: "GEMINI",
        text: `⚠️ SYSTEMS EXCEPTION: Failed to contact Gemini Core. Details: ${err.message || "Unknown error."}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-1",
        sender: "GEMINI",
        text: "Session reset. Enter a query or anchor an operational scenario to begin contextual modeling.",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
      {/* Context Anchoring Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-blue-400" />
              Active Context Anchor
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Anchoring a Case File injects its sensor values directly into Gemini's prompt memory.
            </p>
          </div>

          {/* Selector dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-mono block">ANCHORED INCIDENT</label>
            <select
              value={anchoredCase?.id || ""}
              onChange={(e) => {
                const dec = decisions.find(d => d.id === e.target.value);
                onSelectAnchor(dec || null);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs text-white p-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- No Active Anchor --</option>
              {decisions.map(d => (
                <option key={d.id} value={d.id}>
                  [{d.id}] {d.title.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Anchored Case Display Card */}
          {anchoredCase ? (
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-blue-400 font-semibold">{anchoredCase.id}</span>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-mono uppercase">
                  {anchoredCase.domain}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug">{anchoredCase.title}</h4>
              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono space-y-1">
                <div>Risk: <span className="text-amber-400 font-bold">{anchoredCase.riskFactor}%</span></div>
                <div>Urgency: <span className="text-rose-400 font-bold">{anchoredCase.urgency}</span></div>
              </div>
              <button
                onClick={() => onSelectAnchor(null)}
                className="w-full text-center text-[10px] font-mono text-slate-500 hover:text-slate-300 pt-1 block"
              >
                [REMOVE ANCHOR]
              </button>
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-[11px] text-slate-600">
              No active scenario context. Gemini will answer general corporate planning questions.
            </div>
          )}
        </div>

        {/* Prebuilt Directives */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Operations Library
          </h3>
          <div className="flex flex-col gap-1.5">
            {prebuiltQueries.map((query) => (
              <button
                key={query.label}
                onClick={() => handleSendMessage(query.text)}
                disabled={isLoading}
                className="text-left bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 p-2.5 rounded-lg text-[11px] text-slate-300 transition-colors duration-150 flex items-center justify-between group"
              >
                <span>{query.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-800 rounded-xl h-[520px] overflow-hidden">
        {/* Header Console */}
        <div className="bg-slate-900/60 p-3 px-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="w-4.5 h-4.5 text-blue-400" />
            <span className="text-xs font-bold text-white font-mono uppercase">Gemini Decisions Engine v3.5-Flash</span>
          </div>
          <button
            onClick={clearChat}
            className="text-slate-500 hover:text-slate-300 font-mono text-[10px] flex items-center gap-1 p-1 bg-slate-950/40 border border-slate-800 rounded px-2"
          >
            <Trash2 className="w-3 h-3 text-slate-500" />
            RESET CONSOLE
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isAI = msg.sender === "GEMINI";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isAI ? "" : "ml-auto flex-row-reverse"}`}
              >
                <div className={`p-2 rounded-lg h-8.5 w-8.5 flex items-center justify-center border shrink-0 ${
                  isAI ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800 border-slate-700 text-slate-200"
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isAI 
                    ? "bg-slate-900/40 border border-slate-800 text-slate-200" 
                    : "bg-blue-600 text-white"
                }`}>
                  {/* Clean text replacement of markdown to keep formatting pristine */}
                  <div className="whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-md animate-pulse">
              <div className="p-2 rounded-lg h-8.5 w-8.5 flex items-center justify-center border bg-blue-500/10 border-blue-500/20 text-blue-400 shrink-0">
                <Brain className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span>Modeling operational vectors with Gemini...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900/20 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder={anchoredCase ? `Ask Gemini about [${anchoredCase.id}] ${anchoredCase.title}...` : "Ask a general decision query..."}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white py-2.5 px-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white p-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
