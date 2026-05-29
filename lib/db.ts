import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import type { AppDatabase, Candidate, UploadedFile } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const jsonPath = path.join(dataDir, "db.json");
const databaseUrl = process.env.DATABASE_URL;
const usePostgres = Boolean(databaseUrl && /^postgres(ql)?:\/\//i.test(databaseUrl));

let pool: Pool | undefined;

function pg() {
  if (!pool) pool = new Pool({ connectionString: databaseUrl });
  return pool;
}

async function readJson(): Promise<AppDatabase> {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(jsonPath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, "")) as AppDatabase;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const empty: AppDatabase = { candidates: [], files: [] };
    await writeFile(jsonPath, JSON.stringify(empty, null, 2));
    return empty;
  }
}

async function writeJson(db: AppDatabase) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(jsonPath, JSON.stringify(db, null, 2));
}

function rowToCandidate(row: Record<string, unknown>): Candidate {
  return {
    id: String(row.id),
    token: String(row.token),
    name: String(row.name),
    email: String(row.email),
    status: row.status as Candidate["status"],
    deadlineAt: (row.deadline_at as string | null) || undefined,
    createdAt: String(row.created_at),
    openedAt: (row.opened_at as string | null) || undefined,
    submittedAt: (row.submitted_at as string | null) || undefined,
    reviewedAt: (row.reviewed_at as string | null) || undefined,
    partAAudioFileId: (row.part_a_audio_file_id as string | null) || undefined,
    partBAudioFileId: (row.part_b_audio_file_id as string | null) || undefined,
    partAKey: String(row.part_a_key || ""),
    partBKey: String(row.part_b_key || ""),
    partADraft: (row.part_a_draft as string | null) || undefined,
    partBDraft: (row.part_b_draft as string | null) || undefined,
    partASubmission: (row.part_a_submission as string | null) || undefined,
    partBSubmission: (row.part_b_submission as string | null) || undefined,
    scores: (row.scores as Candidate["scores"]) || {},
    formattingScore: typeof row.formatting_score === "number" ? row.formatting_score : undefined,
    decision: (row.decision as Candidate["decision"]) || "",
    tier: (row.tier as Candidate["tier"]) || "",
    notes: (row.notes as string | null) || undefined,
    redFlags: (row.red_flags as string | null) || undefined
  };
}

function rowToFile(row: Record<string, unknown>): UploadedFile {
  return {
    id: String(row.id),
    originalName: String(row.original_name),
    storageKey: String(row.storage_key),
    mimeType: String(row.mime_type),
    size: Number(row.size),
    createdAt: String(row.created_at)
  };
}

export async function listCandidates() {
  if (usePostgres) {
    const result = await pg().query("select * from candidates order by created_at desc");
    return result.rows.map(rowToCandidate);
  }
  return (await readJson()).candidates.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCandidateByToken(token: string) {
  if (usePostgres) {
    const result = await pg().query("select * from candidates where token = $1 limit 1", [token]);
    return result.rows[0] ? rowToCandidate(result.rows[0]) : undefined;
  }
  return (await readJson()).candidates.find((candidate) => candidate.token === token);
}

export async function saveCandidate(candidate: Candidate) {
  if (usePostgres) {
    await pg().query(
      `insert into candidates (
        id, token, name, email, status, deadline_at, created_at, opened_at, submitted_at, reviewed_at,
        part_a_audio_file_id, part_b_audio_file_id, part_a_key, part_b_key, part_a_draft, part_b_draft,
        part_a_submission, part_b_submission, scores, formatting_score, decision, tier, notes, red_flags
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      )
      on conflict (id) do update set
        token = excluded.token, name = excluded.name, email = excluded.email, status = excluded.status,
        deadline_at = excluded.deadline_at, opened_at = excluded.opened_at, submitted_at = excluded.submitted_at,
        reviewed_at = excluded.reviewed_at, part_a_audio_file_id = excluded.part_a_audio_file_id,
        part_b_audio_file_id = excluded.part_b_audio_file_id, part_a_key = excluded.part_a_key,
        part_b_key = excluded.part_b_key, part_a_draft = excluded.part_a_draft, part_b_draft = excluded.part_b_draft,
        part_a_submission = excluded.part_a_submission, part_b_submission = excluded.part_b_submission,
        scores = excluded.scores, formatting_score = excluded.formatting_score, decision = excluded.decision,
        tier = excluded.tier, notes = excluded.notes, red_flags = excluded.red_flags`,
      [
        candidate.id,
        candidate.token,
        candidate.name,
        candidate.email,
        candidate.status,
        candidate.deadlineAt || null,
        candidate.createdAt,
        candidate.openedAt || null,
        candidate.submittedAt || null,
        candidate.reviewedAt || null,
        candidate.partAAudioFileId || null,
        candidate.partBAudioFileId || null,
        candidate.partAKey,
        candidate.partBKey,
        candidate.partADraft || null,
        candidate.partBDraft || null,
        candidate.partASubmission || null,
        candidate.partBSubmission || null,
        candidate.scores,
        candidate.formattingScore ?? null,
        candidate.decision,
        candidate.tier,
        candidate.notes || null,
        candidate.redFlags || null
      ]
    );
    return;
  }
  const db = await readJson();
  const index = db.candidates.findIndex((item) => item.id === candidate.id);
  if (index >= 0) db.candidates[index] = candidate;
  else db.candidates.push(candidate);
  await writeJson(db);
}

export async function deleteCandidate(id: string) {
  if (usePostgres) {
    await pg().query("delete from candidates where id = $1", [id]);
    return;
  }
  const db = await readJson();
  db.candidates = db.candidates.filter((candidate) => candidate.id !== id);
  await writeJson(db);
}

export async function saveFile(file: UploadedFile) {
  if (usePostgres) {
    await pg().query(
      `insert into uploaded_files (id, original_name, storage_key, mime_type, size, created_at)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set original_name = excluded.original_name, storage_key = excluded.storage_key,
       mime_type = excluded.mime_type, size = excluded.size`,
      [file.id, file.originalName, file.storageKey, file.mimeType, file.size, file.createdAt]
    );
    return;
  }
  const db = await readJson();
  db.files = db.files.filter((item) => item.id !== file.id);
  db.files.push(file);
  await writeJson(db);
}

export async function getFile(id?: string) {
  if (!id) return undefined;
  if (usePostgres) {
    const result = await pg().query("select * from uploaded_files where id = $1 limit 1", [id]);
    return result.rows[0] ? rowToFile(result.rows[0]) : undefined;
  }
  return (await readJson()).files.find((file) => file.id === id);
}
