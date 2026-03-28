import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production' })
process.env.DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL!

import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/db/client'

async function main() {
  const hash = await bcrypt.hash('Vaurel2026!', 10)
  const user = await prisma.user.update({
    where: { email: 'admin@vaurel.co.uk' },
    data: { passwordHash: hash }
  })
  console.log('✅ Password reset for:', user.email)
  await prisma.$disconnect()
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1) })
