"use client";

import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "@/components/store/workflowStore";

export function FrameExtractNode({ id, data }: any) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const [timestamp, setTimestamp] = useState("00:00:01");

  const handleExtract = async () => {
    const mediaUrl = data.input_media || data.inputUrl || data.url;
console.log("media", mediaUrl );
    if (!mediaUrl) {
      updateNodeData(id, { response: "❌ Connect a video source" });
      return;
    }

    updateNodeData(id, { response: "⏳ Extracting frame..." });

    try {
      const runId = useWorkflowStore.getState().currentRunId;
      const workflowId = useWorkflowStore.getState().currentWorkflowId;

      /* 1️⃣ FFmpeg extraction */
      const extractRes = await fetch("/api/media/frame-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl, timestamp }),
      });

      const extractData = await extractRes.json();

      if (!extractRes.ok || !extractData.imageUrl) {
        throw new Error(extractData.error || "Frame extraction failed");
      }

      const imageUrl = extractData.imageUrl;
      console.log(extractData.imageUrl);
   
      /* 2️⃣ Log execution */
      await fetch("/api/node-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId: Number(id),
           runId: useWorkflowStore.getState().currentRunId,
           workflowId: useWorkflowStore.getState().currentWorkflowId,
          nodeType: "frameExtract",
          status: "success",
          inputs: { mediaUrl, timestamp },
          outputs: { imageUrl },
          executionTime: 0,
        }),
      });

      /* 3️⃣ Update canvas */
      updateNodeData(id, {
         outputUrl: imageUrl,
        response: "✅ Frame extracted",
      });

    } catch (err: any) {
      console.error("FrameExtract error:", err);
      updateNodeData(id, {
        response: "❌ Extraction failed",
      });
    }
  };

  return (
    <div className="bg-white border-2 border-slate-300 p-3 rounded-lg w-52 shadow">
      <Handle type="target" position={Position.Top} id="input_media" />

      <div className="text-[10px] font-bold mb-2">🎬 Frame Extract</div>

      <input
        value={timestamp}
        onChange={(e) => setTimestamp(e.target.value)}
        className="border p-1 text-xs rounded w-full"
        placeholder="00:00:01"
      />

      <button
        onClick={handleExtract}
        className="mt-2 bg-black text-white text-[10px] py-1 rounded"
      >
        RUN
      </button>

      {data.response && (
        <div className="text-[9px] mt-2 text-blue-600">{data.response}</div>
      )}

      <Handle type="source" position={Position.Bottom} id="output_image" />
    </div>
  );
}
