"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitCandidate } from "@/app/actions";

type Props = {
  token: string;
  name: string;
  partADraft?: string;
  partBDraft?: string;
};

function insertAtCursor(textarea: HTMLTextAreaElement | null, snippet: string) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  textarea.value = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
}

function timestamp(audio: HTMLAudioElement | null) {
  const seconds = Math.floor(audio?.currentTime || 0);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `[${hh}:${mm}:${ss}] `;
}

export function TestForm({ token, name, partADraft, partBDraft }: Props) {
  const [partA, setPartA] = useState(partADraft || "");
  const [partB, setPartB] = useState(partBDraft || "");
  const [dirty, setDirty] = useState(false);
  const [confirmedInstructions, setConfirmedInstructions] = useState(false);
  const [savedAt, setSavedAt] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const partARef = useRef<HTMLTextAreaElement>(null);
  const partBRef = useRef<HTMLTextAreaElement>(null);
  const audioARef = useRef<HTMLAudioElement>(null);
  const audioBRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/test/${token}/draft`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ partA, partB })
      });
      if (response.ok) {
        setSavedAt(new Date().toLocaleTimeString("lv-LV"));
        setDirty(false);
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [dirty, partA, partB, token]);

  function helper(snippet: string, part: "a" | "b") {
    insertAtCursor(part === "a" ? partARef.current : partBRef.current, snippet);
  }

  function onSubmit(formData: FormData) {
    setDirty(false);
    startTransition(() => submitCandidate(formData));
  }

  return (
    <form action={onSubmit} className="stack">
      <input type="hidden" name="token" value={token} />
      <section className="panel stack">
        <h1>Transkripcijas tests: {name}</h1>
        <details className="instructions stack" open>
          <summary>Instructions before starting</summary>
          <div className="grid">
            <div>
              <h2>General rules</h2>
              <ul>
                <li>The visible transcript is a Whisper draft, not the correct answer.</li>
                <li>Listen to the audio and correct the draft as accurately as possible.</li>
                <li>Write what is actually said, not what the speaker probably meant. Do not paraphrase or shorten the text.</li>
                <li>Keep full Latvian diacritics: ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž.</li>
                <li>Keep audible fillers and hesitations when they are part of the speech, such as “ē”, “ēē”, “ā”, “emm”, “mmm”, “nu”, “tātad”.</li>
                <li>Keep false starts and self-corrections, for example “Mēs ej- mēs iesim...”.</li>
                <li>Keep repetitions, for example “es es es domāju...”.</li>
                <li>If something cannot be understood, write [inaudible].</li>
                <li>If you have a likely guess but are not sure, write [unclear: word?].</li>
              </ul>
            </div>
            <div>
              <h2>Part A</h2>
              <ul>
                <li>Part A is normal transcription correction.</li>
                <li>If Part A has one speaker, speaker labels are not required.</li>
              </ul>

              <h2>Part B</h2>
              <ul>
                <li>Part B requires speaker labels.</li>
                <li>Use the format [S1]: Text..., [S2]: Text..., [S1]: Text...</li>
                <li>The same speaker must keep the same label throughout the file.</li>
                <li>Start a new line each time the speaker changes.</li>
                <li>For overlap, use [overlap] ... [/overlap] where possible.</li>
                <li>Do not merge two speakers into one line.</li>
              </ul>
            </div>
          </div>
        </details>
        <div className="grid">
          <div>
            <h2>Privacy</h2>
            <p>
              This test is used to evaluate transcription suitability. Your name, email, submissions, timestamps, and scores are stored.
              Audio/test materials are confidential and must not be shared. Do not include unnecessary personal data in answers. Contact:{" "}
              <a href="mailto:adrians@stepedigital.com">adrians@stepedigital.com</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="panel stack">
        <h2>Part A</h2>
        <audio ref={audioARef} controls preload="metadata" src={`/audio/${token}/a`} />
        <div className="helperbar">
          <button type="button" className="button" onClick={() => helper("[inaudible] ", "a")}>
            [inaudible]
          </button>
          <button type="button" className="button" onClick={() => helper("[unclear: ?] ", "a")}>
            [unclear: ?]
          </button>
          <button type="button" className="button" onClick={() => helper(timestamp(audioARef.current), "a")}>
            timestamp
          </button>
        </div>
        <textarea
          ref={partARef}
          name="partA"
          required
          value={partA}
          onChange={(event) => {
            setPartA(event.target.value);
            setDirty(true);
          }}
        />
      </section>

      <section className="panel stack">
        <h2>Part B</h2>
        <audio ref={audioBRef} controls preload="metadata" src={`/audio/${token}/b`} />
        <div className="helperbar">
          {["[S1]: ", "[S2]: ", "[S3]: ", "[inaudible] ", "[unclear: ?] ", "[overlap] ", "[/overlap] "].map((item) => (
            <button key={item} type="button" className="button" onClick={() => helper(item, "b")}>
              {item.trim()}
            </button>
          ))}
          <button type="button" className="button" onClick={() => helper(timestamp(audioBRef.current), "b")}>
            timestamp
          </button>
        </div>
        <textarea
          ref={partBRef}
          name="partB"
          required
          value={partB}
          onChange={(event) => {
            setPartB(event.target.value);
            setDirty(true);
          }}
        />
      </section>

      <section className="panel stack">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="instructionConfirmation"
            checked={confirmedInstructions}
            onChange={(event) => setConfirmedInstructions(event.target.checked)}
            required
          />
          <span>I confirm that I listened to the audio and corrected the Whisper draft according to the instructions.</span>
        </label>
      </section>

      <div className="spread">
        <span className="muted small">{savedAt ? `Draft saved ${savedAt}` : "Draft saves automatically while you type."}</span>
        <button className="button primary" type="submit" disabled={isPending || !partA.trim() || !partB.trim() || !confirmedInstructions}>
          {isPending ? "Submitting..." : "Submit test"}
        </button>
      </div>
    </form>
  );
}
