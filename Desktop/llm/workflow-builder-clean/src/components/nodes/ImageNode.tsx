"use client";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "@/components/store/workflowStore";

export default function ImageNode({ id, data }: any) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <div className="p-3 bg-white border-2 border-green-500 rounded-lg shadow-md w-48">
      <div className="text-[10px] font-bold text-green-600 mb-2">🖼️ IMAGE INPUT</div>
      <input 
        type="text" 
        placeholder="Paste image URL..."
        className="w-full text-[10px] p-1 border rounded mb-2"
        onChange={(e) => updateNodeData(id, { url: e.target.value })}
      />
      {data.url && (
        <img src={data.url} alt="preview" className="w-full h-20 object-cover rounded border" />
      )}
      <Handle type="source" position={Position.Right} id="image_output" />
    </div>
  );
}
