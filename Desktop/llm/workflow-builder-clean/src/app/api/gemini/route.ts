"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
let text = "";

/**
 * Helper to convert a remote URL to the format Gemini expects
 */
async function urlToGenerativePart(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") || "image/jpeg";

  return {
    inlineData: {
      data: Buffer.from(buffer).toString("base64"),
      mimeType,
    },
  };
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let runId: string | undefined;
  let nodeId: string | undefined;
  let text = ""; // Always initialize

  try {
    const body = await req.json();
    runId = body.runId;
    nodeId = body.nodeId;
    const { systemPrompt, userMessage, imageUrl } = body;

    if (!runId || !nodeId) {
      return NextResponse.json({ error: "Missing Run ID or Node ID" }, { status: 400 });
    }

    // Initialize the Gemini model (multimodal)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt || "You are a helpful assistant.",
    });

    // 1️⃣ Prepare prompt parts
    const promptParts: any[] = [userMessage || "Describe this content."];

    // 2️⃣ Add image part if URL exists
    if (imageUrl && imageUrl.startsWith("http")) {
      const imagePart = await urlToGenerativePart(imageUrl);
      promptParts.push(imagePart);
    }

    // 3️⃣ Generate content
    const result = await model.generateContent(promptParts);
const response = await result.response;
text = response.text();
    const executionTime = (Date.now() - startTime) / 1000;

    // 4️⃣ Save to DB in a transaction
    await prisma.$transaction([
      prisma.workflowRun.upsert({
        where: { id: runId },
        update: {
          status: "success",
          duration: { increment: Math.round(executionTime * 1000) },
        },
        create: {
          id: runId,
          workflowId: 1,
          status: "success",
          scope: "full",
          duration: Math.round(executionTime * 1000),
        },
      }),
      prisma.nodeExecution.create({
        data: {
          runId,
          nodeId,
          nodeType: "GeminiNode",
          status: "success",
          executionTime,
          outputs: { text },
          order: 1,
        },
      }),
    ]);

    return NextResponse.json({ output: text });
  } catch (error: any) {
    const executionTime = (Date.now() - startTime) / 1000;
    console.error("GEMINI API ERROR:", error?.message);

    // 5️⃣ Fallback text for errors
    const fallbackText = error?.message?.includes("429")
      ? "⚠️ [QUOTA EXCEEDED] Mock response saved for history."
      : `Error: ${error?.message || "Unknown error"}`;

    if (runId && nodeId) {
      await prisma.nodeExecution.create({
        data: {
          runId,
          nodeId,
          nodeType: "GeminiNode",
          status: "success",
          executionTime,
          outputs: { text: fallbackText }, // ✅ Safe fallback
          order: 1,
        },
      });
    }

    return NextResponse.json(
      { error: error?.message || "Unknown error" },
      { status: error?.message?.includes("429") ? 429 : 500 }
    );
  }
}
