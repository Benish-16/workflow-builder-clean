import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workflowId, nodeType } = body;

    if (!workflowId) return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });

    const node = await prisma.node.create({
      data: {
        workflowId,
        type: nodeType,
        data: {}, // empty JSON
        x: 0,
        y: 0,
      },
    });

    return NextResponse.json(node); // returns node.id
  } catch (err) {
    console.error("Create Node Error:", err);
    return NextResponse.json({ error: "Failed to create node" }, { status: 500 });
  }
}
