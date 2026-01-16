"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { useWorkflowStore } from "@/components/store/workflowStore";

export function HistorySidebar() {
  const [runs, setRuns] = useState<any[]>([]);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { setNodes, setEdges } = useWorkflowStore();

  const fetchHistory = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch (err) {
      console.error("Failed to sync history:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  /** 🔥 LOAD WORKFLOW INTO CANVAS */
  const loadRunWorkflow = (run: any) => {
    if (!run.workflowSnapshot) {
      console.warn("No workflow snapshot saved for this run");
      return;
    }

    setNodes(run.workflowSnapshot.nodes || []);
    setEdges(run.workflowSnapshot.edges || []);
  };

  return (
    <div className="w-80 border-l bg-slate-50 h-screen flex flex-col shadow-inner overflow-hidden font-sans">
      {/* HEADER */}
      <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm z-10">
        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Clock size={16} className="text-indigo-500" />
          Execution History
        </h2>
        <button
          onClick={fetchHistory}
          className={`p-1.5 hover:bg-slate-100 rounded-md transition-all ${
            isRefreshing ? "animate-spin text-indigo-500" : "text-slate-400"
          }`}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 opacity-60">
            <HardDrive size={32} strokeWidth={1} />
            <p className="text-[11px] mt-2 font-medium">No executions yet</p>
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:border-indigo-200 transition-all"
            >
              {/* RUN HEADER */}
              <div
                onClick={() => {
                  setExpandedRunId(expandedRunId === run.id ? null : run.id);
                  loadRunWorkflow(run); // 🔥 LOAD GRAPH
                }}
                className="p-3 cursor-pointer hover:bg-indigo-50/30 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <StatusBadge status={run.status} />
                  <span className="text-[9px] text-slate-400 font-mono">
                    {new Date(run.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    {new Date(run.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[11px] font-bold text-slate-700">
                      Run #{run.id.slice(0, 4)}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">
                      {run.scope} Workflow
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                    <span className="text-slate-400 font-mono">
                      {(run.duration / 1000).toFixed(1)}s
                    </span>
                    {expandedRunId === run.id ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </div>
                </div>
              </div>

              {/* NODE EXECUTIONS */}
              {expandedRunId === run.id && (
                <div className="bg-slate-50 p-5 border-t border-slate-200 space-y-6 relative">
                  <div className="absolute left-[24px] top-6 bottom-8 w-[1.5px] bg-slate-300" />

                  {run.nodeExecutions?.map((exec: any) => (
                    <div key={exec.id} className="relative pl-8">
                      <div className="absolute left-[-5px] top-[10px] w-5 h-[1.5px] bg-slate-300" />

                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          {exec.nodeType.replace(/Node$/, "")}
                        </span>

                        {exec.status === "success" ? (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        ) : (
                          <XCircle size={13} className="text-rose-500" />
                        )}

                        <span className="text-[10px] text-slate-400 italic">
                          {exec.executionTime}s
                        </span>
                      </div>

                      <div className="relative ml-1 pl-4 border-l-[1.5px] border-slate-300 py-1 mt-0.5">
                        <div className="absolute left-0 top-3 w-3 h-[1.5px] bg-slate-300" />

                        <div className="text-[10px] font-medium text-slate-500">
                          {exec.outputs?.text ||
                            exec.outputs?.url ||
                            "Success"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-600 border-emerald-100",
    failed: "bg-rose-50 text-rose-600 border-rose-100",
    running: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse",
  };

  return (
    <span
      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
        styles[status as keyof typeof styles]
      }`}
    >
      {status}
    </span>
  );
}
