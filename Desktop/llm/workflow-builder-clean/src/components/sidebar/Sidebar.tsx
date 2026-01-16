"use client";

import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "@/components/store/workflowStore";

type NodeType = "text" | "image" | "llm" | "upload" | "crop" | "frameExtract";

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  
  // Destructure the store
  const nodes = useWorkflowStore((state) => state.nodes);
  const setNodes = useWorkflowStore((state) => state.setNodes);

  // 1. Handle Hydration: Only render content once mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const addNode = (type: NodeType) => {
    // Safety check to ensure setNodes is available
    if (typeof setNodes !== "function") return;

    const newNode = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: { 
        x: Math.random() * 200 + 50, 
        y: Math.random() * 200 + 50 
      }, 
      data: { 
        label: `${type.toUpperCase()} Node`,
        text: "",
        url: "",
        params: type === "crop" ? { x: 0, y: 0, w: 200, h: 200 } : {},
         runId: useWorkflowStore.getState().currentRunId,         // <-- add this
      workflowId: useWorkflowStore.getState().currentWorkflowId // <-- and this
      },
    };

    setNodes([...nodes, newNode]);
  };

  // Reusable Tailwind Class string
  const btnBase = "p-[10px] text-white rounded-[6px] font-medium text-[13px] text-left transition-all duration-200 shadow-sm hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0";

  // Prevent hydration error: return a placeholder of the same width during SSR
  if (!mounted) {
    return <div className="w-64 border-r bg-gray-50 h-screen shadow-sm" />;
  }

  return (
    <div className="w-64 border-r bg-gray-50 p-4 flex flex-col gap-3 h-screen shadow-sm overflow-y-auto">
      <h2 className="font-bold text-lg mb-2 text-gray-700">Components</h2>
      
      {/* --- STANDARD NODES --- */}
      <button onClick={() => addNode("text")} className={`${btnBase} bg-blue-500`}>
        + Text Input
      </button>

      <button onClick={() => addNode("image")} className={`${btnBase} bg-green-500`}>
        + Image URL
      </button>

      <button onClick={() => addNode("llm")} className={`${btnBase} bg-purple-600`}>
        + Gemini LLM
      </button>

      <div className="my-2 border-t border-gray-200" />
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Media Tools</h3>

      {/* --- SPECIALTY NODES --- */}
      <button onClick={() => addNode("upload")} className={`${btnBase} bg-orange-500`}>
        + File Upload
      </button>

      <button onClick={() => addNode("crop")} className={`${btnBase} bg-indigo-500`}>
        + Crop Image
      </button>

      <button onClick={() => addNode("frameExtract")} className={`${btnBase} bg-slate-700`}>
        + Extract Frame
      </button>
      
      <div className="mt-auto pt-4 border-t text-[10px] uppercase font-semibold text-gray-400">
        Canvas Stats: {nodes.length} Nodes
      </div>
    </div>
  );
}