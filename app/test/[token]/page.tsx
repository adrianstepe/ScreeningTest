import { notFound } from "next/navigation";
import { getCandidateByToken, saveCandidate } from "@/lib/db";
import { TestForm } from "@/components/TestForm";

export const dynamic = "force-dynamic";

export default async function CandidateTestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const candidate = await getCandidateByToken(token);
  if (!candidate) notFound();

  if (!candidate.openedAt) {
    candidate.openedAt = new Date().toISOString();
    candidate.status = candidate.status === "Created" ? "Opened" : candidate.status;
    await saveCandidate(candidate);
  }

  if (candidate.submittedAt) {
    return (
      <main className="shell">
        <section className="panel stack">
          <h1>Test already submitted</h1>
          <p className="muted">Thank you, {candidate.name}. Your submission was received on {new Date(candidate.submittedAt).toLocaleString("lv-LV")}.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <TestForm token={candidate.token} name={candidate.name} partADraft={candidate.partADraft} partBDraft={candidate.partBDraft} />
    </main>
  );
}
