import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-static";

export async function GET() {
  const icon = await readFile(path.join(process.cwd(), "app", "favicon.ico", "sd-favicon.png"));

  return new Response(icon, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png"
    }
  });
}
