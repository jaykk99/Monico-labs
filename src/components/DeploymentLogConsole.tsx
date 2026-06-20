import React, { useState, useEffect, useRef } from "react";
import { Terminal, Search, Trash2, ArrowDownCircle } from "lucide-react";

interface DeploymentLogConsoleProps {
  logs: string[];
  isBuilding: boolean;
  onClear?: () => void;
}

export default function DeploymentLogConsole({
  logs,
  isBuilding,
  onClear,
}: DeploymentLogConsoleProps) {
  const [filterText, setFilterText] = useState("");
  const [visibleLogsCount, setVisibleLogsCount] = useState(isBuilding ? 0 : logs.length);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Restart streaming if logs change or building state triggers
  useEffect(() => {
    if (isBuilding) {
      setVisibleLogsCount(0);
      const interval = setInterval(() => {
        setVisibleLogsCount((prev) => {
          if (prev < logs.length) {
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 350); // Speed of simulated compilation logs
      return () => clearInterval(interval);
    } else {
      setVisibleLogsCount(logs.length);
    }
  }, [logs, isBuilding]);

  // Scroll to bottom on updates
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleLogsCount]);

  const activeLogs = logs.slice(0, visibleLogsCount);
  const filteredLogs = activeLogs.filter((line) =>
    line.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="bg-black rounded-lg border border-neutral-800 shadow-xl overflow-hidden flex flex-col h-[400px]">
      {/* Console Header */}
      <div className="bg-neutral-900 px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-mono text-neutral-300">
          <Terminal className="h-4 w-4 text-purple-400" />
          <span>Vortex Compiler Console v2.0.1</span>
          {isBuilding && (
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filter logs search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
            <input
              type="text"
              placeholder="Search compilation tags..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-neutral-300 placeholder-neutral-600 rounded-md py-1 pl-7 pr-3 text-[10px] uppercase font-mono w-44 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700"
            />
          </div>

          {onClear && (
            <button
              onClick={onClear}
              className="p-1 hover:text-white text-neutral-500 hover:bg-neutral-800 rounded transition"
              title="Clear Console"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal log list */}
      <div className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-neutral-300 space-y-1.5">
        {filteredLogs.map((logLine, index) => {
          let lineClass = "text-neutral-300";
          
          if (logLine.includes("🎉") || logLine.toLowerCase().includes("successful")) {
            lineClass = "text-emerald-400 font-medium";
          } else if (logLine.includes("[vortex]") || logLine.includes("[vortex-cdn]")) {
            lineClass = "text-neutral-500";
          } else if (logLine.includes("[vite]") || logLine.includes("[next]") || logLine.includes("[compiler]")) {
            lineClass = "text-indigo-400";
          } else if (logLine.toLowerCase().includes("error") || logLine.toLowerCase().includes("failed")) {
            lineClass = "text-rose-400 font-semibold";
          }

          return (
            <div key={index} className={`whitespace-pre-wrap select-all ${lineClass}`}>
              <span className="text-neutral-600 mr-2 select-none">{(index + 1).toString().padStart(2, "0")}</span>
              {logLine}
            </div>
          );
        })}

        {isBuilding && visibleLogsCount < logs.length && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs py-1 animate-pulse">
            <span className="h-1 w-2.5 bg-indigo-400 inline-block animate-bounce"></span>
            <span>Bundling chunks and mapping routing table boundaries...</span>
          </div>
        )}

        {filteredLogs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 py-12 gap-2 selection:bg-transparent">
            <ArrowDownCircle className="h-6 w-6 text-neutral-700 animate-bounce" />
            <span>Console listening for new event triggers...</span>
          </div>
        )}

        <div ref={consoleEndRef} />
      </div>
      
      {/* Console Status Footer */}
      <div className="bg-neutral-950 px-4 py-2 border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-500 font-mono select-none">
        <div>Filtered: {filteredLogs.length} / {activeLogs.length} lines</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
            US-East-1 Edge: ACTIVE
          </span>
          <span>Status: {isBuilding ? "COMPILING" : "IDLE"}</span>
        </div>
      </div>
    </div>
  );
}
