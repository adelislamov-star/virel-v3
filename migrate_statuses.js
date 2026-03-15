const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const r1 = await prisma.model.updateMany({ where: { status: 'published' }, data: { status: 'active' } })
  console.log('published -> active:', r1.count)

  const r2 = await prisma.model.updateMany({ where: { status: 'hidden' }, data: { status: 'vacation' } })
  console.log('hidden -> vacation:', r2.count)

  const r3 = await prisma.model.updateMany({ where: { status: 'review' }, data: { status: 'draft' } })
  console.log('review -> draft:', r3.count)

  const counts = await prisma.model.groupBy({ by: ['status'], _count: true })
  console.log('Status counts after migration:', counts)
}

main().catch(console.error).finally(() => prisma.$disconnect())
