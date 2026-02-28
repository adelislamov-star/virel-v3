// CLOUDFLARE R2 STORAGE CLIENT
// Uses S3-compatible API via @aws-sdk/client-s3

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

// R2 client (S3-compatible)
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME || 'virel-media';
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// -------------------------------------------
// KEY HELPERS
// -------------------------------------------

export function buildKey(modelId: string, filename: string): string {
  return `models/${modelId}/${filename}`;
}

export function buildUrl(key: string): string {
  return `${CDN_URL}/${key}`;
}

// -------------------------------------------
// UPLOAD
// -------------------------------------------

export interface UploadResult {
  key: string;
  url: string;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
}

export async function uploadMedia(
  buffer: Buffer,
  key: string,
  mimeType: string,
): Promise<UploadResult> {
  let processedBuffer = buffer;
  let width: number | undefined;
  let height: number | undefined;

  // Process images with sharp (convert to WebP)
  if (mimeType.startsWith('image/') && mimeType !== 'image/gif') {
    const image = sharp(buffer);
    const meta = await image.metadata();
    width = meta.width;
    height = meta.height;

    processedBuffer = await image
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    key = key.replace(/\.[^.]+$/, '.webp');
    mimeType = 'image/webp';
  }

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: processedBuffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000',
    }),
  );

  return { key, url: buildUrl(key), width, height, size: processedBuffer.byteLength, mimeType };
}

// -------------------------------------------
// GENERATE THUMBNAIL (for images)
// -------------------------------------------

export async function generateThumbnail(
  buffer: Buffer,
  baseKey: string,
): Promise<{ key: string; url: string }> {
  const thumbKey = baseKey.replace(/(\.[^.]+)$/, '_thumb.webp');

  const thumbBuffer = await sharp(buffer)
    .resize({ width: 400, height: 500, fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer();

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: thumbKey,
      Body: thumbBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000',
    }),
  );

  return { key: thumbKey, url: buildUrl(thumbKey) };
}

// -------------------------------------------
// DELETE
// -------------------------------------------

export async function deleteMedia(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  // Also try to delete thumbnail
  const thumbKey = key.replace(/(\.[^.]+)$/, '_thumb.webp');
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: thumbKey }));
  } catch {}
}

// -------------------------------------------
// PRESIGNED UPLOAD URL
// -------------------------------------------

export async function getPresignedUploadUrl(
  key: string,
  mimeType: string,
  expiresIn = 300,
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
  return getSignedUrl(r2, command, { expiresIn });
}
