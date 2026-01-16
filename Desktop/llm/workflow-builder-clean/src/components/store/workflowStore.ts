"use client";

import create from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  addEdge,
  Connection,
  Edge,
  Node as FlowNode,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";

interface WorkflowState {
  nodes: FlowNode[];
  edges: Edge[];

  nodeDbIds: Record<string, number>;
  currentRunId: string;
  currentWorkflowId: number;

  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNodeDbId: (reactFlowId: string, dbId: number) => void;

  setCurrentRunId: (id: string) => void;
  setCurrentWorkflowId: (id: number) => void;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: Connection) => void;

  updateNodeData: (nodeId: string, newData: any) => void;
  runNode: (nodeId: string, scope?: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeDbIds: {},
  currentRunId: "",
  currentWorkflowId: 0,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  setNodeDbId: (reactFlowId, dbId) =>
    set((state) => ({
      nodeDbIds: { ...state.nodeDbIds, [reactFlowId]: dbId },
      nodes: state.nodes.map((n) =>
        n.id === reactFlowId ? { ...n, dbId } : n
      ),
    })),

  setCurrentRunId: (id) => set({ currentRunId: id }),
  setCurrentWorkflowId: (id) => set({ currentWorkflowId: id }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (params) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === params.source);

    const sourceValue =
      sourceNode?.data.outputUrl ||
      sourceNode?.data.inputUrl ||
      sourceNode?.data.url;

    const targetKey = params.targetHandle || "inputUrl";

    set({
      nodes: nodes.map((node) =>
        node.id === params.target
          ? { ...node, data: { ...node.data, [targetKey]: sourceValue } }
          : node
      ),
      edges: addEdge({ ...params, animated: true }, edges),
    });
  },

  updateNodeData: (nodeId, newData) =>
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      );

      state.edges
        .filter((e) => e.source === nodeId)
        .forEach((edge) => {
          const target = updatedNodes.find((n) => n.id === edge.target);
          if (!target) return;

          const handle = edge.targetHandle || "inputUrl";
          const value =
            newData.outputUrl ||
            newData.inputUrl ||
            newData.url ||
            newData.text;

          target.data = { ...target.data, [handle]: value };
        });

      return { nodes: updatedNodes };
    }),

  runNode: async (nodeId, scope = "single") => {
    const {
      nodes,
      nodeDbIds,
      currentWorkflowId,
      currentRunId,
      setCurrentRunId,
      updateNodeData,
    } = get();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const nodeDbId = node.dbId || nodeDbIds[nodeId];
    if (!nodeDbId) {
      updateNodeData(nodeId, { response: "❌ Node not saved to DB" });
      return;
    }

    const runId = currentRunId || uuidv4();
    if (!currentRunId) setCurrentRunId(runId);

    updateNodeData(nodeId, { loading: true });

    let endpoint = "";
    let payload: any = {};

    switch (node.type) {
      case "llm":
        endpoint = "/api/gemini";
        payload = {
          runId,
          workflowId: currentWorkflowId,
          nodeId: nodeDbId,
          systemPrompt:
            node.data.system_prompt || "You are a helpful assistant.",
          userMessage:
            node.data.user_message || "Describe this content.",
          imageUrl: node.data.images || node.data.inputUrl,
        };
        break;

      case "TriggerMediaNode":
        endpoint = "/api/trigger-media";
        payload = {
          runId,
          workflowId: currentWorkflowId,
          nodeId: nodeDbId,
          mediaUrl: node.data.inputUrl,
          metadata: node.data.metadata || {},
        };
        break;

      default:
        updateNodeData(nodeId, {
          response: `❌ No API mapped for node type: ${node.type}`,
          loading: false,
        });
        return;
    }

    try {
      const startTime = performance.now();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Execution failed");

      const result = await res.json();

      const duration = Number(
        ((performance.now() - startTime) / 1000).toFixed(2)
      );

      const output =
        node.type === "LLMNode"
          ? result.output
          : result.text || "Success";

      updateNodeData(nodeId, {
        response: output,
        outputUrl: result.url,
        loading: false,
      });

      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          workflowId: currentWorkflowId,
          nodeId: nodeDbId,
          nodeType: node.type,
          status: "success",
          scope,
          inputs: payload,
          outputs: { text: output, url: result.url },
          executionTime: duration,
        }),
      });
    } catch (err) {
      console.error(err);

      updateNodeData(nodeId, {
        response: "💥 Execution Failed",
        loading: false,
      });

      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          workflowId: currentWorkflowId,
          nodeId: nodeDbId,
          nodeType: node.type,
          status: "failed",
          scope,
          executionTime: 0,
        }),
      });
    }
  },
}));
