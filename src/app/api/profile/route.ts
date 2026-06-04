import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await prisma.employee.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      role: true,
      hourlyRate: true,
      phone: true,
    },
  })

  return NextResponse.json(employee)
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, currentPassword, newPassword } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }

  const employee = await prisma.employee.findUnique({ where: { id: session.id } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If changing password, verify current password first
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 })
    }
    if (!employee.password) {
      return NextResponse.json({ error: 'No password set' }, { status: 400 })
    }
    const valid = await bcrypt.compare(currentPassword, employee.password)
    if (!valid) {
      return NextResponse.json({ error: 'WRONG_PASSWORD' }, { status: 401 })
    }
  }

  const updateData: Record<string, unknown> = { name: name.trim() }
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  await prisma.employee.update({ where: { id: session.id }, data: updateData })

  return NextResponse.json({ ok: true })
}
