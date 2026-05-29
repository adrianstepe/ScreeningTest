import { readFile } from "node:fs/promises";
import path from "node:path";
import type { UploadedFile } from "@/lib/types";

const audioDir = path.join(process.cwd(), "screening", "Audio");

export const screeningMaterialPaths = {
  partAAudio: path.join(audioDir, "PartA.mp3"),
  partBAudio: path.join(audioDir, "PartB.wav"),
  partADraft: path.join(audioDir, "PartA_TTest.txt"),
  partBDraft: path.join(audioDir, "PartB_TTest.txt"),
  partAKey: path.join(audioDir, "PartA_TFinal.txt"),
  partBKey: path.join(audioDir, "PartB_TFinal.txt")
};

export const defaultAudioFiles = {
  partA: {
    id: "default-part-a-audio",
    originalName: "PartA.mp3",
    storageKey: "builtin:partA",
    mimeType: "audio/mpeg",
    size: 483986,
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  partB: {
    id: "default-part-b-audio",
    originalName: "PartB.wav",
    storageKey: "builtin:partB",
    mimeType: "audio/wav",
    size: 3113644,
    createdAt: "2026-01-01T00:00:00.000Z"
  }
} satisfies Record<string, UploadedFile>;

export function defaultAudioFileById(id?: string) {
  return Object.values(defaultAudioFiles).find((file) => file.id === id);
}

export function defaultAudioPath(storageKey: string) {
  if (storageKey === defaultAudioFiles.partA.storageKey) return screeningMaterialPaths.partAAudio;
  if (storageKey === defaultAudioFiles.partB.storageKey) return screeningMaterialPaths.partBAudio;
  return undefined;
}

async function readOptionalText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

export async function loadScreeningTextDefaults() {
  const [partADraft, partBDraft, partAKey, partBKey] = await Promise.all([
    readOptionalText(screeningMaterialPaths.partADraft),
    readOptionalText(screeningMaterialPaths.partBDraft),
    readOptionalText(screeningMaterialPaths.partAKey),
    readOptionalText(screeningMaterialPaths.partBKey)
  ]);

  return { partADraft, partBDraft, partAKey, partBKey };
}
