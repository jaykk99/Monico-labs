import React, { useState } from "react";
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink, ShieldCheck, Copy, Check } from "lucide-react";

interface InteractivePreviewFrameProps {
  deploymentId: string;
  previewUrl: string;
  projectName: string;
}

export default function InteractivePreviewFrame({
  deploymentId,
  previewUrl,
  projectName,
}: InteractivePreviewFrameProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [frameKey, setFrameKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const reloadFrame = () => {
    setFrameKey((prev) => prev + 1);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute corresponding iframe display widths
  let frameWidthClass = "w-full";
  if (deviceMode === "tablet") {
    frameWidthClass = "w-[680px] max-w-full";
  } else if (deviceMode === "mobile") {
    frameWidthClass = "w-[360px] max-w-full";
  }

  // Live sandbox address serving directly from the custom endpoint
  const sandboxUrl = `/api/preview/${deploymentId}`;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Visual Window Header */}
      <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        {/* URL Bar Mockup */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          {/* Traffic Lights mockup */}
          <div className="flex gap-1.5 select-none">
            <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block pointer-events-none"></span>
            <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block pointer-events-none"></span>
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block pointer-events-none"></span>
          </div>

          <div className="flex-1 max-w-md bg-neutral-900 border border-neutral-800/80 px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 text-xs text-neutral-400 font-mono select-all">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span className="truncate text-neutral-200">{previewUrl || sandboxUrl}</span>
          </div>
        </div>

        {/* Device Controls */}
        <div className="flex items-center gap-4">
          <div className="flex bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-1.5 rounded-md transition ${
                deviceMode === "desktop"
                  ? "bg-neutral-800 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode("tablet")}
              className={`p-1.5 rounded-md transition ${
                deviceMode === "tablet"
                  ? "bg-neutral-800 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`p-1.5 rounded-md transition ${
                deviceMode === "mobile"
                  ? "bg-neutral-800 text-purple-400"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-neutral-800 select-none"></div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={copyUrl}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition flex items-center gap-1 text-xs font-mono"
              title="Copy URL"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={reloadFrame}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition"
              title="Reload Frame"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <a
              href={sandboxUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition flex items-center"
              title="Open full page preview"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Actual IFrame Canvas Frame Area */}
      <div className="bg-neutral-950 flex-1 min-h-[450px] flex justify-center items-center overflow-auto p-4 transition-all duration-300">
        <div
          className={`h-[450px] border border-neutral-850 bg-neutral-900 rounded-lg shadow-inner overflow-hidden transition-all duration-300 ${frameWidthClass}`}
        >
          <iframe
            key={frameKey}
            src={sandboxUrl}
            title="Vortex Dynamic Micro Deployment Live Preview"
            className="w-full h-full bg-neutral-900"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
