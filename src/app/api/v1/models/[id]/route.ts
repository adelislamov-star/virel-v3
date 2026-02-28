// GET MODEL WITH FULL PROFILE
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const model = await prisma.model.findUnique({
      where: { id: params.id },
      include: {
        stats: true,
        primaryLocation: true,
        services: {
          include: {
            service: {
              include: {
                category: true
              }
            }
          }
        },
        categories: {
          include: {
            category: true
          }
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
    const rates = await prisma.$queryRawUnsafe(`
      SELECT * FROM model_rates 
      WHERE model_id = '${params.id}' AND is_active = true
      ORDER BY duration_type, call_type
    `);
    
    // Get address
    const address = await prisma.$queryRawUnsafe(`
      SELECT * FROM model_addresses 
      WHERE model_id = '${params.id}' AND is_active = true
      LIMIT 1
    `);
    
    // Get work preferences
    const workPrefs = await prisma.$queryRawUnsafe(`
      SELECT * FROM model_work_preferences 
      WHERE model_id = '${params.id}'
      LIMIT 1
    `);
    
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
          visibility: body.basicInfo.visibility,
          ratingInternal: body.basicInfo.ratingInternal,
          notesInternal: body.basicInfo.notesInternal
        }
      });
    }
    
    // Update stats
    if (body.stats) {
      await prisma.modelStats.upsert({
        where: { modelId: params.id },
        create: { modelId: params.id, ...body.stats },
        update: body.stats
      });
    }
    
    // Update work preferences
    if (body.workPreferences) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO model_work_preferences (
          id, model_id, work_with_couples, work_with_women,
          black_clients_welcome, disabled_clients_welcome
        ) VALUES (
          '${params.id}-prefs', '${params.id}',
          ${body.workPreferences.workWithCouples || false},
          ${body.workPreferences.workWithWomen || false},
          ${body.workPreferences.blackClientsWelcome !== false},
          ${body.workPreferences.disabledClientsWelcome !== false}
        )
        ON CONFLICT (model_id) DO UPDATE SET
          work_with_couples = EXCLUDED.work_with_couples,
          work_with_women = EXCLUDED.work_with_women,
          black_clients_welcome = EXCLUDED.black_clients_welcome,
          disabled_clients_welcome = EXCLUDED.disabled_clients_welcome
      `);
    }
    
    // Update services
    if (body.services) {
      // Delete all existing model services
      await prisma.$executeRawUnsafe(
        `DELETE FROM model_services WHERE model_id = $1`,
        params.id
      );
      // Re-insert enabled services
      for (const s of body.services) {
        if (!s.serviceId) continue;
        await prisma.$executeRawUnsafe(
          `INSERT INTO model_services (model_id, service_id, is_enabled, extra_price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (model_id, service_id) DO UPDATE SET
             is_enabled = EXCLUDED.is_enabled,
             extra_price = EXCLUDED.extra_price`,
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
