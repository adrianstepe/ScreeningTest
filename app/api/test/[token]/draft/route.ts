import { NextResponse } from "next/server";
import { getCandidateByToken, saveCandidate } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!checkRateLimit(`draft:${token}`, 60, 60_000)) return new NextResponse("Too many requests", { status: 429 });
  const candidate = await getCandidateByToken(token);
  if (!candidate || candidate.submittedAt) return new NextResponse("Not found", { status: 404 });
  const body = (await request.json()) as { partA?: string; partB?: string };
  candidate.partADraft = String(body.partA || "").slice(0, 200_000);
  candidate.partBDraft = String(body.partB || "").slice(0, 200_000);
  candidate.status = "In progress";
  await saveCandidate(candidate);
  return NextResponse.json({ ok: true });
}
