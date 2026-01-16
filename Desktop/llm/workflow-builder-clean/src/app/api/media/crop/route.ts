// /app/api/media/crop/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

export async function POST(req: Request) {
  try {
    const { imageUrl, xPercent = 0, yPercent = 0, widthPercent = 100, heightPercent = 100 } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    // Ensure frames directory exists
    const framesDir = path.join(process.cwd(), "public", "frames");
    fs.mkdirSync(framesDir, { recursive: true });

    // Determine local input path
    let inputPath: string;
    let isRemote = false;

    if (imageUrl.startsWith("http")) {
      // Remote URL: download to temp file
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Failed to fetch remote image");
      const buffer = Buffer.from(await res.arrayBuffer());
      inputPath = path.join(framesDir, `temp-${Date.now()}.png`);
      fs.writeFileSync(inputPath, buffer);
      isRemote = true;
    } else if (imageUrl.startsWith("/frames/")) {
      // Local public image
      inputPath = path.join(process.cwd(), "public", imageUrl.replace(/^\/frames\//, "frames/"));
      if (!fs.existsSync(inputPath)) throw new Error(`Local image not found: ${inputPath}`);
    } else {
      throw new Error("Invalid imageUrl format");
    }

    const outputFileName = `cropped-${Date.now()}.png`;
    const outputPath = path.join(framesDir, outputFileName);

    // Probe image dimensions
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) return reject(err);
        const stream = metadata.streams.find(s => s.width && s.height);
        if (!stream) return reject("No width/height found");
        resolve({ width: stream.width, height: stream.height });
      });
    });

    // Calculate crop in pixels
    const cropX = Math.round((xPercent / 100) * width);
    const cropY = Math.round((yPercent / 100) * height);
    const cropW = Math.round((widthPercent / 100) * width);
    const cropH = Math.round((heightPercent / 100) * height);

    // Run FFmpeg crop
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(`-vf crop=${cropW}:${cropH}:${cropX}:${cropY}`)
        .outputOptions("-frames:v 1") // Single image output
        .output(outputPath)
        .on("start", cmd => console.log("FFmpeg cmd:", cmd))
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    // Delete temp file if downloaded
    if (isRemote) fs.unlinkSync(inputPath);

    return NextResponse.json({ croppedUrl: `/frames/${outputFileName}` });
  } catch (err) {
    console.error("❌ Crop API error:", err);
    return NextResponse.json({ error: "Crop failed" }, { status: 500 });
  }
}
