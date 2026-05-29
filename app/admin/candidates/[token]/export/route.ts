import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getCandidateByToken } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  await requireAdmin();
  const { token } = await params;
  const candidate = await getCandidateByToken(token);
  if (!candidate) return new NextResponse("Not found", { status: 404 });

  const body = [
    `Candidate: ${candidate.name} <${candidate.email}>`,
    `Status: ${candidate.status}`,
    `Submitted: ${candidate.submittedAt || ""}`,
    "",
    "Part A Transcript",
    "=================",
    candidate.partASubmission || "",
    "",
    "Part B Transcript",
    "=================",
    candidate.partBSubmission || "",
    "",
    "Scores",
    "======",
    JSON.stringify(candidate.scores, null, 2),
    "",
    "Review",
    "======",
    `Formatting: ${candidate.formattingScore ?? ""}`,
    `Decision: ${candidate.decision}`,
    `Tier: ${candidate.tier}`,
    `Notes: ${candidate.notes || ""}`,
    `Red flags: ${candidate.redFlags || ""}`
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${candidate.name.replace(/[^a-z0-9_-]/gi, "_")}-transcripts.txt"`
    }
  });
}
