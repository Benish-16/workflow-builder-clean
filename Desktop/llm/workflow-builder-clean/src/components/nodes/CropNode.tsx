"use client";
import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react"; 
import { useWorkflowStore } from "@/components/store/workflowStore";

export function CropNode({ id, data }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const nodes = useWorkflowStore((state) => state.nodes);

  const activeUrl = data.inputUrl || data.url || data.outputUrl;

  // Crop state
  const [xPercent, setXPercent] = useState(0);
  const [yPercent, setYPercent] = useState(0);
  const [widthPercent, setWidthPercent] = useState(100);
  const [heightPercent, setHeightPercent] = useState(100);

  const runCrop = async () => {
    if (!activeUrl) return alert("No media detected!");

    const currentNode = nodes.find((n) => n.id === id);
    const currentNodeOrder = currentNode?.data?.order ?? 0;

    updateNodeData(id, { response: "⏳ Cropping image..." });

    try {
      // 1️⃣ Call server API to crop image
      const cropRes = await fetch("/api/media/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: activeUrl,
          xPercent,
          yPercent,
          widthPercent,
          heightPercent
        })
      });

      const cropData = await cropRes.json();
      if (!cropRes.ok || !cropData.croppedUrl) {
        throw new Error(cropData.error || "Crop failed");
      }

      const croppedUrl = cropData.croppedUrl;
      console.log(croppedUrl );

      // 2️⃣ Update node execution
      await fetch("/api/node-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: useWorkflowStore.getState().currentRunId,
          workflowId: useWorkflowStore.getState().currentWorkflowId,
          nodeId: Number(id),
          nodeType: "CropNode",
          status: "success",
          order: currentNodeOrder,
          inputs: { imageUrl: activeUrl, xPercent, yPercent, widthPercent, heightPercent },
          outputs: { outputUrl: croppedUrl, mediaType: "image" }
        })
      });

      // 3️⃣ Update local node
      updateNodeData(id, {
        outputUrl: croppedUrl,
        response: "✅ Image cropped successfully",
        mediaType: "image"
      });

    } catch (err: any) {
      console.error("CropNode error:", err);
      updateNodeData(id, { response: "❌ Crop failed" });
    }
  };

  return (
    <div className="bg-purple-50 p-3 border-2 border-purple-400 rounded shadow-md w-56 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-400" />
      
      <div className="text-xs font-bold mb-1 text-purple-700 uppercase">Image Cropper</div>

      <div className="flex flex-col gap-1 mb-2">
        <input
          type="number"
          value={xPercent}
          onChange={(e) => setXPercent(Number(e.target.value))}
          placeholder="X % (0-100)"
          className="border p-1 text-xs rounded w-full"
        />
        <input
          type="number"
          value={yPercent}
          onChange={(e) => setYPercent(Number(e.target.value))}
          placeholder="Y % (0-100)"
          className="border p-1 text-xs rounded w-full"
        />
        <input
          type="number"
          value={widthPercent}
          onChange={(e) => setWidthPercent(Number(e.target.value))}
          placeholder="Width % (0-100)"
          className="border p-1 text-xs rounded w-full"
        />
        <input
          type="number"
          value={heightPercent}
          onChange={(e) => setHeightPercent(Number(e.target.value))}
          placeholder="Height % (0-100)"
          className="border p-1 text-xs rounded w-full"
        />
      </div>

      <div className="mb-2 h-24 bg-white border border-purple-200 flex items-center justify-center overflow-hidden rounded">
        {activeUrl ? (
          <img src={activeUrl} alt="Preview" className="object-contain w-full h-full" />
        ) : (
          <span className="text-[10px] text-purple-300 italic text-center px-2">
            Waiting for input...
          </span>
        )}
      </div>

      <button 
        onClick={runCrop} 
        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold py-2 rounded transition-all"
      >
        EXECUTE CROP
      </button>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-400" />
      {data.response && (
        <div className="text-[9px] mt-2 text-blue-600">{data.response}</div>
      )}
    </div>
  );
}
