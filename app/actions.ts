"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteCandidate, getCandidateByToken, saveCandidate, saveFile } from "@/lib/db";
import { selfCheck } from "@/lib/scoring";
import { screeningMaterialPaths } from "@/lib/screeningMaterials";
import { storeAudio, storeAudioBytes } from "@/lib/storage";
import { calculateCandidateScores, recordCandidateSubmission } from "@/lib/workflows";
import type { Candidate, CandidateStatus, Decision, Tier } from "@/lib/types";

async function textFromFormValue(value: FormDataEntryValue | null) {
  if (value instanceof File && value.size > 0) return value.text();
  return typeof value === "string" ? value : "";
}

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

async function uploadAudio(formData: FormData, key: string) {
  const value = formData.get(key);
  if (!(value instanceof File) || value.size === 0) return undefined;
  const stored = await storeAudio(value);
  await saveFile(stored);
  return stored.id;
}

async function uploadAudioOrDefault(formData: FormData, key: string, defaultPath: string, mimeType: string) {
  const uploaded = await uploadAudio(formData, key);
  if (uploaded) return uploaded;

  const bytes = await readFile(defaultPath);
  const stored = await storeAudioBytes(path.basename(defaultPath), mimeType, bytes);
  await saveFile(stored);
  return stored.id;
}

export async function createCandidate(formData: FormData) {
  await requireAdmin();
  const partAKey = (await textFromFormValue(formData.get("partAKeyFile"))) || requiredString(formData, "partAKey");
  const partBKey = (await textFromFormValue(formData.get("partBKeyFile"))) || requiredString(formData, "partBKey");
  const partADraft = (await textFromFormValue(formData.get("partADraftFile"))) || ((formData.get("partADraft") as string | null)?.trim() || undefined);
  const partBDraft = (await textFromFormValue(formData.get("partBDraftFile"))) || ((formData.get("partBDraft") as string | null)?.trim() || undefined);
  const partAAudioFileId = await uploadAudioOrDefault(formData, "partAAudio", screeningMaterialPaths.partAAudio, "audio/mpeg");
  const partBAudioFileId = await uploadAudioOrDefault(formData, "partBAudio", screeningMaterialPaths.partBAudio, "audio/wav");
  if (!partAAudioFileId || !partBAudioFileId) throw new Error("Both audio files are required");

  const now = new Date().toISOString();
  const candidate: Candidate = {
    id: randomUUID(),
    token: randomBytes(32).toString("hex"),
    name: requiredString(formData, "name"),
    email: requiredString(formData, "email"),
    status: "Created",
    deadlineAt: (formData.get("deadlineAt") as string | null) || undefined,
    createdAt: now,
    partAAudioFileId,
    partBAudioFileId,
    partAKey,
    partBKey,
    partADraft,
    partBDraft,
    scores: { selfCheck: selfCheck(partAKey, partBKey) },
    decision: "",
    tier: ""
  };

  await saveCandidate(candidate);
  revalidatePath("/admin");
  redirect(`/admin/candidates/${candidate.token}`);
}

export async function submitCandidate(formData: FormData) {
  const token = requiredString(formData, "token");
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Invalid test link");

  const partASubmission = requiredString(formData, "partA");
  const partBSubmission = requiredString(formData, "partB");
  await recordCandidateSubmission(candidate.token, partASubmission, partBSubmission);
  revalidatePath(`/test/${token}`);
  redirect(`/test/${token}/submitted`);
}

export async function rerunScoring(formData: FormData) {
  await requireAdmin();
  const token = requiredString(formData, "token");
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Candidate not found");
  candidate.scores = calculateCandidateScores(candidate);
  await saveCandidate(candidate);
  revalidatePath(`/admin/candidates/${token}`);
}

export async function updateKeys(formData: FormData) {
  await requireAdmin();
  const token = requiredString(formData, "token");
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Candidate not found");
  candidate.partAKey = (await textFromFormValue(formData.get("partAKeyFile"))) || requiredString(formData, "partAKey");
  candidate.partBKey = (await textFromFormValue(formData.get("partBKeyFile"))) || requiredString(formData, "partBKey");
  candidate.scores = calculateCandidateScores(candidate);
  await saveCandidate(candidate);
  revalidatePath(`/admin/candidates/${token}`);
}

export async function updateReview(formData: FormData) {
  await requireAdmin();
  const token = requiredString(formData, "token");
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Candidate not found");

  const formattingRaw = formData.get("formattingScore");
  const formattingScore = typeof formattingRaw === "string" && formattingRaw !== "" ? Number(formattingRaw) : undefined;
  if (formattingScore !== undefined && (formattingScore < 0 || formattingScore > 10)) throw new Error("Formatting score must be 0-10");

  candidate.formattingScore = formattingScore;
  candidate.decision = ((formData.get("decision") as Decision) || "") as Decision;
  candidate.tier = ((formData.get("tier") as Tier) || "") as Tier;
  candidate.notes = (formData.get("notes") as string | null) || "";
  candidate.redFlags = (formData.get("redFlags") as string | null) || "";
  candidate.reviewedAt = new Date().toISOString();
  candidate.status = candidate.decision === "Pass" ? "Passed" : candidate.decision === "Reject" ? "Rejected" : "Reviewed";
  await saveCandidate(candidate);
  revalidatePath("/admin");
  revalidatePath(`/admin/candidates/${token}`);
}

export async function setCandidateStatus(formData: FormData) {
  await requireAdmin();
  const token = requiredString(formData, "token");
  const status = requiredString(formData, "status") as CandidateStatus;
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Candidate not found");
  candidate.status = status;
  if (["Reviewed", "Rejected", "Passed"].includes(status)) candidate.reviewedAt = new Date().toISOString();
  await saveCandidate(candidate);
  revalidatePath("/admin");
  revalidatePath(`/admin/candidates/${token}`);
}

export async function deleteCandidateAction(formData: FormData) {
  await requireAdmin();
  const token = requiredString(formData, "token");
  const candidate = await getCandidateByToken(token);
  if (!candidate) throw new Error("Candidate not found");
  await deleteCandidate(candidate.id);
  revalidatePath("/admin");
  redirect("/admin");
}
