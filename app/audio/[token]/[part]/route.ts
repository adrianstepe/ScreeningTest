import { NextResponse } from "next/server";
import { getCandidateByToken, getFile } from "@/lib/db";
import { readAudio } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ token: string; part: string }> }) {
  const { token, part } = await params;
  const candidate = await getCandidateByToken(token);
  if (!candidate) return new NextResponse("Not found", { status: 404 });

  const file = await getFile(part.toLowerCase() === "b" ? candidate.partBAudioFileId : candidate.partAAudioFileId);
  if (!file) return new NextResponse("Not found", { status: 404 });
  const bytes = await readAudio(file);

  return new NextResponse(bytes, {
    headers: {
      "content-type": file.mimeType,
      "cache-control": "private, max-age=300",
      "content-length": String(bytes.length)
    }
  });
}
