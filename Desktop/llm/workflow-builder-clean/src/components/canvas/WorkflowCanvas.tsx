"use client";
import { useCallback } from 'react';
import { ReactFlow, Background, Controls, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from "@/components/store/workflowStore";
import TextNode from "@/components/nodes/TextNode";
import { LLMNode } from "@/components/nodes/LLMNode";
import ImageNode from "@/components/nodes/ImageNode";
import { UploadNode } from "@/components/nodes/UploadNode";
import { CropNode } from "@/components/nodes/CropNode";
import { FrameExtractNode } from "@/components/nodes/FrameExtractNode";

const nodeTypes = {
  text: TextNode,
  llm: LLMNode,
  image: ImageNode,
  upload: UploadNode,
  crop: CropNode,
  frameExtract: FrameExtractNode,
};

export default function WorkflowCanvas() {
  const { nodes, edges, onConnect, onNodesChange, onEdgesChange } = useWorkflowStore();

  const isValidConnection = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return false;
      if (connection.source === connection.target) return false;

      // Logic: Allow 'upload' to feed 'crop' or 'frameExtract'
     if (sourceNode.type === 'upload' && targetNode.type === 'crop') {
  // Ensure we aren't blocking based on a missing handle ID
  return true; 
}
      // Logic: Allow 'crop' to feed 'llm'
      if (sourceNode.type === 'crop' && targetNode.type === 'llm') {
        return true; 
      }

      return true; // Default to true for simplicity; add strict rules as you grow
    },
    [nodes]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        isValidConnection={isValidConnection} 
        fitView
      >
        <Background color="#aaa" gap={20} variant="dots" />
        <Controls />
      </ReactFlow>
    </div>
  );
}