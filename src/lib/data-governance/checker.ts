// DATA GOVERNANCE — Quality Checker
import { prisma } from '@/lib/db/client';

export async function runDataQualityChecks(): Promise<{ newChecks: number; existing: number }> {
  let newChecks = 0;
  let existing = 0;

  const models = await prisma.model.findMany({
    where: { status: 'published' },
    include: { photos: true }
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  for (const model of models) {
    // 1. Profile Completeness < 80
    if ((model.dataCompletenessScore || 0) < 80) {
      const created = await upsertCheck(
        'profile_completeness',
        'model',
        model.id,
        (model.dataCompletenessScore || 0) < 50 ? 'error' : 'warning',
        {
          score: model.dataCompletenessScore || 0,
          modelName: model.name,
          message: `Profile completeness is ${model.dataCompletenessScore || 0}%`
        }
      );
      if (created) newChecks++;
      else existing++;
    }

    // 2. Outdated Profiles — updatedAt > 30 days ago
    if (model.updatedAt < thirtyDaysAgo) {
      const created = await upsertCheck(
        'outdated_profile',
        'model',
        model.id,
        'warning',
        {
          modelName: model.name,
          lastUpdated: model.updatedAt.toISOString(),
          message: `Profile not updated since ${model.updatedAt.toLocaleDateString()}`
        }
      );
      if (created) newChecks++;
      else existing++;
    }

    // 3. Missing Photos — fewer than 3 public photos
    const publicPhotos = model.photos.filter((p: any) => p.isPublic !== false);
    if (publicPhotos.length < 3) {
      const created = await upsertCheck(
        'missing_photos',
        'model',
        model.id,
        'error',
        {
          modelName: model.name,
          photoCount: publicPhotos.length,
          message: `Only ${publicPhotos.length} public photo(s), minimum 3 required`
        }
      );
      if (created) newChecks++;
      else existing++;
    }

    // 4. Stale Availability — no availability slots in next 7 days
    const futureSlots = await prisma.availabilitySlot.count({
      where: {
        modelId: model.id,
        startTime: { gte: new Date() },
        endTime: { lte: sevenDaysFromNow }
      }
    });

    if (futureSlots === 0) {
      const created = await upsertCheck(
        'stale_availability',
        'model',
        model.id,
        'warning',
        {
          modelName: model.name,
          message: 'No availability slots in the next 7 days'
        }
      );
      if (created) newChecks++;
      else existing++;
    }
  }

  return { newChecks, existing };
}

async function upsertCheck(
  checkType: string,
  entityType: string,
  entityId: string,
  severity: string,
  details: Record<string, any>
): Promise<boolean> {
  // Skip if an open check already exists for this entity + type
  const existingCheck = await prisma.dataQualityCheck.findFirst({
    where: {
      checkType,
      entityType,
      entityId,
      status: 'open'
    }
  });

  if (existingCheck) return false;

  await prisma.dataQualityCheck.create({
    data: {
      checkType,
      entityType,
      entityId,
      severity,
      details,
      status: 'open'
    }
  });

  return true;
}
