import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      runId,
      nodeId,
      nodeType,
      status,
      outputs,
      executionTime,
      inputs,
      order,
    } = body;

    const nodeExecution = await prisma.nodeExecution.create({
      data: {
        runId,
        nodeId,
        nodeType,
        status,
        executionTime: executionTime ?? 0,
        outputs,
        inputs,
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
