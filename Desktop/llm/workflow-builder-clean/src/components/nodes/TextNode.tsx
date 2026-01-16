"use client";

import React, { useState } from "react";
import { useWorkflowStore } from "@/components/store/workflowStore";
import { Handle, Position } from "@xyflow/react";

interface TextNodeProps {
  id: string | number;
  data: { text: string; runId?: string };
}

export default function TextNode({ id, data }: TextNodeProps) {
  // ✅ Hooks MUST be called here
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [text, setText] = useState(data.text || "");

  const saveText = async () => {
    updateNodeData(id, { text });

    if (!data.runId) return;


    await fetch("/api/node-execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
           runId: useWorkflowStore.getState().currentRunId,
                          workflowId: useWorkflowStore.getState().currentWorkflowId,
                        nodeId: Number(id),
        nodeType: "TextNode",
        status: "success",
        executionTime: 0,
        outputs: { text },
      }),
    });
  };

  return (
    <div
      style={{
        padding: "10px",
        background: "#fff",
        border: "2px solid #ffa500",
        borderRadius: "5px",
        minWidth: "150px",
      }}
    >
      {/* Target handle for incoming edges */}
      <Handle type="target" position={Position.Top} style={{ background: "#ffa500" }} />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={{ fontSize: "10px", color: "#888", fontWeight: "bold" }}>TEXT INPUT</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={saveText} // Save when input loses focus
          className="nodrag"
          style={{
            border: "none",
            outline: "none",
            marginTop: "5px",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Source handle for outgoing edges */}
      <Handle type="source" position={Position.Bottom} style={{ background: "#ffa500" }} />
    </div>
  );
}
