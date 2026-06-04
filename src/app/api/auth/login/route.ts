import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { name, password } = await req.json()

  if (!name || !password) {
    return NextResponse.json({ error: 'Required' }, { status: 400 })
  }

  const employee = await prisma.employee.findFirst({
    where: { name, active: true, role: { in: ['DIRECTOR', 'HR'] } },
  })

  if (!employee || !employee.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, employee.password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signToken({
    id: employee.id,
    name: employee.name,
    role: employee.role as 'DIRECTOR' | 'HR',
  })

  const res = NextResponse.json({
    id: employee.id,
    name: employee.name,
    role: employee.role,
  })
  res.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
