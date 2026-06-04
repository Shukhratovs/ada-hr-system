import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { startOfWeek } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const weekParam = searchParams.get('week')
  const employeeId = searchParams.get('employeeId')

  const date = weekParam ? new Date(weekParam) : new Date()
  const weekStart = startOfWeek(date, { weekStartsOn: 6 })
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const advances = await prisma.advance.findMany({
    where: {
      weekStart: new Date(weekStartStr + 'T00:00:00.000Z'),
      ...(employeeId ? { employeeId } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, role: true } },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    advances.map((a) => ({ ...a, amount: a.amount.toString() }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employeeId, amount, note, date } = await req.json()

  if (!employeeId || !amount || !date) {
    return NextResponse.json({ error: 'employeeId, amount, date required' }, { status: 400 })
  }

  const dateStr = new Date(date).toISOString().slice(0, 10)
  const weekStart = startOfWeek(new Date(date), { weekStartsOn: 6 })
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const advance = await prisma.advance.create({
    data: {
      employeeId,
      amount: BigInt(Math.round(Number(amount))),
      note: note || null,
      date: new Date(dateStr + 'T00:00:00.000Z'),
      weekStart: new Date(weekStartStr + 'T00:00:00.000Z'),
    },
    include: {
      employee: { select: { id: true, name: true, role: true } },
    },
  })

  return NextResponse.json({ ...advance, amount: advance.amount.toString() })
}
