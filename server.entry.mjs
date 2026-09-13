import { serve } from "h3-v2";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import server from "./dist/server/server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, "dist/client");

const MIME_TYPES = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".map": "application/json",
};

async function serveStaticFile(pathname) {
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(clientDir, safePath);

  if (path.relative(clientDir, filePath).startsWith("..")) return null;

  try {
    const stats = await stat(filePath);
    if (!stats.isFile()) return null;

    const body = await readFile(filePath);
    return new Response(body, {
      headers: {
        "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
        "Cache-Control": pathname.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
      },
    });
  } catch {
    return null;
  }
}

const combinedHandler = {
  async fetch(request) {
    const url = new URL(request.url);
    const staticResponse = await serveStaticFile(url.pathname);
    if (staticResponse) return staticResponse;
    return server.fetch(request);
  },
};

const port = Number(process.env.PORT) || 3000;

serve(combinedHandler, { port });
