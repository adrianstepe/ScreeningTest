import { createCandidate } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { loadScreeningTextDefaults } from "@/lib/screeningMaterials";
import { AdminChrome } from "@/components/AdminChrome";

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
        <form action={createCandidate} className="stack">
          <div className="grid">
            <label>
              Candidate name
              <input name="name" required />
            </label>
            <label>
              Candidate email
              <input name="email" type="email" required />
            </label>
            <label>
              Optional deadline
              <input name="deadlineAt" type="datetime-local" />
            </label>
          </div>
          <div className="grid">
            <label>
              Part A audio
              <input name="partAAudio" type="file" accept="audio/*" />
            </label>
            <label>
              Part B audio
              <input name="partBAudio" type="file" accept="audio/*" />
            </label>
          </div>
          <p className="muted small">Leave audio uploads empty to use the local screening files from bench/Audio when available.</p>
          <div className="grid">
            <label>
              Upload Part A Whisper draft
              <input name="partADraftFile" type="file" accept=".txt,text/plain" />
            </label>
            <label>
              Upload Part B Whisper draft
              <input name="partBDraftFile" type="file" accept=".txt,text/plain" />
            </label>
          </div>
          <label>
            Part A Whisper draft shown to candidate
            <textarea name="partADraft" defaultValue={defaults.partADraft} />
          </label>
          <label>
            Part B Whisper draft shown to candidate
            <textarea name="partBDraft" defaultValue={defaults.partBDraft} />
          </label>
          <div className="grid">
            <label>
              Upload Part A final answer key
              <input name="partAKeyFile" type="file" accept=".txt,text/plain" />
            </label>
            <label>
              Upload Part B final answer key
              <input name="partBKeyFile" type="file" accept=".txt,text/plain" />
            </label>
          </div>
          <label>
            Part A final answer key
            <textarea name="partAKey" defaultValue={defaults.partAKey} />
          </label>
          <label>
            Part B final answer key
            <textarea name="partBKey" defaultValue={defaults.partBKey} placeholder="[S1]: ..." />
          </label>
          <button className="button primary" type="submit">
            Generate private link
          </button>
        </form>
      </section>
    </AdminChrome>
  );
}
