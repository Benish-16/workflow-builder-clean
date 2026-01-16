import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3"; // Import Trigger.dev SDK

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { runId, nodeId, workflowId, mediaUrl, metadata } = body;

    // 🔒 Hard validation
    if (!runId || !nodeId || !workflowId) {
      return NextResponse.json(
        { error: "Missing runId, nodeId, or workflowId" },
        { status: 400 }
      );
    }

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Missing mediaUrl for TriggerMediaNode" },
        { status: 400 }
      );
    }

    // 1️⃣ Upsert WorkflowRun (parent)
    await prisma.workflowRun.upsert({
      where: { id: runId },
      update: {
        status: "success",
      },
      create: {
        id: runId,
        workflowId,          // ✅ REQUIRED
        status: "success",
        scope: "full",
        duration: 0,
      },
    });

    // 2️⃣ Log Trigger Node execution
    const execution = await prisma.nodeExecution.create({
      data: {
        runId,
        nodeId,
        nodeType: "TriggerMediaNode",
        status: "success",
        outputs: {
          mediaUrl,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
        },
        executionTime: (Date.now() - startTime) / 1000,
      },
    });

    /*return NextResponse.json({
      success: true,
      message: "Trigger node executed",
      data: execution,
    });*/
   if (nodeType === "FrameExtractNode" || nodeType === "frameExtract") {
    console.log('hi');
    
      await tasks.trigger("process-media", {
        url: inputs.video_url || inputs.url,
        type: "frameExtract",
        params: { 
          time: inputs.timestamp || inputs.params?.time || "00:00:01",
          runId: runId, // Pass IDs so the task can update the DB later
          nodeExecutionId: nodeExecution.id 
        }
      });
    }

    return NextResponse.json(nodeExecution);
  } catch (error: any) {
    console.error("TRIGGER MEDIA ERROR:", error);
    return NextResponse.json(
      { error: "Failed to execute trigger node" },
      { status: 500 }
    );
  }
}
