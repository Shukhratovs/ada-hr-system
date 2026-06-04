import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.employee.findFirst({ where: { role: Role.DIRECTOR } })
  if (existing) {
    console.log('Seed already ran.')
    return
  }

  const hash = await bcrypt.hash('director123', 10)
  await prisma.employee.create({
    data: {
      name: 'Direktor',
      role: Role.DIRECTOR,
      hourlyRate: 50000,
      shiftStart: '09:00',
      shiftEnd: '18:00',
      workDays: [1, 2, 3, 4, 5],
      password: hash,
      faceDescriptor: [],
    },
  })
  console.log('Created default director account.')
  console.log('Login: Direktor | Password: director123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
