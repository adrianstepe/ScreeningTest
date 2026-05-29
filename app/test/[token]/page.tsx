import { notFound } from "next/navigation";
import { getCandidateByToken, getCandidateSubmissionStateByToken, saveCandidate } from "@/lib/db";
import { TestForm } from "@/components/TestForm";

export const dynamic = "force-dynamic";

export default async function CandidateTestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const submissionState = await getCandidateSubmissionStateByToken(token);
  if (!submissionState) notFound();

  if (submissionState.submittedAt) {
    return (
      <main className="shell">
        <section className="panel stack">
          <p className="muted">
            Thank you — your test has been submitted. We will review both parts and contact you with the next step if your result matches our
            quality requirements.
          </p>
        </section>
      </main>
    );
  }

  const candidate = await getCandidateByToken(token);
  if (!candidate) notFound();

  if (!candidate.openedAt) {
    candidate.openedAt = new Date().toISOString();
    candidate.status = candidate.status === "Created" ? "Opened" : candidate.status;
    await saveCandidate(candidate);
  }

  return (
    <main className="shell">
      <TestForm
        token={candidate.token}
        name={candidate.name}
        partADraft={candidate.partADraft || candidate.partAWhisperDraft}
        partBDraft={candidate.partBDraft || candidate.partBWhisperDraft}
      />
    </main>
  );
}
