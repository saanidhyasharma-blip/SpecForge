"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "validation" | "execution">("schema");
  const [result, setResult] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setApiError(null);

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
    console.log(`[SpecForge] Dispatching payload to ${apiUrl}/run...`);
    console.log(`[SpecForge] Prompt: "${prompt}"`);

    try {
      const response = await fetch(`${apiUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
         throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("[SpecForge] Backend connection error trapped:", error);
      setApiError("Something went wrong. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050B14] text-slate-200 font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-[100%] opacity-50 pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full opacity-60 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full opacity-50 pointer-events-none mix-blend-screen" />

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-3xl w-full text-center mt-12 mb-16 space-y-6"
      >
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-sm pb-2">
          Build apps with AI
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
          Describe your idea in pure language and automatically generate a validated, full-stack architectural system.
        </p>
      </motion.div>

      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 max-w-3xl w-full group"
      >
        <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-blue-500/50 rounded-3xl blur-[14px] opacity-40 group-hover:opacity-70 group-hover:blur-[24px] transition-all duration-700"></div>
        <div className="relative bg-slate-900/40 backdrop-blur-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col space-y-5 transition-all duration-500">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the app you want to build..."
            className="w-full bg-transparent text-xl font-medium text-white placeholder:text-slate-500 resize-none outline-none min-h-[140px] leading-relaxed tracking-wide"
          />
          <div className="flex justify-between items-center pt-5 border-t border-white/10">
            <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-bold flex items-center space-x-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SpecForge Engine</span>
            </span>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-3.5 rounded-full font-bold transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 tracking-wide text-sm flex items-center space-x-2"
            >
              <span>{isGenerating ? "Generating..." : "Generate App"}</span>
              {!isGenerating && <span className="text-lg leading-none mt-[1px]">→</span>}
            </button>
          </div>
        </div>
        {apiError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center shadow-lg"
          >
            <span className="mr-2 text-rose-500 text-lg">⚠</span> {apiError}
          </motion.div>
        )}
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 80 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="max-w-3xl w-full flex flex-col items-center space-y-8 relative z-10"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 blur-xl bg-emerald-500/30 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center space-y-4">
              <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Synthesizing System</p>
              <div className="text-sm font-medium text-slate-400 space-y-3 flex flex-col items-center">
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.5, y: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Extracting design intent</motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.7, y: 0 }} transition={{ delay: 0.8 }} className="flex items-center gap-3"><span className="text-emerald-500 text-lg">✓</span> Scaffolding entity relationships</motion.p>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="text-slate-200 flex items-center gap-3"><span className="animate-spin text-emerald-400 text-lg">⟳</span> Compiling cross-layer schema</motion.p>
                <p className="opacity-20 flex items-center gap-3">Validating endpoints</p>
                <p className="opacity-20 flex items-center gap-3">Heuristic stabilization</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Section */}
      <AnimatePresence>
        {result && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 max-w-4xl w-full mt-24"
          >
            {/* Tabs */}
            <div className="flex space-x-2 border-b border-white/10 mb-6 px-2 relative">
              {(["schema", "validation", "execution"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 py-3.5 text-sm font-bold tracking-wider uppercase transition-colors duration-300 ${
                    activeTab === tab
                      ? "text-emerald-400"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Code Viewer */}
            <div className="bg-slate-900/60 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden group">
              <div className="p-4 bg-black/40 text-xs text-slate-500 border-b border-white/5 flex items-center space-x-2 relative">
                <div className="flex space-x-2 ml-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.2em] text-slate-400">
                  {activeTab}.json
                </div>
              </div>
              <div className="p-6 overflow-auto max-h-[600px]">
                <motion.pre 
                  key={activeTab}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.4 }}
                  className="text-sm leading-[1.7] font-mono text-slate-300"
                >
                  {activeTab === "schema" && JSON.stringify(result.schema || result, null, 2)}
                  {activeTab === "validation" && JSON.stringify(result.originalErrors || { message: "No validation framework errors caught." }, null, 2)}
                  {activeTab === "execution" && JSON.stringify(result.execution || { message: "Execution trace perfectly halted." }, null, 2)}
                </motion.pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
