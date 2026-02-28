// PATCH  /api/v1/models/[id]/media/[mediaId]  — set primary, toggle public
// DELETE /api/v1/models/[id]/media/[mediaId]  — delete media

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { deleteMedia } from '@/lib/storage/r2';

const prisma = new PrismaClient();

// -----------------------------------------------
// PATCH — update media (isPrimary, isPublic)
// -----------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; mediaId: string } },
) {
  try {
    const body = await req.json();

    // If setting as primary, unset others first
    if (body.isPrimary === true) {
      await prisma.modelMedia.updateMany({
        where: { modelId: params.id },
        data: { isPrimary: false },
      });
    }

    const media = await prisma.modelMedia.update({
      where: { id: params.mediaId },
      data: {
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
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
// DELETE — remove media from R2 + DB
// -----------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; mediaId: string } },
) {
  try {
    const media = await prisma.modelMedia.findUnique({
      where: { id: params.mediaId },
    });

    if (!media) {
      return NextResponse.json(
        { success: false, error: { message: 'Media not found' } },
        { status: 404 },
      );
    }

    // Verify media belongs to this model
    if (media.modelId !== params.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden' } },
        { status: 403 },
      );
    }

    // Delete from R2
    await deleteMedia(media.storageKey);

    // Delete from DB
    await prisma.modelMedia.delete({ where: { id: params.mediaId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: 500 },
    );
  }
}
