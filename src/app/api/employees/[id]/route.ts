import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, role, hourlyRate, phone, password, pin, active } = body

  const updateData: Record<string, unknown> = {
    name,
    role,
    hourlyRate: Number(hourlyRate),
    phone: phone || null,
    pin: pin || null,
    active,
  }

  if (password) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json(employee)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'DIRECTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Prevent deleting director accounts
  const target = await prisma.employee.findUnique({ where: { id }, select: { role: true } })
  if (target?.role === 'DIRECTOR') {
    return NextResponse.json({ error: 'Cannot delete director' }, { status: 403 })
  }

  // Delete related records first, then the employee
  await prisma.attendance.deleteMany({ where: { employeeId: id } })
  await prisma.payroll.deleteMany({ where: { employeeId: id } })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).advance.deleteMany({ where: { employeeId: id } })
  await prisma.employee.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
