import type { NextConfig } from "next";
import fs from "fs/promises";
import path from "path";

const nextConfig: NextConfig = {
  compiler: {
    runAfterProductionCompile: async ({ distDir }) => {
      const serverDir = path.join(distDir, "server");
      const chunksDir = path.join(serverDir, "chunks");

      let entries;
      try {
        entries = await fs.readdir(chunksDir, { withFileTypes: true });
      } catch {
        return;
      }

      await Promise.all(
        entries
          .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
          .map((entry) =>
            fs.copyFile(
              path.join(chunksDir, entry.name),
              path.join(serverDir, entry.name),
            ),
          ),
      );
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "c0rcuqs67z.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
};

export default nextConfig;
