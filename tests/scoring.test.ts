import assert from "node:assert/strict";
import { scoreDiarization, scoreTranscript, selfCheck } from "@/lib/scoring";

const partA = "Šis ir īss latviešu transkripcijas tests ar garumzīmēm.";
const partB = `[S1]: Labdien, šis ir pirmais runātājs.
[S2]: Jā, es esmu otrais runātājs.`;

const a = scoreTranscript(partA, partA);
assert.equal(a.wer, 0);
assert.equal(a.cer, 0);

const b = scoreDiarization(partB, partB);
assert.equal(b.wer, 0);
assert.equal(b.speakerSequenceAccuracy, 100);
assert.equal(b.referenceSpeakerCount, 2);
assert.equal(b.candidateSpeakerCount, 2);

const missingDiacritics = scoreTranscript(partA, "Sis ir iss latviesu transkripcijas tests ar garumzimem.");
assert.ok(missingDiacritics.redFlags.some((flag) => flag.includes("diacritics")));

const noLabels = scoreDiarization(partB, "Labdien, šis ir pirmais runātājs.\nJā, es esmu otrais runātājs.");
assert.ok(noLabels.redFlags.includes("No speaker labels used"));

const check = selfCheck(partA, partB);
assert.equal(check.partAOk, true);
assert.equal(check.partBTextOk, true);
assert.equal(check.partBSpeakersOk, true);

console.log("Scoring tests passed.");
