import { ffmpeg } from "@trigger.dev/build/extensions/core";
import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "your-project-id",
  build: {
    extensions: [ffmpeg()], // This installs the FFmpeg binary in the cloud
  },
});