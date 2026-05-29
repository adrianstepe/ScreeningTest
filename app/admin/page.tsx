import { requireAdmin } from "@/lib/auth";
import { listCandidates } from "@/lib/db";
import { candidateLink } from "@/lib/links";
import { AdminChrome } from "@/components/AdminChrome";

export const dynamic = "force-dynamic";

function fmt(value?: string) {
  return value ? new Date(value).toLocaleString("lv-LV") : "-";
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
              <th>Part A WER</th>
              <th>Part B WER</th>
              <th>Speaker accuracy</th>
              <th>Auto summary</th>
              <th>Formatting</th>
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
                <td>{candidate.scores.partA ? `${candidate.scores.partA.wer}%` : "-"}</td>
                <td>{candidate.scores.partB ? `${candidate.scores.partB.wer}%` : "-"}</td>
                <td>{candidate.scores.partB ? `${candidate.scores.partB.speakerSequenceAccuracy}%` : "-"}</td>
                <td>
                  {candidate.scores.summary ? (
                    <>
                      <span className="badge">{candidate.scores.summary.overall}</span>
                      <br />
                      <span className="small">{candidate.scores.summary.averageWer}% avg WER</span>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td>{candidate.formattingScore ?? "-"}</td>
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
                <td colSpan={12} className="muted">
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
