"use client";

import React, { useEffect } from "react";
import WorkflowCanvas from "@/components/canvas/WorkflowCanvas";
import Sidebar from "@/components/sidebar/Sidebar";
import { HistorySidebar } from "@/components/sidebar/HistorySidebar";
import { useWorkflowStore } from "@/components/store/workflowStore";
import { v4 as uuidv4 } from "uuid";

export default function HomePage() {
    const setCurrentRunId = useWorkflowStore((s) => s.setCurrentRunId);
  const setCurrentWorkflowId = useWorkflowStore((s) => s.setCurrentWorkflowId);
  useEffect(() => {
    // Start workflow session
    const workflowId = 1; // replace with real workflow id
    const runId = uuidv4();
    const store = useWorkflowStore.getState();
    store.setCurrentRunId(runId);
    store.setCurrentWorkflowId(workflowId);
    console.log("Workflow started!", { runId, workflowId });
  }, []);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 z-20 shadow-sm">
        <Sidebar />
      </aside>

      <section className="flex-1 relative h-full flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <h1 className="text-sm font-semibold text-slate-700">Untitled Workflow</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
              Deploy
            </button>
          </div>
        </header>

        <div className="flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <WorkflowCanvas />
        </div>
      </section>

      <aside className="w-80 bg-white border-l border-slate-200 z-20 shadow-lg">
        <HistorySidebar />
      </aside>
    </main>
  );
}
