# ScreeningTest

Private transcription screening app for Stepe Digital candidates.

## What It Does

- Creates private candidate screening links.
- Serves Part A and Part B audio privately.
- Shows Whisper draft transcripts for candidates to correct.
- Grades submitted transcripts against final answer keys with WER/CER.
- Adds Part B speaker-label sequence scoring.
- Stores candidate status, submissions, scores, and manual review notes.

## Screening Materials

The app includes the current screening materials under `screening/Audio`:

- `PartA.mp3`
- `PartA_TTest.txt` - candidate-facing Whisper draft
- `PartA_TFinal.txt` - final answer key
- `PartB.wav`
- `PartB_TTest.txt` - candidate-facing Whisper draft
- `PartB_TFinal.txt` - final answer key

The `*_TTest.txt` files are never used as answer keys. Grading uses only `*_TFinal.txt`.

## Local Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the required auth/storage/database settings for a deployed environment.

## Checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```
