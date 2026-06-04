import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcHoursWorked } from '@/lib/utils'

// Returns all face descriptors for matching on the kiosk (client-side)
export async function GET() {
  const employees = await prisma.employee.findMany({
    where: { active: true, NOT: { faceDescriptor: { isEmpty: true } } },
    select: {
      id: true,
      name: true,
      faceDescriptor: true,
    },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const { employeeId } = await req.json()

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId, active: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const todayDateUTC = new Date(todayStr + 'T00:00:00.000Z')
  const todayEndUTC = new Date(todayStr + 'T23:59:59.999Z')

  // Find the most recent session today
  const lastSession = await prisma.attendance.findFirst({
    where: {
      employeeId,
      date: { gte: todayDateUTC, lte: todayEndUTC },
    },
    orderBy: { checkIn: 'desc' },
  })

  if (!lastSession) {
    // No session today → first check-in
    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: todayDateUTC,
        checkIn: now,
        status: 'PRESENT',
      },
    })
    return NextResponse.json({
      action: 'checkin',
      record,
      employee: { name: employee.name },
    })
  }

  if (!lastSession.checkOut) {
    // Active session → check OUT
    const hours = calcHoursWorked(lastSession.checkIn!, now)
    const updated = await prisma.attendance.update({
      where: { id: lastSession.id },
      data: {
        checkOut: now,
        hoursWorked: hours,
      },
    })
    return NextResponse.json({
      action: 'checkout',
      hours,
      record: updated,
      employee: { name: employee.name },
    })
  }

  // Last session is completed → start a new check-in session
  const record = await prisma.attendance.create({
    data: {
      employeeId,
      date: todayDateUTC,
      checkIn: now,
      status: 'PRESENT',
    },
  })
  return NextResponse.json({
    action: 'checkin',
    record,
    employee: { name: employee.name },
  })
}
