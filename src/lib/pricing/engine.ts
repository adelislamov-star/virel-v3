// DYNAMIC PRICING ENGINE
import { prisma } from '@/lib/db/client';

export type PricingContext = {
  modelId: string;
  locationId?: string;
  startAt: Date;
  durationHours: number;
  basePrice: number;
};

type Adjustment = {
  ruleName: string;
  type: string;
  value: number;
  effect: number;
};

type PricingResult = {
  finalPrice: number;
  basePrice: number;
  adjustments: Adjustment[];
};

export async function calculateDynamicPrice(ctx: PricingContext): Promise<PricingResult> {
  const rules = await prisma.pricingRule.findMany({
    where: { status: 'active' },
    orderBy: { priority: 'desc' }
  });

  let price = ctx.basePrice;
  const adjustments: Adjustment[] = [];

  for (const rule of rules) {
    // Check scope
    if (rule.appliesTo === 'model' && rule.scopeEntityId !== ctx.modelId) continue;
    if (rule.appliesTo === 'location' && rule.scopeEntityId !== ctx.locationId) continue;

    // Check condition
    const config = rule.conditionConfig as Record<string, any>;
    let conditionMet = false;

    switch (rule.conditionType) {
      case 'day_of_week':
        conditionMet = (config.days || []).includes(ctx.startAt.getDay());
        break;
      case 'time_of_day':
        const hour = ctx.startAt.getHours();
        conditionMet = hour >= (config.fromHour || 0) && hour <= (config.toHour || 23);
        break;
      case 'advance_booking': {
        const hoursAhead = (ctx.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
        conditionMet = hoursAhead >= (config.minHoursAhead || 0);
        break;
      }
      case 'season':
        conditionMet = (config.months || []).includes(ctx.startAt.getMonth() + 1);
        break;
      case 'demand': {
        const overlapping = await prisma.booking.count({
          where: {
            status: { in: ['confirmed', 'in_progress'] },
            startAt: { lte: new Date(ctx.startAt.getTime() + ctx.durationHours * 3600000) },
            endAt: { gte: ctx.startAt }
          }
        });
        conditionMet = overlapping >= (config.threshold || 5);
        break;
      }
    }

    if (!conditionMet) continue;

    // Apply action
    const priceBefore = price;
    const actionValue = (rule.actionValue as any).toNumber ? (rule.actionValue as any).toNumber() : Number(rule.actionValue);
    switch (rule.actionType) {
      case 'multiply':
        price *= actionValue;
        break;
      case 'add':
        price += actionValue;
        break;
      case 'set_minimum':
        if (price < actionValue) price = actionValue;
        break;
    }

    const effect = price - priceBefore;
    adjustments.push({
      ruleName: rule.name,
      type: rule.actionType,
      value: actionValue,
      effect
    });

    // Update rule stats
    await prisma.pricingRule.update({
      where: { id: rule.id },
      data: {
        timesApplied: { increment: 1 },
        revenueImpact: { increment: effect }
      }
    });
  }

  return {
    finalPrice: Math.round(price * 100) / 100,
    basePrice: ctx.basePrice,
    adjustments
  };
}
