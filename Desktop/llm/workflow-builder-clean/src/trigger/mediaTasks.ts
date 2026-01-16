import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";

// Ensure FFmpeg can find the binary
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export const mediaTask = task({
  id: "process-media",
  run: async (payload: { url: string; type: "crop" | "frameExtract"; params: any }) => {
    // Determine extension based on type (video for crop, image for frame)
    const isVideo = payload.type === "crop" && payload.url.endsWith(".mp4");
    const extension = isVideo ? "mp4" : "jpg";
    const outputPath = `/tmp/processed-${Date.now()}.${extension}`;

    await new Promise((resolve, reject) => {
      let command = ffmpeg(payload.url);

      if (payload.type === "crop") {
        // syntax: crop=width:height:x:y
        // We use default values if params are missing
        const { w = 400, h = 400, x = 0, y = 0 } = payload.params;
        command.videoFilters(`crop=${w}:${h}:${x}:${y}`);
      } else {
        // Frame Extraction: -ss (timestamp) -frames:v 1
        const timestamp = payload.params?.time || "00:00:01";
        command.seekInput(timestamp).frames(1);
      }

      command
        .output(outputPath)
        .on("start", (cmd) => console.log("Spawned FFmpeg with command: " + cmd))
        .on("end", resolve)
        .on("error", (err) => {
          console.error("FFmpeg Error:", err);
          reject(err);
        })
        .run();
    });

    // TODO: Upload 'outputPath' to Vercel Blob or Cloudinary here
    // const uploaded = await yourUploadFunction(outputPath);

    return { 
      success: true, 
      newUrl: `https://your-storage.com/${payload.type}-result.${extension}`,
      localPath: outputPath 
    };
  },
});