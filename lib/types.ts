export const statuses = [
  "Created",
  "Opened",
  "In progress",
  "Submitted",
  "Reviewed",
  "Rejected",
  "Passed"
] as const;

export type CandidateStatus = (typeof statuses)[number];
export type Decision = "" | "Pass" | "Borderline" | "Reject";
export type Tier = "" | "A" | "B" | "Reject";

export type UploadedFile = {
  id: string;
  originalName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type PartScore = {
  wer: number;
  cer: number;
  substitutions: number;
  deletions: number;
  insertions: number;
  redFlags: string[];
};

export type DiarizationScore = PartScore & {
  speakerSequenceAccuracy: number;
  referenceSpeakerCount: number;
  candidateSpeakerCount: number;
  referenceTurnCount: number;
  candidateTurnCount: number;
};

export type Scores = {
  partA?: PartScore;
  partB?: DiarizationScore;
  summary?: {
    overall: "Pass" | "Borderline" | "Fail";
    averageWer: number;
    issues: string[];
  };
  selfCheck?: {
    partAOk: boolean;
    partBTextOk: boolean;
    partBSpeakersOk: boolean;
    warnings: string[];
  };
};

export type Candidate = {
  id: string;
  token: string;
  name: string;
  email: string;
  status: CandidateStatus;
  deadlineAt?: string;
  createdAt: string;
  openedAt?: string;
  submittedAt?: string;
  reviewedAt?: string;
  partAAudioFileId?: string;
  partBAudioFileId?: string;
  partAKey: string;
  partBKey: string;
  partADraft?: string;
  partBDraft?: string;
  partASubmission?: string;
  partBSubmission?: string;
  scores: Scores;
  formattingScore?: number;
  decision: Decision;
  tier: Tier;
  notes?: string;
  redFlags?: string;
};

export type AppDatabase = {
  candidates: Candidate[];
  files: UploadedFile[];
};
