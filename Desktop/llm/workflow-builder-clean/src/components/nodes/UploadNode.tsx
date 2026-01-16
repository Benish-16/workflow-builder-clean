"use client";
import React, { useState, useEffect } from 'react';
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
import { Handle, Position } from '@xyflow/react';
import { useWorkflowStore } from "@/components/store/workflowStore";
import { Dashboard } from '@uppy/react';

import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

export function UploadNode({ id, data }) {
  const [isMounted, setIsMounted] = useState(false);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  // Helper to distinguish video from image
  const isVideoFile = (name) => {
    const ext = name.split('.').pop().toLowerCase();
    return ['mp4', 'webm', 'mov', 'avi'].includes(ext);
  };

  const [uppy] = useState(() => 
    new Uppy({ 
      debug: true, 
      autoProceed: false,
      restrictions: { maxNumberOfFiles: 1 } 
    }).use(Transloadit, {
      assemblyOptions: {
        params: {
          auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY },
          template_id: process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID
        }
      },
      waitForEncoding: true,
    })
  );

 useEffect(() => {
    setIsMounted(true);

const handleComplete = async (assembly: any) => {
  const allResults = Object.values(assembly.results).flat();
  const resultFile = allResults[0] || assembly.uploads[0];

  if (!resultFile) {
    console.error("❌ No files found in assembly results or uploads.");
    return;
  }

  const url = resultFile.ssl_url;
  const isVideo = isVideoFile(resultFile.name);

  updateNodeData(id, {
    inputUrl: url,
    fileName: resultFile.name,
    mediaType: isVideo ? 'video' : 'image',
    status: 'ready'
  });

  if (!data.runId || !data.workflowId) {
    console.error("Missing runId or workflowId for logging!");
    return;
  }

  try {
    const res = await fetch("/api/node-execution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
     nodeId: Number(id),
  runId: useWorkflowStore.getState().currentRunId,
  workflowId: useWorkflowStore.getState().currentWorkflowId,
             // keep it string
  nodeType: "UploadNode",
  status: "success",
  executionTime: 0,
  inputs: { fileName: resultFile.name },
  outputs: { url, mediaType: isVideo ? "video" : "image" },
}),

    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ NodeExecution API failed:", result.error);
    }
  } catch (err: any) {
    console.error("❌ NodeExecution fetch error:", err.message);
  }
};

    // Listen for the assembly completion
    uppy.on('transloadit:complete', handleComplete);
    
    // Backup: standard upload success
    uppy.on('upload-success', (file, response) => {
       console.log("✅ Upload check:", file.name);
    });

    return () => {
      uppy.off('transloadit:complete', handleComplete);
      uppy.off('upload-success');
    };
  }, [id, updateNodeData, uppy]);

  if (!isMounted) return <div className="p-4 bg-gray-100 rounded shadow">Loading...</div>;

  return (
    <div className="bg-white border-2 border-orange-500 rounded-xl shadow-2xl overflow-hidden w-[320px]">
      <div className="bg-orange-500 p-2 text-white text-[10px] font-bold uppercase tracking-widest text-center flex justify-between items-center px-4">
        <span>Media Assets</span>
        {data.mediaType && (
          <span className="bg-white text-orange-600 px-2 py-0.5 rounded-full text-[8px]">
            {data.mediaType.toUpperCase()}
          </span>
        )}
      </div>

      <div className="p-2">
        {/* If no file uploaded, show Dashboard; otherwise show preview */}
        {!data.inputUrl ? (
          <Dashboard uppy={uppy} width="100%" height={200} hideUploadButton={false} />
        ) : (
          <div className="relative group">
            <div className="h-40 bg-gray-900 flex items-center justify-center rounded overflow-hidden border border-gray-200">
              {data.mediaType === 'video' ? (
                <video src={data.inputUrl} muted className="w-full h-full object-contain" />
              ) : (
                <img src={data.inputUrl} alt="Preview" className="w-full h-full object-contain" />
              )}
            </div>
            <button 
              onClick={() => updateNodeData(id, { inputUrl: null, mediaType: null })}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              RESET
            </button>
          </div>
        )}
      </div>

      <div className="p-2 text-center border-t border-gray-100">
        <p className="text-[9px] text-gray-500 italic">
          {data.mediaType === 'video' 
            ? "🎥 Video detected: Connect to Frame Extractor" 
            : data.mediaType === 'image' 
            ? "🖼️ Image detected: Connect to Crop Node" 
            : "Upload a file to begin"}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-4 h-4 bg-orange-500 border-2 border-white" />
    </div>
  );
}