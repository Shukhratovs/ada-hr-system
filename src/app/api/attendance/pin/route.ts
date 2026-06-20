import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcHoursWorked } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 })
  }

  const employee = await prisma.employee.findUnique({
    where: { pin, active: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const todayDateUTC = new Date(todayStr + 'T00:00:00.000Z')
  const todayEndUTC = new Date(todayStr + 'T23:59:59.999Z')

  const lastSession = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: { gte: todayDateUTC, lte: todayEndUTC },
    },
    orderBy: { checkIn: 'desc' },
  })

  if (!lastSession) {
    await prisma.attendance.create({
      data: { employeeId: employee.id, date: todayDateUTC, checkIn: now, status: 'PRESENT' },
    })
    return NextResponse.json({ action: 'checkin', employee: { name: employee.name } })
  }

  if (!lastSession.checkOut) {
    const hours = calcHoursWorked(lastSession.checkIn!, now)
    await prisma.attendance.update({
      where: { id: lastSession.id },
      data: { checkOut: now, hoursWorked: hours },
    })
    return NextResponse.json({ action: 'checkout', hours, employee: { name: employee.name } })
  }

  // New check-in session
  await prisma.attendance.create({
    data: { employeeId: employee.id, date: todayDateUTC, checkIn: now, status: 'PRESENT' },
  })
  return NextResponse.json({ action: 'checkin', employee: { name: employee.name } })
}
