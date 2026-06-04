import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      role: true,
      hourlyRate: true,
      phone: true,
      active: true,
      createdAt: true,
      faceDescriptor: true,
    },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, role, hourlyRate, phone, password } = body

  if (!name || !role || !hourlyRate) {
    return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
  }

  let hashedPassword: string | undefined
  if ((role === 'DIRECTOR' || role === 'HR') && password) {
    hashedPassword = await bcrypt.hash(password, 10)
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      role,
      hourlyRate: Number(hourlyRate),
      shiftStart: '09:00',
      shiftEnd: '18:00',
      workDays: [],
      phone: phone || null,
      password: hashedPassword || null,
      faceDescriptor: [],
    },
  })

  return NextResponse.json(employee, { status: 201 })
}
