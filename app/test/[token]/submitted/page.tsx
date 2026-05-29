import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/db";

export default async function SubmittedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const candidate = await getCandidateByToken(token);
  if (!candidate) notFound();

  return (
    <main className="shell">
      <section className="panel stack">
        <h1>Submission received</h1>
        <p>Thank you, {candidate.name}. Your transcription test has been submitted.</p>
      </section>
    </main>
  );
}
