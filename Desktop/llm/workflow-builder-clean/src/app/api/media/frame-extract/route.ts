import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { mediaUrl, timestamp } = await req.json();
    console.log("📥 FrameExtract input:", { mediaUrl, timestamp });

    if (!mediaUrl) {
      return NextResponse.json({ error: "Missing mediaUrl" }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "public", "frames");
    fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `frame-${Date.now()}.png`;
    const outputPath = path.join(outputDir, fileName);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(mediaUrl)
        .seekInput(timestamp || "00:00:01")
        .frames(1)
        .output(outputPath)
        .on("start", (cmd) => {
          console.log("▶️ FFmpeg command:", cmd);
        })
        .on("stderr", (line) => {
          console.log("FFmpeg stderr:", line);
        })
        .on("end", () => {
          console.log("✅ FFmpeg finished:", outputPath);
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err);
          reject(err);
        })
        .run();
    });

    return NextResponse.json({
      imageUrl: `/frames/${fileName}`,
    });

  } catch (err) {
    console.error("❌ FrameExtract route failed:", err);
    return NextResponse.json(
      { error: "Frame extraction failed" },
      { status: 500 }
    );
  }
}
