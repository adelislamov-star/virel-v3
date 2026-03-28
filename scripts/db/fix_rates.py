import sys

with open(r'src\app\api\v1\models\quick-upload\route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.index('    // Step 3: Insert rates')
end = content.index('    // Step 4: Insert address')
old = content[start:end]

new = """    // Step 3: Insert rates via Prisma (ModelRate -> CallRateMaster)
    console.log('[quick-upload] Step 3: Inserting rates...')
    let insertedRates = 0

    const rateMasters = await prisma.callRateMaster.findMany({
      where: { isActive: true },
      select: { id: true, label: true },
    })
    const masterByLabel = new Map(rateMasters.map(m => [m.label.toLowerCase(), m.id]))

    const aiRates = aiParsed?.rates
    if (aiRates) {
      for (const [duration, val] of Object.entries(aiRates)) {
        if (!val) continue
        const masterId = masterByLabel.get(duration.toLowerCase())
        if (!masterId) { console.log('[quick-upload] No master for ' + duration); continue }
        try {
          await prisma.modelRate.upsert({
            where: { modelId_callRateMasterId: { modelId: model.id, callRateMasterId: masterId } },
            update: { incallPrice: val.incall ?? null, outcallPrice: val.outcall ?? null },
            create: { modelId: model.id, callRateMasterId: masterId, incallPrice: val.incall ?? null, outcallPrice: val.outcall ?? null },
          })
          insertedRates++
        } catch (e) { console.error('[quick-upload] Rate upsert failed ' + duration, e) }
      }
    } else if (regexParsed?.rates?.length) {
      for (const rate of regexParsed.rates) {
        const masterId = masterByLabel.get(rate.duration.toLowerCase())
        if (!masterId) continue
        try {
          await prisma.modelRate.upsert({
            where: { modelId_callRateMasterId: { modelId: model.id, callRateMasterId: masterId } },
            update: { incallPrice: rate.callType === 'incall' ? rate.price : undefined, outcallPrice: rate.callType === 'outcall' ? rate.price : undefined },
            create: { modelId: model.id, callRateMasterId: masterId, incallPrice: rate.callType === 'incall' ? rate.price : null, outcallPrice: rate.callType === 'outcall' ? rate.price : null },
          })
          insertedRates++
        } catch (e) { console.error('[quick-upload] Regex rate upsert failed ' + rate.duration, e) }
      }
    }
    console.log('[quick-upload] Step 3: Inserted ' + insertedRates + ' rates')
"""

result = content.replace(old, new)
print('Changed:', content != result)
print('Old len:', len(old), 'New len:', len(new))

with open(r'src\app\api\v1\models\quick-upload\route.ts', 'w', encoding='utf-8') as f:
    f.write(result)
