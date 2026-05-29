import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import type { UploadedFile } from "@/lib/types";

const allowedTypes = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac", "audio/ogg", "audio/webm"]);
const maxBytes = 100 * 1024 * 1024;
const uploadDir = path.join(process.cwd(), "data", "uploads");

function storageProvider() {
  return process.env.STORAGE_PROVIDER || "local";
}

function cleanName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "audio";
}

function validateAudio(size: number, mimeType: string) {
  if (!size) throw new Error("Audio file is required");
  if (size > maxBytes) throw new Error("Audio file is larger than 100MB");
  if (!allowedTypes.has(mimeType)) throw new Error(`Unsupported audio type: ${mimeType || "unknown"}`);
}

function s3() {
  return new S3Client({
    region: process.env.STORAGE_REGION,
    credentials:
      process.env.STORAGE_ACCESS_KEY_ID && process.env.STORAGE_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
            secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
          }
        : undefined
  });
}

async function streamToBuffer(stream: ReadableStream | Readable | undefined) {
  if (!stream) return Buffer.alloc(0);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | Uint8Array>) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export async function storeAudio(formFile: File): Promise<UploadedFile> {
  validateAudio(formFile.size, formFile.type);
  return storeAudioBytes(formFile.name, formFile.type, Buffer.from(await formFile.arrayBuffer()));
}

export async function storeAudioBytes(originalName: string, mimeType: string, bytes: Buffer): Promise<UploadedFile> {
  validateAudio(bytes.length, mimeType);

  const id = randomUUID();
  const safeName = cleanName(originalName);
  const storageKey = `${id}-${safeName}`;

  if (storageProvider() === "s3") {
    const bucket = process.env.STORAGE_BUCKET;
    if (!bucket) throw new Error("STORAGE_BUCKET is required for S3 storage");
    await s3().send(new PutObjectCommand({ Bucket: bucket, Key: storageKey, Body: bytes, ContentType: mimeType }));
  } else {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, storageKey), bytes);
  }

  return {
    id,
    originalName: safeName,
    storageKey,
    mimeType,
    size: bytes.length,
    createdAt: new Date().toISOString()
  };
}

export async function readAudio(file: UploadedFile) {
  if (storageProvider() === "s3") {
    const bucket = process.env.STORAGE_BUCKET;
    if (!bucket) throw new Error("STORAGE_BUCKET is required for S3 storage");
    const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: file.storageKey }));
    return streamToBuffer(result.Body as Readable | undefined);
  }
  return readFile(path.join(uploadDir, file.storageKey));
}
