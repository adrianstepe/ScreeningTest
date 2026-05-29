import { getCandidateByToken, saveCandidate } from "@/lib/db";
import { scoreDiarization, scoreTranscript, selfCheck } from "@/lib/scoring";
import type { Candidate } from "@/lib/types";

function summarizeScores(scores: Candidate["scores"]) {
  if (!scores.partA || !scores.partB) return undefined;

  const issues: string[] = [];
  if (scores.partA.wer > 10) issues.push("Part A WER is above the pass target");
  if (scores.partB.wer > 10) issues.push("Part B WER is above the pass target");
  if (scores.partB.speakerSequenceAccuracy < 85) issues.push("Part B speaker sequence accuracy is below the pass target");
  issues.push(...scores.partA.redFlags, ...scores.partB.redFlags);

  const fail =
    scores.partA.wer > 15 ||
    scores.partB.wer > 15 ||
    scores.partB.speakerSequenceAccuracy < 70 ||
    scores.partA.redFlags.some((flag) => flag.includes("diacritics")) ||
    scores.partB.redFlags.includes("No speaker labels used");

  const borderline = fail
    ? false
    : scores.partA.wer > 10 ||
      scores.partB.wer > 10 ||
      scores.partB.speakerSequenceAccuracy < 85 ||
      scores.partA.redFlags.length > 0 ||
      scores.partB.redFlags.length > 0;

  return {
    overall: fail ? "Fail" : borderline ? "Borderline" : "Pass",
    averageWer: Number(((scores.partA.wer + scores.partB.wer) / 2).toFixed(2)),
    issues
  } satisfies NonNullable<Candidate["scores"]["summary"]>;
}

export function calculateCandidateScores(candidate: Candidate) {
  const scores: Candidate["scores"] = {
    selfCheck: selfCheck(candidate.partAKey, candidate.partBKey)
  };

  if (candidate.partASubmission) {
    scores.partA = scoreTranscript(candidate.partAKey, candidate.partASubmission);
  }
  if (candidate.partBSubmission) {
    scores.partB = scoreDiarization(candidate.partBKey, candidate.partBSubmission);
  }
  scores.summary = summarizeScores(scores);
  return scores;
}

export async function recordCandidateSubmission(token: string, partA: string, partB: string) {
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Invalid test link");
  if (!partA.trim() || !partB.trim()) throw new Error("Both parts are required");

  const now = new Date().toISOString();
  candidate.partASubmission = partA.trim();
  candidate.partBSubmission = partB.trim();
  candidate.partADraft = candidate.partASubmission;
  candidate.partBDraft = candidate.partBSubmission;
  candidate.submittedAt = now;
  candidate.status = "Submitted";
  candidate.scores = calculateCandidateScores(candidate);
  await saveCandidate(candidate);
  return candidate;
}
