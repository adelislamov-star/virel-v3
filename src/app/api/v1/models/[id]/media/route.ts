// POST   /api/v1/models/[id]/media  — upload photo/video
// GET    /api/v1/models/[id]/media  — list all media
// PATCH  /api/v1/models/[id]/media  — reorder (sortOrder)

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { uploadMedia, generateThumbnail, buildKey } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// -----------------------------------------------
// GET — list media for model
// -----------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const media = await prisma.modelMedia.findMany({
      where: { modelId: params.id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ success: true, data: { media } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}

// -----------------------------------------------
// POST — upload new media file
// -----------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isPrimary = formData.get('isPrimary') === 'true';
    const isPublic = formData.get('isPublic') !== 'false'; // default true

    if (!file) {
      return NextResponse.json(
        { success: false, error: { message: 'No file provided' } },
        { status: 400 },
      );
    }

    // Validate type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { success: false, error: { message: 'Only images and videos are allowed' } },
        { status: 400 },
      );
    }

    // Validate size: images 20MB, videos 200MB
    const maxSize = isVideo ? 200 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { message: `File too large. Max ${isVideo ? '200MB' : '20MB'}` } },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileId = randomUUID();
    const key = buildKey(params.id, `${fileId}.${ext}`);

    // Upload to R2
    const result = await uploadMedia(buffer, key, file.type);

    // Generate thumbnail for images
    let thumbUrl: string | null = null;
    if (isImage) {
      try {
        const thumb = await generateThumbnail(buffer, result.key);
        thumbUrl = thumb.url;
      } catch (e) {
        console.error('Thumbnail generation failed:', e);
      }
    }

    // Get current max sort order
    const lastMedia = await prisma.modelMedia.findFirst({
      where: { modelId: params.id },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = (lastMedia?.sortOrder ?? -1) + 1;

    // If setting as primary, unset others
    if (isPrimary) {
      await prisma.modelMedia.updateMany({
        where: { modelId: params.id },
        data: { isPrimary: false },
      });
    }

    // Save to DB
    const media = await prisma.modelMedia.create({
      data: {
        modelId: params.id,
        type: isImage ? 'photo' : 'video',
        storageKey: result.key,
        url: result.url,
        checksum: null,
        isPrimary,
        isPublic,
        sortOrder,
      },
    });

    return NextResponse.json({
      success: true,
      data: { media: { ...media, thumbUrl } },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}

// -----------------------------------------------
// PATCH — reorder media
// -----------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    // body.order = [{ id, sortOrder }, ...]
    if (!Array.isArray(body.order)) {
      return NextResponse.json(
        { success: false, error: { message: 'order array required' } },
        { status: 400 },
      );
    }

    await Promise.all(
      body.order.map((item: { id: string; sortOrder: number }) =>
        prisma.modelMedia.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}
