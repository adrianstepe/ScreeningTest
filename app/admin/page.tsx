import { requireAdmin } from "@/lib/auth";
import { listCandidates } from "@/lib/db";
import { candidateLink } from "@/lib/links";
import { AdminChrome } from "@/components/AdminChrome";

export const dynamic = "force-dynamic";

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString("lv-LV") : "-";
}

function pct(value?: number) {
  return value === undefined ? "-" : `${value}%`;
}

function pp(value?: number) {
  return value === undefined ? "-" : `${value} pp`;
}

export default async function AdminDashboard() {
  await requireAdmin();
  const candidates = await listCandidates();

  return (
    <AdminChrome>
      <section className="stack">
        <div className="spread">
          <div>
            <h1>Candidate Dashboard</h1>
            <p className="muted">Create private tests, review submissions, run scoring, and export transcripts.</p>
          </div>
          <a className="button primary" href="/admin/candidates/new">
            Create candidate
          </a>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created / Opened / Submitted</th>
              <th>Part A WER/CER</th>
              <th>Part A baseline / improvement</th>
              <th>Part B WER/CER</th>
              <th>Part B baseline / improvement</th>
              <th>Speaker accuracy</th>
              <th>Suggested status</th>
              <th>Formatting</th>
              <th>Red flags</th>
              <th>Decision</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td>{candidate.name}</td>
                <td>{candidate.email}</td>
                <td>
                  <span className="badge">{candidate.status}</span>
                </td>
                <td className="small">
                  {fmt(candidate.createdAt)}
                  <br />
                  {fmt(candidate.openedAt)}
                  <br />
                  {fmt(candidate.submittedAt)}
                </td>
                <td>
                  {pct(candidate.scores.partA?.wer)}
                  <br />
                  <span className="small">{pct(candidate.scores.partA?.cer)} CER</span>
                </td>
                <td>
                  {pct(candidate.scores.whisperBaseline?.partA?.wer)}
                  <br />
                  <span className="small">{pp(candidate.scores.improvement?.partA?.werPercentagePoints)}</span>
                </td>
                <td>
                  {pct(candidate.scores.partB?.wer)}
                  <br />
                  <span className="small">{pct(candidate.scores.partB?.cer)} CER</span>
                </td>
                <td>
                  {pct(candidate.scores.whisperBaseline?.partB?.wer)}
                  <br />
                  <span className="small">{pp(candidate.scores.improvement?.partB?.werPercentagePoints)}</span>
                </td>
                <td>{pct(candidate.scores.partB?.speakerSequenceAccuracy)}</td>
                <td>
                  {candidate.scores.summary ? (
                    <>
                      <span className="badge">{candidate.scores.summary.overall}</span>
                      <br />
                      <span className="small">{candidate.scores.summary.averageWer}% avg WER context</span>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{candidate.formattingScore ?? "-"}</td>
                <td className="small">{[...(candidate.scores.partA?.redFlags || []), ...(candidate.scores.partB?.redFlags || [])].join(", ") || candidate.redFlags || "-"}</td>
                <td>{candidate.decision || "-"}</td>
                <td className="small">{candidate.notes || "-"}</td>
                <td className="stack">
                  <a className="button" href={`/admin/candidates/${candidate.token}`}>
                    View
                  </a>
                  <input readOnly value={candidateLink(candidate.token)} aria-label="Private link" />
                </td>
              </tr>
            ))}
            {!candidates.length && (
              <tr>
                <td colSpan={15} className="muted">
                  No candidates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AdminChrome>
  );
}
