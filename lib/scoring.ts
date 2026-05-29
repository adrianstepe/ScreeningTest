import type { DiarizationScore, PartScore } from "@/lib/types";

const speakerLabelRe = /^\s*\[([^\]]+)\]\s*[:-]?\s*/u;
const bracketTagRe = /\[[^\]]*\]/gu;
const latvianDiacritics = new Set("āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ".split(""));
const fillers = new Set(["ē", "ēē", "ēēē", "ēēēē", "ēh", "eh", "mm", "mmm", "mmmm", "m", "hmm", "hm", "āā", "ā", "uh", "uhm", "um"]);

type EditResult = {
  substitutions: number;
  deletions: number;
  insertions: number;
  distance: number;
};

type ScoreOptions = {
  stripTags?: boolean;
  ignoreFillers?: boolean;
};

function normalize(text: string, stripTags = false) {
  let out = text.normalize("NFC");
  if (stripTags) out = out.replace(bracketTagRe, " ");
  out = out.toLowerCase();
  out = out.replace(/[^\p{L}\p{N}\s_]/gu, " ").replace(/_/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

function stripSpeakerLabels(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(speakerLabelRe, ""))
    .join("\n");
}

export function extractSpeakerSequence(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => speakerLabelRe.exec(line)?.[1])
    .filter((label): label is string => Boolean(label))
    .map((label) => label.trim().toUpperCase().replace(/\s+/g, ""));
}

function editCounts<T>(ref: T[], hyp: T[]): EditResult {
  const dp: Array<Array<[number, number, number, number]>> = Array.from({ length: ref.length + 1 }, () =>
    Array.from({ length: hyp.length + 1 }, () => [0, 0, 0, 0])
  );

  for (let i = 1; i <= ref.length; i += 1) dp[i][0] = [i, 0, i, 0];
  for (let j = 1; j <= hyp.length; j += 1) dp[0][j] = [j, 0, 0, j];

  for (let i = 1; i <= ref.length; i += 1) {
    for (let j = 1; j <= hyp.length; j += 1) {
      if (ref[i - 1] === hyp[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        continue;
      }
      const sub = dp[i - 1][j - 1];
      const del = dp[i - 1][j];
      const ins = dp[i][j - 1];
      const best = [sub, del, ins].reduce((a, b) => (a[0] <= b[0] ? a : b));
      if (best === sub) dp[i][j] = [sub[0] + 1, sub[1] + 1, sub[2], sub[3]];
      else if (best === del) dp[i][j] = [del[0] + 1, del[1], del[2] + 1, del[3]];
      else dp[i][j] = [ins[0] + 1, ins[1], ins[2], ins[3] + 1];
    }
  }

  const [distance, substitutions, deletions, insertions] = dp[ref.length][hyp.length];
  return { substitutions, deletions, insertions, distance };
}

function rate(distance: number, refLength: number) {
  return refLength ? (distance / refLength) * 100 : 0;
}

function strippedDiacritics(reference: string, candidate: string) {
  const refCount = [...reference].filter((char) => latvianDiacritics.has(char)).length;
  const candidateCount = [...candidate].filter((char) => latvianDiacritics.has(char)).length;
  return refCount >= 5 && candidateCount === 0;
}

export function scoreTranscript(reference: string, candidate: string, options: ScoreOptions = {}): PartScore {
  let refWords = normalize(reference, options.stripTags).split(" ").filter(Boolean);
  let candidateWords = normalize(candidate, options.stripTags).split(" ").filter(Boolean);

  if (options.ignoreFillers) {
    refWords = refWords.filter((word) => !fillers.has(word));
    candidateWords = candidateWords.filter((word) => !fillers.has(word));
  }

  const wordEdits = editCounts(refWords, candidateWords);
  const charEdits = editCounts([...refWords.join("")], [...candidateWords.join("")]);
  const redFlags = strippedDiacritics(reference, candidate) ? ["Latvian diacritics appear to be stripped"] : [];

  return {
    wer: Number(rate(wordEdits.distance, refWords.length).toFixed(2)),
    cer: Number(rate(charEdits.distance, refWords.join("").length).toFixed(2)),
    substitutions: wordEdits.substitutions,
    deletions: wordEdits.deletions,
    insertions: wordEdits.insertions,
    redFlags
  };
}

export function scoreDiarization(reference: string, candidate: string, options: ScoreOptions = {}): DiarizationScore {
  const refSeq = extractSpeakerSequence(reference);
  const candidateSeq = extractSpeakerSequence(candidate);
  const sequenceEdits = editCounts(refSeq, candidateSeq);
  const base = scoreTranscript(stripSpeakerLabels(reference), stripSpeakerLabels(candidate), {
    ...options,
    stripTags: true
  });
  const referenceSpeakerCount = new Set(refSeq).size;
  const candidateSpeakerCount = new Set(candidateSeq).size;
  const redFlags = [...base.redFlags];

  if (candidateSeq.length === 0) redFlags.push("No speaker labels used");
  if (candidateSpeakerCount < referenceSpeakerCount) redFlags.push("Candidate found fewer speakers than the reference");
  if (candidateSpeakerCount > referenceSpeakerCount) redFlags.push("Candidate over-split speakers");

  return {
    ...base,
    redFlags,
    speakerSequenceAccuracy: Number((refSeq.length ? Math.max(0, 1 - sequenceEdits.distance / refSeq.length) * 100 : 100).toFixed(2)),
    referenceSpeakerCount,
    candidateSpeakerCount,
    referenceTurnCount: refSeq.length,
    candidateTurnCount: candidateSeq.length
  };
}

export function selfCheck(partAKey: string, partBKey: string) {
  const partA = scoreTranscript(partAKey, partAKey);
  const partB = scoreDiarization(partBKey, partBKey);
  const warnings: string[] = [];
  if (partA.wer !== 0) warnings.push("Part A key does not score 0% WER against itself");
  if (partB.wer !== 0) warnings.push("Part B key does not score 0% WER against itself");
  if (partB.speakerSequenceAccuracy !== 100) warnings.push("Part B key does not score 100% speaker sequence accuracy against itself");
  return {
    partAOk: partA.wer === 0,
    partBTextOk: partB.wer === 0,
    partBSpeakersOk: partB.speakerSequenceAccuracy === 100,
    warnings
  };
}
