import { getCandidateByToken, saveCandidate } from "@/lib/db";
import { scoreDiarization, scoreTranscript, selfCheck, transcriptSimilarity } from "@/lib/scoring";
import type { Candidate, PartScore, ScoreImprovement } from "@/lib/types";

const LOW_IMPROVEMENT_THRESHOLD = 1.5;
const RAW_DRAFT_SIMILARITY_THRESHOLD = 98.5;

function roundMetric(value: number) {
  return Number(value.toFixed(2));
}

function originalWhisperDraft(candidate: Candidate, part: "a" | "b") {
  if (part === "a") {
    if (candidate.partAWhisperDraft) return candidate.partAWhisperDraft;
    if (candidate.partADraft && candidate.partADraft !== candidate.partASubmission) return candidate.partADraft;
  } else {
    if (candidate.partBWhisperDraft) return candidate.partBWhisperDraft;
    if (candidate.partBDraft && candidate.partBDraft !== candidate.partBSubmission) return candidate.partBDraft;
  }
  return "";
}

function addImprovementFlags(score: PartScore, improvement: ScoreImprovement) {
  const flags = [...score.redFlags];
  if (improvement.werPercentagePoints <= LOW_IMPROVEMENT_THRESHOLD) flags.push("Low improvement from Whisper draft");
  if (improvement.draftSimilarity >= RAW_DRAFT_SIMILARITY_THRESHOLD) flags.push("Likely raw Whisper submission");
  return Array.from(new Set(flags));
}

function compareWithWhisperDraft(score: PartScore, baseline: PartScore, draft: string, submission: string, stripTags = false) {
  const improvement = {
    werPercentagePoints: roundMetric(baseline.wer - score.wer),
    cerPercentagePoints: roundMetric(baseline.cer - score.cer),
    draftSimilarity: transcriptSimilarity(draft, submission, { stripTags })
  };
  score.redFlags = addImprovementFlags(score, improvement);
  return improvement;
}

function summarizeScores(scores: Candidate["scores"]) {
  if (!scores.partA || !scores.partB) return undefined;

  const issues: string[] = [];
  if (scores.partA.wer > 15) issues.push("Part A WER is above 15% hard gate");
  else if (scores.partA.wer > 10) issues.push("Part A WER is in the 10-15% manual review band");

  if (scores.partB.wer > 15) issues.push("Part B WER is above 15% hard gate");
  else if (scores.partB.wer > 12) issues.push("Part B WER is in the 12-15% manual review band");

  if (!scores.whisperBaseline?.partA || !scores.improvement?.partA) issues.push("Part A Whisper baseline comparison is unavailable");
  if (!scores.whisperBaseline?.partB || !scores.improvement?.partB) issues.push("Part B Whisper baseline comparison is unavailable");
  if (scores.partB.speakerSequenceAccuracy < 85) issues.push("Part B speaker sequence accuracy is below the helper target");
  issues.push(...scores.partA.redFlags, ...scores.partB.redFlags);

  const redFlags = [...scores.partA.redFlags, ...scores.partB.redFlags];
  const fail = scores.partA.wer > 15 || scores.partB.wer > 15;
  const clearlyImproved =
    Boolean(scores.improvement?.partA && scores.improvement.partA.werPercentagePoints > LOW_IMPROVEMENT_THRESHOLD) &&
    Boolean(scores.improvement?.partB && scores.improvement.partB.werPercentagePoints > LOW_IMPROVEMENT_THRESHOLD);

  const manualReview = fail
    ? false
    : scores.partA.wer > 10 ||
      scores.partB.wer > 12 ||
      !clearlyImproved ||
      redFlags.length > 0;

  return {
    overall: fail ? "Auto Fail" : manualReview ? "Manual Review" : "Auto Pass",
    averageWer: roundMetric((scores.partA.wer + scores.partB.wer) / 2),
    issues: Array.from(new Set(issues))
  } satisfies NonNullable<Candidate["scores"]["summary"]>;
}

export function calculateCandidateScores(candidate: Candidate) {
  const scores: Candidate["scores"] = {
    selfCheck: selfCheck(candidate.partAKey, candidate.partBKey)
  };

  if (candidate.partASubmission) {
    scores.partA = scoreTranscript(candidate.partAKey, candidate.partASubmission);
    const draft = originalWhisperDraft(candidate, "a");
    if (draft) {
      scores.whisperBaseline ??= {};
      scores.improvement ??= {};
      scores.whisperBaseline.partA = scoreTranscript(candidate.partAKey, draft);
      scores.improvement.partA = compareWithWhisperDraft(scores.partA, scores.whisperBaseline.partA, draft, candidate.partASubmission);
    }
  }
  if (candidate.partBSubmission) {
    scores.partB = scoreDiarization(candidate.partBKey, candidate.partBSubmission);
    const draft = originalWhisperDraft(candidate, "b");
    if (draft) {
      scores.whisperBaseline ??= {};
      scores.improvement ??= {};
      scores.whisperBaseline.partB = scoreDiarization(candidate.partBKey, draft);
      scores.improvement.partB = compareWithWhisperDraft(scores.partB, scores.whisperBaseline.partB, draft, candidate.partBSubmission, true);
    }
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
