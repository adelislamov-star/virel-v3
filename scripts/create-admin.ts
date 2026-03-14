import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12)

  // Ensure OWNER role exists
  const role = await prisma.role.upsert({
    where: { code: 'OWNER' },
    update: {},
    create: { code: 'OWNER', name: 'Owner' },
  })

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: 'admin@virel.com' },
    update: { passwordHash },
    create: {
      email: 'admin@virel.com',
      passwordHash,
      name: 'Admin',
    },
  })

  // Assign role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })

  console.log('User ready:', user.email, '-> role:', role.code)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
