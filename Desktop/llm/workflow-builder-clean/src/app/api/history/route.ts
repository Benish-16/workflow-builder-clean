// app/api/history/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/* ────────────────────────────────────────────────
   GET: Fetch recent workflow runs with executions
──────────────────────────────────────────────── */
export async function GET() {
  try {
    const history = await prisma.workflowRun.findMany({
      include: {
        nodeExecutions: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("GET History Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}

/* ────────────────────────────────────────────────
   POST: Log node execution + ensure WorkflowRun
──────────────────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const {
      runId,
      workflowId,
      nodeId,
      nodeType,
      status,
      inputs,
      outputs,
      executionTime = 0,
      scope = "single",
      order = 0,
    } = await req.json();

    // 🛑 Hard validation
    if (!runId || !workflowId || !nodeId || !nodeType || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Ensure WorkflowRun exists (do NOT overwrite status blindly)
    await prisma.workflowRun.upsert({
      where: { id: runId },
      update: {
        duration: {
          increment: Math.round(executionTime * 1000),
        },
      },
      create: {
        id: runId,
        workflowId,
        status: "running",
        scope,
        duration: Math.round(executionTime * 1000),
      },
    });

    // 2️⃣ Create NodeExecution
    await prisma.nodeExecution.create({
      data: {
        runId,
        nodeId,
        nodeType,
        status,
        order,
        executionTime,
        inputs: inputs ?? {},
        outputs: outputs ?? {},
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("POST History Error:", error);
    return NextResponse.json(
      { error: "Failed to log execution" },
      { status: 500 }
    );
  }
}
