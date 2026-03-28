import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const oldDomain = 'pub-2df895cf47a14d359a7341e0cda3efaf.r2.dev'
  const newDomain = 'pub-7f32296778704801a71de1ffa1b9ca8d.r2.dev'

  const updated = await prisma.$executeRawUnsafe(
    `UPDATE model_media
     SET url = REPLACE(url, $1, $2)
     WHERE url LIKE $3`,
    oldDomain,
    newDomain,
    `%${oldDomain}%`
  )

  console.log('Updated rows:', updated)
  await prisma.$disconnect()
}

main()
