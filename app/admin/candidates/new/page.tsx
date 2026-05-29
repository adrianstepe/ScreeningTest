import { requireAdmin } from "@/lib/auth";
import { loadScreeningTextDefaults } from "@/lib/screeningMaterials";
import { AdminChrome } from "@/components/AdminChrome";
import { CandidateCreateForm } from "@/components/CandidateCreateForm";

export default async function NewCandidatePage() {
  await requireAdmin();
  const defaults = await loadScreeningTextDefaults();

  return (
    <AdminChrome>
      <section className="panel stack">
        <div>
          <h1>Create Candidate</h1>
          <p className="muted">Whisper drafts are shown to candidates. Final answer keys are admin-only and are used for grading.</p>
        </div>
        <CandidateCreateForm defaults={defaults} />
      </section>
    </AdminChrome>
  );
}
