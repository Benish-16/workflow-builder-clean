"use client";
import React, { useEffect, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "@/components/store/workflowStore";

interface LLMNodeProps {
  id: string;
  data: any;
}

export function LLMNode({ id, data }: LLMNodeProps) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const setNodeDbId = useWorkflowStore((state) => state.setNodeDbId);

  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const saveNode = async () => {
      if (!data.workflowId) return;

      try {
        const res = await fetch("/api/nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowId: data.workflowId,
            nodeType: "LLMNode",
          }),
        });

        const nodeFromDB = await res.json();
        setNodeDbId(id, nodeFromDB.id); // save DB mapping
        setSaving(false);
      } catch (err) {
        console.error("Failed to save node:", err);
        updateNodeData(id, { response: "❌ Failed to save node to DB" });
      }
    };

    saveNode();
  }, [id, data.workflowId, setNodeDbId, updateNodeData]);

  const runNode = useWorkflowStore((state) => state.runNode);

  return (
    <div className="p-4 bg-white border-2 border-purple-500 rounded-xl w-64 shadow-lg transition-all hover:shadow-purple-100">
      <div className="text-[10px] font-black text-purple-600 mb-3 text-center uppercase tracking-widest">
        Gemini AI Engine
      </div>

      {/* Input Handles */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative flex items-center justify-between">
          <Handle
            type="target"
            position={Position.Left}
            id="system_prompt"
            className="!w-3 !h-3 !bg-purple-300 border-2 border-white"
          />
          <span className="text-[9px] font-bold text-gray-400 ml-4 uppercase">
            System
          </span>
        </div>

        <div className="relative flex items-center justify-between">
          <Handle
            type="target"
            position={Position.Left}
            id="user_message"
            className="!w-3 !h-3 !bg-purple-600 border-2 border-white"
          />
          <span className="text-[9px] font-bold text-purple-600 ml-4 uppercase">
            Prompt
          </span>
        </div>

        <div className="relative flex items-center justify-between">
          <Handle
            type="target"
            position={Position.Left}
            id="images"
            className="!w-3 !h-3 !bg-purple-400 border-2 border-white"
          />
          <span className="text-[9px] font-bold text-gray-400 ml-4 uppercase">
            Media
          </span>
        </div>
      </div>

      <button
        disabled={saving}
        onClick={() => runNode(id)}
        className={`w-full bg-purple-600 text-white font-bold text-[10px] py-2.5 rounded-lg hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200 uppercase tracking-tighter ${
          saving ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Execute Node
      </button>

      {data.response && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap font-medium leading-relaxed shadow-inner">
          {data.response}
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-purple-600 border-2 border-white"
      />
    </div>
  );
}
