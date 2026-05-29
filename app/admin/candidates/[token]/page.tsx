import { notFound } from "next/navigation";
import { deleteCandidateAction, rerunScoring, setCandidateStatus, updateKeys, updateReview } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getCandidateByToken } from "@/lib/db";
import { candidateLink } from "@/lib/links";
import { AdminChrome } from "@/components/AdminChrome";

export const dynamic = "force-dynamic";

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString("lv-LV") : "-";
}

function scoreLine(label: string, value?: number) {
  return (
    <div>
      <strong>{label}:</strong> {value === undefined ? "-" : `${value}%`}
    </div>
  );
}

function improvementLine(label: string, value?: number) {
  return (
    <div>
      <strong>{label}:</strong> {value === undefined ? "-" : `${value} percentage points`}
    </div>
  );
}

function emailTemplate(name: string, link: string) {
  return `Subject: Stepe Digital transkripcijas tests

Labdien, ${name}!

Paldies par aizpildīto pieteikuma formu. Nākamais solis ir īss transkripcijas tests.

Testa saite:
${link}

Lūdzu aizpildiet abas daļas:

1. Part A — viena runātāja transkripcija.
2. Part B — vairāku runātāju transkripcija ar runātāju atzīmēm.

Lūdzu izmantojiet pilnas latviešu diakritiskās zīmes. Ja kaut ko pavisam nevar saprast, lietojiet [inaudible] - tas ir labāk nekā minēt

Termiņš: 48 stundu laikā.

Paldies!
Adrians Stepe
Stepe Digital SIA`;
}

export default async function CandidateAdminPage({ params }: { params: Promise<{ token: string }> }) {
  await requireAdmin();
  const { token } = await params;
  const candidate = await getCandidateByToken(token);
  if (!candidate) notFound();
  const link = candidateLink(candidate.token);

  return (
    <AdminChrome>
      <section className="stack">
        <div className="spread">
          <div>
            <h1>{candidate.name}</h1>
            <p className="muted">{candidate.email}</p>
          </div>
          <div className="row">
            <a className="button" href={`/admin/candidates/${candidate.token}/export`}>
              Export transcripts
            </a>
            <a className="button" href="/admin">
              Back
            </a>
          </div>
        </div>

        <div className="grid">
          <div className="panel stack">
            <h2>Private Link</h2>
            <input readOnly value={link} />
            <textarea readOnly value={emailTemplate(candidate.name, link)} style={{ minHeight: 320 }} />
          </div>

          <div className="panel stack">
            <h2>Status</h2>
            <div className="badge">{candidate.status}</div>
            <div className="small muted">
              Created: {fmt(candidate.createdAt)}
              <br />
              Opened: {fmt(candidate.openedAt)}
              <br />
              Submitted: {fmt(candidate.submittedAt)}
              <br />
              Reviewed: {fmt(candidate.reviewedAt)}
            </div>
            <form action={setCandidateStatus} className="row">
              <input type="hidden" name="token" value={candidate.token} />
              <button className="button" name="status" value="Reviewed">
                Mark reviewed
              </button>
              <button className="button" name="status" value="Passed">
                Mark pass
              </button>
              <button className="button danger" name="status" value="Rejected">
                Mark reject
              </button>
            </form>
          </div>
        </div>

        <div className="panel stack">
          <h2>Scoring</h2>
          {candidate.scores.selfCheck?.warnings.length ? (
            <div className="panel warning">
              {candidate.scores.selfCheck.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </div>
          ) : (
            <div className="badge">Self-check OK: Part A 0% WER, Part B 0% WER, speakers 100%</div>
          )}
          {candidate.scores.summary ? (
            <div>
              <h3>Final suggested status</h3>
              <div>
                <strong>{candidate.scores.summary.overall}</strong> - {candidate.scores.summary.averageWer}% average WER shown for context only
              </div>
              {candidate.scores.summary.issues.length ? <div className="danger">{candidate.scores.summary.issues.join(", ")}</div> : <div className="muted">No automatic scoring issues.</div>}
            </div>
          ) : (
            <div className="muted">Overall auto summary appears after both parts are submitted and scored.</div>
          )}
          <div className="grid">
            <div>
              <h3>Part A</h3>
              {scoreLine("WER", candidate.scores.partA?.wer)}
              {scoreLine("CER", candidate.scores.partA?.cer)}
              {scoreLine("Whisper baseline WER", candidate.scores.whisperBaseline?.partA?.wer)}
              {scoreLine("Whisper baseline CER", candidate.scores.whisperBaseline?.partA?.cer)}
              {improvementLine("WER improvement", candidate.scores.improvement?.partA?.werPercentagePoints)}
              {improvementLine("CER improvement", candidate.scores.improvement?.partA?.cerPercentagePoints)}
              {scoreLine("Similarity to Whisper draft", candidate.scores.improvement?.partA?.draftSimilarity)}
              <div>Sub / Del / Ins: {candidate.scores.partA ? `${candidate.scores.partA.substitutions} / ${candidate.scores.partA.deletions} / ${candidate.scores.partA.insertions}` : "-"}</div>
              <div className="danger">{candidate.scores.partA?.redFlags.join(", ")}</div>
            </div>
            <div>
              <h3>Part B</h3>
              {scoreLine("WER", candidate.scores.partB?.wer)}
              {scoreLine("CER", candidate.scores.partB?.cer)}
              {scoreLine("Whisper baseline WER", candidate.scores.whisperBaseline?.partB?.wer)}
              {scoreLine("Whisper baseline CER", candidate.scores.whisperBaseline?.partB?.cer)}
              {improvementLine("WER improvement", candidate.scores.improvement?.partB?.werPercentagePoints)}
              {improvementLine("CER improvement", candidate.scores.improvement?.partB?.cerPercentagePoints)}
              {scoreLine("Similarity to Whisper draft", candidate.scores.improvement?.partB?.draftSimilarity)}
              {scoreLine("Speaker sequence accuracy", candidate.scores.partB?.speakerSequenceAccuracy)}
              <div>
                Speakers ref/candidate:{" "}
                {candidate.scores.partB ? `${candidate.scores.partB.referenceSpeakerCount} / ${candidate.scores.partB.candidateSpeakerCount}` : "-"}
              </div>
              <div className="danger">{candidate.scores.partB?.redFlags.join(", ")}</div>
            </div>
          </div>
          <form action={rerunScoring}>
            <input type="hidden" name="token" value={candidate.token} />
            <button className="button" type="submit">
              Run/re-run scoring
            </button>
          </form>
        </div>

        <div className="grid">
          <div className="panel stack">
            <h2>Submissions</h2>
            <label>
              Part A transcript
              <textarea readOnly value={candidate.partASubmission || candidate.partADraft || ""} />
            </label>
            <label>
              Part A Whisper baseline
              <textarea readOnly value={candidate.partAWhisperDraft || ""} />
            </label>
            <label>
              Part B transcript
              <textarea readOnly value={candidate.partBSubmission || candidate.partBDraft || ""} />
            </label>
            <label>
              Part B Whisper baseline
              <textarea readOnly value={candidate.partBWhisperDraft || ""} />
            </label>
          </div>

          <form action={updateReview} className="panel stack">
            <h2>Manual Review</h2>
            <input type="hidden" name="token" value={candidate.token} />
            <label>
              Manual formatting/diarization score /10
              <input name="formattingScore" type="number" min="0" max="10" step="1" defaultValue={candidate.formattingScore ?? ""} />
            </label>
            <p className="muted small">
              Covers speaker labels, turn breaks, overlap tags, merged speakers, dropped turns, and general style-guide compliance.
            </p>
            <label>
              Decision
              <select name="decision" defaultValue={candidate.decision}>
                <option value="">Unset</option>
                <option value="Pass">Pass</option>
                <option value="Borderline">Borderline</option>
                <option value="Reject">Reject</option>
              </select>
            </label>
            <label>
              Tier
              <select name="tier" defaultValue={candidate.tier}>
                <option value="">Unset</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="Reject">Reject</option>
              </select>
            </label>
            <label>
              Notes
              <textarea name="notes" defaultValue={candidate.notes || ""} />
            </label>
            <label>
              Red flags
              <textarea name="redFlags" defaultValue={candidate.redFlags || ""} />
            </label>
            <button className="button primary" type="submit">
              Save review
            </button>
          </form>
        </div>

        <form action={updateKeys} className="panel stack">
          <h2>Final Answer Keys</h2>
          <p className="muted">These fields are admin-only and are used for grading. Candidate-facing Whisper drafts are not treated as answer keys.</p>
          <div className="grid">
            <label>
              Upload Part A key
              <input name="partAKeyFile" type="file" accept=".txt,text/plain" />
            </label>
            <label>
              Upload Part B key
              <input name="partBKeyFile" type="file" accept=".txt,text/plain" />
            </label>
          </div>
          <input type="hidden" name="token" value={candidate.token} />
          <label>
            Part A key
            <textarea name="partAKey" defaultValue={candidate.partAKey} required />
          </label>
          <label>
            Part B key
            <textarea name="partBKey" defaultValue={candidate.partBKey} required />
          </label>
          <button className="button" type="submit">
            Save keys and self-check
          </button>
        </form>

        <form action={deleteCandidateAction} className="panel stack">
          <h2>Delete Candidate</h2>
          <p className="muted">Deletes the candidate record and transcript submissions. Uploaded audio files may remain in object storage for manual retention cleanup.</p>
          <input type="hidden" name="token" value={candidate.token} />
          <button className="button danger" type="submit">
            Delete candidate
          </button>
        </form>
      </section>
    </AdminChrome>
  );
}
