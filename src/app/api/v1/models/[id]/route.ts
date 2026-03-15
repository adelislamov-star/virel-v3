// GET MODEL WITH FULL PROFILE
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/client';
import { deleteMedia } from '@/lib/storage/r2';
import { ensureExtensionTables } from '@/lib/db/ensure-tables';
import { logAudit } from '@/lib/audit';
import { requireRole, isActor } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER', 'OPERATOR']);
    if (!isActor(auth)) return auth;
    await ensureExtensionTables();

    const model = await prisma.model.findUnique({
      where: { id: params.id },
      include: {
        stats: true,
        primaryLocation: true,
        services: {
          include: { service: true }
        },
        media: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    
    if (!model) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Model not found' }
      }, { status: 404 });
    }
    
    // Get rates
    let rates: any[] = [];
    try {
      rates = await prisma.$queryRawUnsafe(`
        SELECT * FROM model_rates 
        WHERE model_id = '${params.id}' AND is_active = true
        ORDER BY duration_type, call_type
      `) as any[];
    } catch {}
    
    // Get address
    let address: any[] = [];
    try {
      address = await prisma.$queryRawUnsafe(`
        SELECT * FROM model_addresses 
        WHERE model_id = '${params.id}' AND is_active = true
        LIMIT 1
      `) as any[];
    } catch {}
    
    // Get work preferences
    let workPrefs: any[] = [];
    try {
      workPrefs = await prisma.$queryRawUnsafe(`
        SELECT * FROM model_work_preferences 
        WHERE model_id = '${params.id}'
        LIMIT 1
      `) as any[];
    } catch {}
    
    return NextResponse.json({
      success: true,
      data: {
        model: {
          ...model,
          rates: rates || [],
          address: address?.[0] || null,
          workPreferences: workPrefs?.[0] || null
        }
      }
    });
    
  } catch (error: any) {
    console.error('Get model error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// UPDATE MODEL
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ['OWNER', 'OPS_MANAGER']);
    if (!isActor(auth)) return auth;
    const body = await request.json();
    
    // Update basic info
    if (body.basicInfo) {
      await prisma.model.update({
        where: { id: params.id },
        data: {
          name: body.basicInfo.name,
          publicCode: body.basicInfo.publicCode,
          primaryLocationId: body.basicInfo.primaryLocationId,
          status: body.basicInfo.status,
          
          ratingInternal: body.basicInfo.ratingInternal,
          notesInternal: body.basicInfo.notesInternal
        }
      });
    }
    
    // Update model-level profile fields (Phase 2)
    if (body.profile) {
      const p = body.profile;
      const profileData: Record<string, unknown> = {};
      if (p.measurements !== undefined) profileData.measurements = p.measurements || null;
      if (p.piercingDetails !== undefined) {
        if (Array.isArray(p.piercingDetails)) {
          profileData.piercingDetails = p.piercingDetails;
        } else if (typeof p.piercingDetails === 'string' && p.piercingDetails) {
          profileData.piercingDetails = p.piercingDetails.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else {
          profileData.piercingDetails = [];
        }
      }
      if (p.education !== undefined) profileData.education = p.education || null;
      if (p.travel !== undefined) profileData.travel = p.travel || null;
      if (p.tagline !== undefined) profileData.tagline = p.tagline || null;
      if (p.isExclusive !== undefined) profileData.isExclusive = p.isExclusive;
      if (p.isVerified !== undefined) profileData.isVerified = p.isVerified;
      if (p.availability !== undefined) profileData.availability = p.availability || null;
      if (p.duoPartnerIds !== undefined) profileData.duoPartnerIds = p.duoPartnerIds;
      if (p.wardrobe !== undefined) profileData.wardrobe = p.wardrobe;
      if (p.publicTags !== undefined) profileData.publicTags = p.publicTags;
      if (p.responseTimeMin !== undefined) profileData.responseTimeMin = p.responseTimeMin;
      if (p.seoTitle !== undefined) profileData.seoTitle = p.seoTitle || null;
      if (p.seoDescription !== undefined) profileData.seoDescription = p.seoDescription || null;
      if (Object.keys(profileData).length > 0) {
        await prisma.model.update({
          where: { id: params.id },
          data: profileData,
        });
      }
    }

    // Update stats
    if (body.stats) {
      await prisma.modelStats.upsert({
        where: { modelId: params.id },
        create: { modelId: params.id, ...body.stats },
        update: body.stats
      });
    }
    
    // Update contact info
    if (body.contact) {
      const c = body.contact;
      const contactData: Record<string, unknown> = {};
      if (c.phone !== undefined) contactData.phone = c.phone || null;
      if (c.phone2 !== undefined) contactData.phone2 = c.phone2 || null;
      if (c.email !== undefined) contactData.email = c.email || null;
      if (c.telegramPhone !== undefined) contactData.telegramPhone = c.telegramPhone || null;
      if (c.telegramTag !== undefined) contactData.telegramTag = c.telegramTag ? c.telegramTag.replace(/^@/, '') : null;
      if (c.whatsapp !== undefined) contactData.whatsapp = c.whatsapp;
      if (c.telegram !== undefined) contactData.telegram = c.telegram;
      if (c.viber !== undefined) contactData.viber = c.viber;
      if (c.signal !== undefined) contactData.signal = c.signal;
      if (Object.keys(contactData).length > 0) {
        await prisma.model.update({
          where: { id: params.id },
          data: contactData,
        });
      }
    }

    // Update payment methods
    if (body.payment) {
      const paymentData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body.payment)) {
        if (typeof value === 'boolean') paymentData[key] = value;
      }
      if (Object.keys(paymentData).length > 0) {
        await prisma.model.update({
          where: { id: params.id },
          data: paymentData,
        });
      }
    }

    // Update work preferences
    if (body.workPreferences) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_work_preferences (
          id, model_id, work_with_couples, work_with_women,
          black_clients_welcome, disabled_clients_welcome
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (model_id) DO UPDATE SET
          work_with_couples = EXCLUDED.work_with_couples,
          work_with_women = EXCLUDED.work_with_women,
          black_clients_welcome = EXCLUDED.black_clients_welcome,
          disabled_clients_welcome = EXCLUDED.disabled_clients_welcome`,
        `${params.id}-prefs`,
        params.id,
        body.workPreferences.workWithCouples || false,
        body.workPreferences.workWithWomen || false,
        body.workPreferences.blackClientsWelcome !== false,
        body.workPreferences.disabledClientsWelcome !== false,
      );
    }
    
    // Update services
    if (body.services) {
      // Delete all existing model services
      await prisma.$executeRawUnsafe(
        `DELETE FROM model_services WHERE "modelId" = $1`,
        params.id
      );
      // Re-insert enabled services with extraPrice
      for (const s of body.services) {
        if (!s.serviceId) continue;
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_services ("modelId", "serviceId", "isEnabled", "extraPrice")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("modelId", "serviceId") DO UPDATE SET
             "isEnabled" = EXCLUDED."isEnabled",
             "extraPrice" = EXCLUDED."extraPrice"`,
          params.id,
          s.serviceId,
          s.isEnabled ?? true,
          s.extraPrice ?? null
        );
      }
    }

    // Update rates
    if (body.rates) {
      // Deactivate all existing rates
      await prisma.$executeRawUnsafe(
        `UPDATE model_rates SET is_active = false WHERE model_id = $1`,
        params.id
      );
      // Upsert each rate
      for (const r of body.rates) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_rates (id, model_id, duration_type, call_type, price, taxi_fee, currency, is_active)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (model_id, location_id, duration_type, call_type) DO UPDATE SET
             price = EXCLUDED.price,
             taxi_fee = EXCLUDED.taxi_fee,
             is_active = true`,
          params.id,
          r.durationType,
          r.callType,
          r.price,
          r.taxiFee ?? null,
          r.currency ?? 'GBP'
        );
      }
    }

    // Update address
    if (body.address !== undefined) {
      const a = body.address;
      await prisma.$executeRawUnsafe(
        `INSERT INTO model_addresses (
           id, model_id, street, flat_number, flat_floor, post_code, tube_station,
           heathrow_available, gatwick_available, stansted_available, is_active
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true
         )
         ON CONFLICT (model_id) DO UPDATE SET
           street = EXCLUDED.street,
           flat_number = EXCLUDED.flat_number,
           flat_floor = EXCLUDED.flat_floor,
           post_code = EXCLUDED.post_code,
           tube_station = EXCLUDED.tube_station,
           heathrow_available = EXCLUDED.heathrow_available,
           gatwick_available = EXCLUDED.gatwick_available,
           stansted_available = EXCLUDED.stansted_available,
           is_active = true`,
        `${params.id}-addr`,
        params.id,
        a.street || null,
        a.flatNumber || null,
        a.flatFloor ?? null,
        a.postCode || null,
        a.tubeStation || null,
        a.heathrowAvailable ?? false,
        a.gatwickAvailable ?? false,
        a.stanstedAvailable ?? false
      );
    }

    // ── Learning system: detect admin corrections to AI parse ──
    try {
      const modelRecord = await prisma.model.findUnique({
        where: { id: params.id },
        select: { aiParseExampleId: true },
      });

      if (modelRecord?.aiParseExampleId) {
        const example = await prisma.aIParseExample.findUnique({
          where: { id: modelRecord.aiParseExampleId },
        });

        if (example && !example.wasEdited) {
          const editedFields: Record<string, any> = {};

          if (body.stats) editedFields.stats = body.stats;
          if (body.services) editedFields.services = body.services;
          if (body.rates) editedFields.rates = body.rates;
          if (body.address !== undefined) editedFields.address = body.address;
          if (body.workPreferences) editedFields.workPreferences = body.workPreferences;
          if (body.basicInfo?.name) editedFields.name = body.basicInfo.name;
          if (body.basicInfo?.notesInternal) editedFields.bio_text = body.basicInfo.notesInternal;

          if (Object.keys(editedFields).length > 0) {
            const originalOutput = example.outputJson as Record<string, any>;
            const correctedJson = { ...originalOutput, ...editedFields };

            await prisma.aIParseExample.update({
              where: { id: example.id },
              data: {
                wasEdited: true,
                editedJson: correctedJson,
              },
            });
            console.log(`[model-update] Learning: AI parse example ${example.id} marked as edited`);
          }
        }
      }
    } catch (e) {
      console.error('[model-update] Learning comparison failed (non-fatal):', e);
    }

    logAudit({
      action: 'model.updated',
      entityType: 'model',
      entityId: params.id,
      after: { sections: Object.keys(body) },
      req: request,
    });

    // Revalidate frontend caches
    revalidatePath('/companions');
    revalidatePath('/');
    try {
      const m = await prisma.model.findUnique({ where: { id: params.id }, select: { slug: true } });
      if (m?.slug) revalidatePath(`/companions/${m.slug}`);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Model updated'
    });

  } catch (error: any) {
    console.error('Update model error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}

// DELETE MODEL — removes all data from DB and photos from R2
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(_request, ['OWNER']);
    if (!isActor(auth)) return auth;
    const id = params.id;

    // 1. Get all media files to delete from R2
    const mediaFiles = await prisma.modelMedia.findMany({
      where: { modelId: id },
      select: { storageKey: true }
    });

    // 2. Delete all related DB records in correct order (children before parent)
    await prisma.booking.deleteMany({ where: { modelId: id } });
    await prisma.inquiryMatch.deleteMany({ where: { modelId: id } });
    await prisma.availabilityMismatch.deleteMany({ where: { modelId: id } });
    await prisma.availabilitySlot.deleteMany({ where: { modelId: id } });
    await prisma.modelAttribute.deleteMany({ where: { modelId: id } });
    await prisma.modelCategory.deleteMany({ where: { modelId: id } });
    await prisma.modelService.deleteMany({ where: { modelId: id } });
    await prisma.modelMedia.deleteMany({ where: { modelId: id } });
    // model_rates, model_addresses, model_work_preferences are raw tables outside Prisma schema
    try { await prisma.$executeRawUnsafe(`DELETE FROM model_rates WHERE model_id = '${id}'`); } catch {}
    try { await prisma.$executeRawUnsafe(`DELETE FROM model_addresses WHERE model_id = '${id}'`); } catch {}
    try { await prisma.$executeRawUnsafe(`DELETE FROM model_work_preferences WHERE model_id = '${id}'`); } catch {}
    try { await prisma.modelStats.delete({ where: { modelId: id } }); } catch {}

    // 3. Delete the model itself
    await prisma.model.delete({ where: { id } });

    // 4. Delete from R2 (after DB success)
    for (const m of mediaFiles) {
      if (m.storageKey) {
        try { await deleteMedia(m.storageKey); } catch {}
      }
    }

    logAudit({
      action: 'model.deleted',
      entityType: 'model',
      entityId: id,
      req: _request,
    });

    // Revalidate frontend caches
    revalidatePath('/companions');
    revalidatePath('/');

    return NextResponse.json({ success: true, message: 'Model deleted' });

  } catch (error: any) {
    console.error('Delete model error:', error);
    return NextResponse.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
}
