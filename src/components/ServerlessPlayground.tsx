import React, { useState, useEffect } from "react";
import { Play, Terminal, Database, Code, ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import { ServerlessFunction, FunctionExecutionLog } from "../types";

interface ServerlessPlaygroundProps {
  projectId: string;
}

export default function ServerlessPlayground({ projectId }: ServerlessPlaygroundProps) {
  const [functions, setFunctions] = useState<ServerlessFunction[]>([]);
  const [selectedFunc, setSelectedFunc] = useState<ServerlessFunction | null>(null);
  
  // Playground State
  const [requestBodyText, setRequestBodyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [execResult, setExecResult] = useState<FunctionExecutionLog | null>(null);
  const [executionLogs, setExecutionLogs] = useState<FunctionExecutionLog[]>([]);
  
  // Custom Function creation state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFuncName, setNewFuncName] = useState("");
  const [newFuncRoute, setNewFuncRoute] = useState("");
  const [newFuncCode, setNewFuncCode] = useState("");
  const [newFuncDesc, setNewFuncDesc] = useState("");

  // Fetch functions for project
  useEffect(() => {
    fetch(`/api/functions/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch functions");
        return res.json();
      })
      .then((data: ServerlessFunction[]) => { // Explicitly type data as ServerlessFunction[]
        setFunctions(data);
        if (data.length > 0) {
          setSelectedFunc(data); // Select the first function, not the entire array
        } else {
          setSelectedFunc(null);
        }
      })
      .catch((err: unknown) => { // Use unknown for catch block error
        if (err instanceof Error) {
          console.error("Error fetching functions:", err.message);
        } else {
          console.error("Unknown error fetching functions:", err);
        }
      });
  }, [projectId]);

  // Handle selected function change to preset request bodies
  useEffect(() => {
    if (selectedFunc) {
      // Using a function ID or a specific property on the function object would be more robust
      // than a magic string for special behavior. For now, we'll keep the magic string but acknowledge
      // it's a candidate for future refactoring.
      // Refactor: Use a constant or a dedicated property for special function identification.
      const ANALYZE_SENTIMENT_FUNC_NAME = "analyze-sentiment.ts";
      if (selectedFunc.name === ANALYZE_SENTIMENT_FUNC_NAME) { 
        setRequestBodyText(JSON.stringify({ text: "This Vortex cloud deployment portal is absolutely breathtaking! The layouts are so fluid." }, null, 2));
      } else {
        setRequestBodyText(JSON.stringify({ userId: 104, fetchDetails: true }, null, 2));
      }
      setExecResult(null);
      fetchExecLogs(selectedFunc.id);
    }
  }, [selectedFunc]);

  const fetchExecLogs = (funcId: string) => {
    fetch(`/api/functions/logs/${funcId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch execution logs");
        return res.json();
      })
      .then((data) => setExecutionLogs(data))
      .catch((err: unknown) => { // Use unknown for catch block error
        if (err instanceof Error) {
          console.error("Error fetching execution logs:", err.message);
        } else {
          console.error("Unknown error fetching execution logs:", err);
        }
      });
  };

  const handleRunFunction = async () => {
    if (!selectedFunc) return;

    setIsLoading(true);
    setExecResult(null);

    let parsedBody: any; // Use any as the type of parsedBody is dynamic based on parsing
    try {
      parsedBody = requestBodyText ? JSON.parse(requestBodyText) : {};
    } catch (e: unknown) { // Use unknown for catch block error
      console.error("JSON parsing error:", e instanceof Error ? e.message : e);
      // Explicitly handle JSON parsing error and provide user feedback
      setExecResult({
        id: "error",
        functionId: selectedFunc.id,
        timestamp: new Date().toISOString(),
        status: 400,
        durationMs: 0,
        memoryMb: 0,
        stdout: ["Error: Invalid JSON in request body. Please check your input."],
        responseBody: JSON.stringify({ error: "Invalid JSON in request body" }),
      });
      setIsLoading(false);
      return; // Stop execution if JSON is invalid
    }

    try {
      const response = await fetch("/api/functions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          functionId: selectedFunc.id,
          reqBody: parsedBody,
          reqQuery: {},
        }),
      });

      const data = await response.json();
      setExecResult(data);
      fetchExecLogs(selectedFunc.id);
    } catch (err: unknown) { // Use unknown for catch block error
      console.error("Failed running serverless code:", err instanceof Error ? err.message : err);
      setExecResult({ // Provide some feedback to the user on execution failure
        id: "error",
        functionId: selectedFunc.id,
        timestamp: new Date().toISOString(),
        status: 500,
        durationMs: 0,
        memoryMb: 0,
        stdout: ["Error executing function: " + (err instanceof Error ? err.message : "Unknown error")],
        responseBody: JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFunction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuncName) return;

    try {
      const routeVal = newFuncRoute || `/api/${newFuncName.replace(/\.[a-z]+$/, "").replace(/[^a-z0-9_-]/g, "-")}`;
      const response = await fetch(`/api/functions/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFuncName,
          code: newFuncCode || `export default async function handler(req: Request) {\n  return Response.json({ success: true });\n}`,
          route: routeVal,
          description: newFuncDesc || "Custom serverless route endpoint",
        }),
      });

      if (!response.ok) throw new Error("Failed to create function");
      const data = await response.json();
      setFunctions((prev) => [...prev, data]);
      setSelectedFunc(data);
      setShowAddModal(false);
      setNewFuncName("");
      setNewFuncRoute("");
      setNewFuncCode("");
      setNewFuncDesc("");
    } catch (err: unknown) { // Use unknown for catch block error
      if (err instanceof Error) {
        console.error("Failed to create code endpoint:", err.message);
      } else {
        console.error("Unknown error creating code endpoint:", err);
      }
    }
  };

  const sanitizeOutput = (input: string[]) => {
    // Basic sanitization for rendering in <pre> tags.
    // In a production scenario, a more robust HTML sanitization library should be used.
    // Consider a library like 'dompurify' for robust XSS protection.
    return input.map(line => line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')).join("\n");
  };

  const sanitizeResponseBody = (input: string) => {
    try {
      const parsed = JSON.parse(input);
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If it's not valid JSON, treat it as plain text and sanitize
      // Consider a library like 'dompurify' for robust XSS protection.
      return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Micro-functions directory listing */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 lg:col-span-1 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h4 className="text-xs font-semibold text-neutral-500 tracking-wider uppercase flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            Registered API Routes
          </h4>
          <button
            onClick={() => {
              setNewFuncCode(`export default async function handler(req: Request) {\n  const body = await req.json().catch(() => ({}));\n  \n  return Response.json({\n    deployedBy: "Vortex Serverless Router",\n    status: "online",\n    receivedValue: body\n  });\n}`);
              setShowAddModal(true);
            }}
            className="text-[10px] bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded font-semibold font-mono tracking-wide transition"
          >
            + NEW ROUTE
          </button>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
          {functions.map((fn) => {
            const isActive = selectedFunc?.id === fn.id;
            return (
              <button
                key={fn.id} // Added key prop
                onClick={() => setSelectedFunc(fn)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  isActive
                    ? "bg-purple-950/20 border-purple-500/30 text-white"
                    : "bg-neutral-950/30 border-neutral-800/60 hover:border-neutral-800 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-mono">{fn.name}</span>
                  <span className="text-[10px] font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 uppercase">
                    Edge JS
                  </span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500 truncate">{fn.route}</div>
                <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{fn.description}</p>
              </button>
            );
          })}

          {functions.length === 0 && (
            <div className="text-center py-12 text-neutral-600 text-xs">
              No serverless functions registered for this project. Customize or trigger new endpoints.
            </div>
          )}
        </div>

        {/* Historic invocations audit logs list */}
        {selectedFunc && (
          <div className="pt-4 border-t border-neutral-800/60 space-y-3">
            <h5 className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase">
              Recent Edge Invocations
            </h5>
            <div className="space-y-1.5 max-h-[140px] overflow-auto font-mono text-[10px] leading-relaxed">
              {executionLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center bg-neutral-950 border border-neutral-850 p-2 rounded-lg"
                >
                  <span className="text-neutral-500 truncate max-w-[80px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-neutral-300 font-semibold">{log.durationMs}ms</span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-semibold ${
                      log.status === 200 ? "text-emerald-400 bg-emerald-500/5" : "text-rose-400 bg-rose-500/5"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}

              {executionLogs.length === 0 && (
                <div className="text-center py-6 text-neutral-600 text-[10px]">
                  No executions logged yet in current VM container.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2 & 3. Code preview container and Execution panel */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {selectedFunc ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Left Box: Micro Editor readout */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-semibold text-neutral-200">Microservice Code Source</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">{selectedFunc.route}</span>
                </div>

                <div className="relative">
                  <textarea
                    value={selectedFunc.code}
                    readOnly
                    className="w-full h-[280px] bg-neutral-950 border border-neutral-800/80 rounded-lg p-3 text-[10.5px] text-indigo-400 font-mono focus:outline-none focus:border-neutral-850 leading-normal resize-none selection:bg-indigo-500/25 select-all"
                  />
                  <div className="absolute top-2.5 right-2 text-[9px] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-mono uppercase tracking-wider">
                    Read-Only Source
                  </div>
                </div>
              </div>

              {selectedFunc.name === "analyze-sentiment.ts" && (
                <div className="mt-4 p-3 bg-indigo-950/20 border border-indigo-500/10 text-[10.5px] text-indigo-400 rounded-lg leading-relaxed flex items-start gap-2">
                  <Layers className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <span>This function runs a <strong>live call to the Gemini API</strong> server-side! Submitting values below will evaluate real-time semantics against Gemini models.</span>
                </div>
              )}
            </div>

            {/* Right Box: Live compilation playground triggers */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col shadow-sm justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <span className="text-xs font-semibold text-neutral-200">Edge Execution Suite</span>
                  <span className="text-[10px] font-mono text-neutral-500">Node Isolate environment</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Payload Arguments (JSON)
                  </label>
                  <textarea
                    value={requestBodyText}
                    onChange={(e) => setRequestBodyText(e.target.value)}
                    className="w-full h-28 bg-neutral-950 border border-[#2d2d2d] focus:border-purple-500 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 transition leading-snug resize-none"
                    placeholder="{}"
                  />
                </div>

                <button
                  onClick={handleRunFunction}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                      <span>Booting runtime isolate...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-white" />
                      <span>Execute API Handler</span>
                    </>
                  )}
                </button>
              </div>

              {/* Execution outputs results panel */}
              <div className="mt-6 flex-1 flex flex-col justify-end space-y-4">
                {execResult ? (
                  <div className="space-y-4 bg-neutral-950 border border-neutral-850 p-4 rounded-xl">
                    {/* Execution details */}
                    <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-200">
                        {execResult.status === 200 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        )}
                        <span>HTTP {execResult.status}</span>
                      </div>
                      <div className="flex gap-3 text-[10px] font-mono text-neutral-500">
                        <span>Duration: <strong className="text-neutral-400">{execResult.durationMs}ms</strong></span>
                        <span>Memory: <strong className="text-neutral-400">{execResult.memoryMb}MB</strong></span>
                      </div>
                    </div>

                    {/* Stdout Console logs readout */}
                    <div className="space-y-1">
                      <span className="block text-[9px] uppercase font-bold tracking-wider text-neutral-600 font-mono flex items-center gap-1">
                        <Terminal className="h-3 w-3" />
                        CONTAINER TRACE LOGS (STDOUT)
                      </span>
                      <pre 
                        className="text-[10px] text-neutral-400 font-mono max-h-[75px] overflow-auto bg-neutral-900 border border-neutral-850/60 p-2 rounded leading-relaxed select-all"
                        dangerouslySetInnerHTML={{ __html: sanitizeOutput(execResult.stdout) }}
                      />
                    </div>

                    {/* Returning JSON Payload */}
                    <div className="space-y-1">
                      <span className="block text-[9px] uppercase font-bold tracking-wider text-neutral-600 font-mono">
                        RESPONSE PAYLOAD (JSON)
                      </span>
                      <pre 
                        className="text-[10.5px] text-emerald-400 font-mono max-h-[110px] overflow-auto bg-neutral-900 border border-neutral-850/60 p-2 rounded leading-snug select-all"
                        dangerouslySetInnerHTML={{ __html: sanitizeResponseBody(execResult.responseBody) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-800 rounded-xl p-8 text-center text-neutral-600 text-xs py-10">
                    <Database className="h-7 w-7 text-neutral-750 mx-auto mb-2 animate-bounce" />
                    <span>Run the function handler to inspect edge compiler logs.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-neutral-500 flex-1 flex flex-col justify-center items-center">
            <ShieldAlert className="h-8 w-8 text-neutral-700 mb-2" />
            <span>Select/create an active Edge function API directory.</span>
          </div>
        )}
      </div>

      {/* Create custom edge function Modal form popup */}
      {showAddModal && (
        <div id="add-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wide">Scaffold Serverless Edge Endpoint</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-white transition-all text-sm font-mono hover:bg-neutral-800 p-1 rounded"
              >
                CLOSE
              </button>
            </div>

            <form onSubmit={handleCreateFunction} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    File Name (e.g. users.ts)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="users.ts"
                    value={newFuncName}
                    onChange={(e) => {
                      setNewFuncName(e.target.value);
                      const base = e.target.value.toLowerCase().replace(/\.[a-z]+$/, "").replace(/[^a-z0-9_-]/g, "-");
                      setNewFuncRoute(`/api/${base}`);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                    Endpoint URI Route
                  </label>
                  <input
                    type="text"
                    placeholder="/api/users"
                    value={newFuncRoute}
                    onChange={(e) => setNewFuncRoute(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-300 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Fetch, query, or parse database entries dynamically from context"
                  value={newFuncDesc}
                  onChange={(e) => setNewFuncDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                  Handler Code (ES Module typescript structure)
                </label>
                <textarea
                  required
                  value={newFuncCode}
                  onChange={(e) => setNewFuncCode(e.target.value)}
                  className="w-full h-44 bg-neutral-950 border border-[#2d2d2d] focus:border-purple-500 rounded-lg p-3 text-[11px] text-indigo-400 font-mono focus:outline-none leading-normal resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md mt-2"
              >
                Compile and Register Route
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
