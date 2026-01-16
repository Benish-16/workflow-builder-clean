import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      runId,
      nodeId,
      workflowId,
      nodeType,
      status,
      outputs,
      executionTime,
      inputs,
      order,
    } = body;

    // 1️⃣ Ensure Node exists
    const node = await prisma.node.upsert({
      where: { id: Number(nodeId) },
      create: {
        id: Number(nodeId),
        workflowId: Number(workflowId),
        type: nodeType,
        data: {},
        x: 0,
        y: 0,
      },
      update: {},
    });

    // 2️⃣ Ensure WorkflowRun exists
    const run = await prisma.workflowRun.upsert({
      where: { id: runId },
      create: {
        id: runId,
        workflowId: Number(workflowId),
        status: "running",
        scope: "single",
        duration: 0,
      },
      update: {},
    });

    // 3️⃣ Create NodeExecution
    const nodeExecution = await prisma.nodeExecution.create({
      data: {
        runId: run.id,
        nodeId: node.id,
        nodeType,
        status,
        executionTime: executionTime ?? 0,
        inputs,
        outputs,
        order: order ?? 0,
      },
    });

    return NextResponse.json(nodeExecution);
  } catch (error) {
    console.error("❌ NodeExecution error:", error);
    return NextResponse.json(
      { error: "Failed to create node execution" },
      { status: 500 }
    );
  }
}