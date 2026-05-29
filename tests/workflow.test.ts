import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { calculateCandidateScores, recordCandidateSubmission } from "@/lib/workflows";

const dataDir = path.join(process.cwd(), "data");

async function main() {
  await mkdir(dataDir, { recursive: true });

  await writeFile(
    path.join(dataDir, "db.json"),
    JSON.stringify(
      {
        candidates: [
          {
            id: "workflow-candidate",
            token: "workflowtoken",
            name: "Workflow Test",
            email: "workflow@example.com",
            status: "Created",
            partAWhisperDraft: "Whisper draft is not the Part A key.",
            partBWhisperDraft: "[S1]: Whisper draft is not the Part B key.",
            partADraft: "Whisper draft is not the Part A key.",
            partBDraft: "[S1]: Whisper draft is not the Part B key.",
            createdAt: new Date().toISOString(),
            partAKey: "Šis ir īss tests.",
            partBKey: "[S1]: Pirmais runātājs.\n[S2]: Otrais runātājs.",
            scores: {},
            decision: "",
            tier: ""
          }
        ],
        files: []
      },
      null,
      2
    )
  );

  const candidate = await recordCandidateSubmission("workflowtoken", "Šis ir īss tests.", "[S1]: Pirmais runātājs.\n[S2]: Otrais runātājs.");

  assert.equal(candidate.status, "Submitted");
  assert.equal(candidate.scores.partA?.wer, 0);
  assert.equal(candidate.scores.partB?.wer, 0);
  assert.equal(candidate.scores.partB?.speakerSequenceAccuracy, 100);
  assert.ok((candidate.scores.whisperBaseline?.partA?.wer || 0) > 0);
  assert.ok((candidate.scores.whisperBaseline?.partB?.wer || 0) > 0);
  assert.ok((candidate.scores.improvement?.partA?.werPercentagePoints || 0) > 1.5);
  assert.ok((candidate.scores.improvement?.partB?.werPercentagePoints || 0) > 1.5);
  assert.equal(candidate.scores.summary?.overall, "Auto Pass");

  const draftIsNotKey = calculateCandidateScores({
    ...candidate,
    partASubmission: "Whisper draft is not the Part A key.",
    partBSubmission: "[S1]: Whisper draft is not the Part B key."
  });
  assert.ok((draftIsNotKey.partA?.wer || 0) > 0);
  assert.ok((draftIsNotKey.partB?.wer || 0) > 0);
  assert.ok(draftIsNotKey.partA?.redFlags.includes("Low improvement from Whisper draft"));
  assert.ok(draftIsNotKey.partA?.redFlags.includes("Likely raw Whisper submission"));
  assert.equal(draftIsNotKey.summary?.overall, "Auto Fail");

  console.log("Workflow tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
