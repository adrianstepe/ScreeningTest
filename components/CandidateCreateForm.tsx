"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCandidate } from "@/app/actions";

type ScreeningDefaults = {
  partADraft: string;
  partBDraft: string;
  partAKey: string;
  partBKey: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button primary" disabled={pending} type="submit">
      {pending ? "Creating link..." : "Generate private link"}
    </button>
  );
}

export function CandidateCreateForm({ defaults }: { defaults: ScreeningDefaults }) {
  const [state, formAction] = useActionState(createCandidate, null);

  return (
    <form action={formAction} className="stack">
      {state?.error && (
        <div className="danger-panel" role="alert">
          {state.error}
        </div>
      )}

      <div className="grid">
        <label>
          Candidate name
          <input name="name" required />
        </label>
        <label>
          Candidate email
          <input name="email" required type="email" />
        </label>
        <label>
          Optional deadline
          <input name="deadlineAt" type="datetime-local" />
        </label>
      </div>
      <div className="grid">
        <label>
          Part A audio
          <input accept="audio/*" name="partAAudio" type="file" />
        </label>
        <label>
          Part B audio
          <input accept="audio/*" name="partBAudio" type="file" />
        </label>
      </div>
      <p className="muted small">Leave audio uploads empty to use the bundled screening files.</p>
      <div className="grid">
        <label>
          Upload Part A Whisper draft
          <input accept=".txt,text/plain" name="partADraftFile" type="file" />
        </label>
        <label>
          Upload Part B Whisper draft
          <input accept=".txt,text/plain" name="partBDraftFile" type="file" />
        </label>
      </div>
      <label>
        Part A Whisper draft shown to candidate
        <textarea defaultValue={defaults.partADraft} name="partADraft" />
      </label>
      <label>
        Part B Whisper draft shown to candidate
        <textarea defaultValue={defaults.partBDraft} name="partBDraft" />
      </label>
      <div className="grid">
        <label>
          Upload Part A final answer key
          <input accept=".txt,text/plain" name="partAKeyFile" type="file" />
        </label>
        <label>
          Upload Part B final answer key
          <input accept=".txt,text/plain" name="partBKeyFile" type="file" />
        </label>
      </div>
      <label>
        Part A final answer key
        <textarea defaultValue={defaults.partAKey} name="partAKey" />
      </label>
      <label>
        Part B final answer key
        <textarea defaultValue={defaults.partBKey} name="partBKey" placeholder="[S1]: ..." />
      </label>
      <SubmitButton />
    </form>
  );
}
