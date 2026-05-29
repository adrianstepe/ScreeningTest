import { readFile } from "node:fs/promises";
import path from "node:path";

const audioDir = path.join(process.cwd(), "screening", "Audio");

export const screeningMaterialPaths = {
  partAAudio: path.join(audioDir, "PartA.mp3"),
  partBAudio: path.join(audioDir, "PartB.wav"),
  partADraft: path.join(audioDir, "PartA_TTest.txt"),
  partBDraft: path.join(audioDir, "PartB_TTest.txt"),
  partAKey: path.join(audioDir, "PartA_TFinal.txt"),
  partBKey: path.join(audioDir, "PartB_TFinal.txt")
};

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
