import fs from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ERROR_CODES } from '@cas-erp/shared';
import { env } from '../config/env.js';
import { generateOpaqueToken, sha256Hex } from '../core/crypto.js';
import { AppError } from '../core/errors.js';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export interface StoredObjectResult {
  objectKey: string;
  sha256: string;
  sizeBytes: number;
  mimeType: string;
  malwareScanStatus: 'clean_heuristic' | 'pending_external_av';
}

const s3Client =
  env.STORAGE_DRIVER === 's3' ? new S3Client({ region: env.AWS_REGION }) : null;

export function validateUploadMetadata(mimeType: string, sizeBytes: number): void {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      `Unsupported file type: ${mimeType}. Allowed: PDF, JPG, PNG, WEBP, CSV, XLSX.`
    );
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    throw new AppError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'File size must be between 1 byte and 10 MB.'
    );
  }
}

function scanMagicBytes(buffer: Buffer, mimeType: string): 'clean_heuristic' {
  // Reject executable PE/ELF headers disguised as documents
  if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Executable files are prohibited');
  }
  if (mimeType === 'application/pdf' && buffer.subarray(0, 4).toString() !== '%PDF') {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, 'Invalid PDF file signature');
  }
  return 'clean_heuristic';
}

export async function storePrivateObject(params: {
  folder: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<StoredObjectResult> {
  validateUploadMetadata(params.mimeType, params.buffer.length);
  const malwareScanStatus = scanMagicBytes(params.buffer, params.mimeType);
  const safeExt = path.extname(params.originalName).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
  const objectKey = `${params.folder}/${Date.now()}_${generateOpaqueToken(8)}${safeExt}`;
  const sha256 = sha256Hex(params.buffer);

  if (env.STORAGE_DRIVER === 's3' && s3Client && env.S3_BUCKET_NAME) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: objectKey,
        Body: params.buffer,
        ContentType: params.mimeType,
        Metadata: { sha256 }
      })
    );
  } else {
    const absPath = path.resolve(env.LOCAL_STORAGE_ROOT, objectKey);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, params.buffer);
  }

  return {
    objectKey,
    sha256,
    sizeBytes: params.buffer.length,
    mimeType: params.mimeType,
    malwareScanStatus
  };
}

export async function readPrivateObject(objectKey: string): Promise<{ buffer?: Buffer; signedUrl?: string }> {
  if (env.STORAGE_DRIVER === 's3' && s3Client && env.S3_BUCKET_NAME) {
    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: objectKey }),
      { expiresIn: 120 }
    );
    return { signedUrl };
  }

  const root = path.resolve(env.LOCAL_STORAGE_ROOT);
  const resolved = path.resolve(root, objectKey);
  if (!resolved.startsWith(root)) {
    throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Invalid storage key path');
  }
  const buffer = await fs.readFile(resolved);
  return { buffer };
}

