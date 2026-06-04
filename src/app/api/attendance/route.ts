import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const dateParam = searchParams.get('date')
  const weekParam = searchParams.get('week')
  const employeeId = searchParams.get('employeeId')

  let where: Record<string, unknown> = {}

  if (dateParam) {
    where.date = {
      gte: new Date(dateParam + 'T00:00:00.000Z'),
      lte: new Date(dateParam + 'T23:59:59.999Z'),
    }
  } else if (weekParam) {
    const weekDate = new Date(weekParam)
    where.date = {
      gte: startOfWeek(weekDate, { weekStartsOn: 6 }),
      lte: endOfWeek(weekDate, { weekStartsOn: 6 }),
    }
  } else {
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    where.date = {
      gte: new Date(todayStr + 'T00:00:00.000Z'),
      lte: new Date(todayStr + 'T23:59:59.999Z'),
    }
  }

  if (employeeId) {
    // Per-employee history: return all raw sessions
    const records = await prisma.attendance.findMany({
      where: { ...where, employeeId },
      include: { employee: { select: { id: true, name: true, role: true } } },
      orderBy: { checkIn: 'asc' },
    })
    return NextResponse.json(records)
  }

  // Daily view: return ALL active employees, aggregating multiple sessions per day
  const [employees, sessions] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.attendance.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        date: true,
        checkIn: true,
        checkOut: true,
        status: true,
        hoursWorked: true,
      },
      orderBy: { checkIn: 'asc' },
    }),
  ])

  // Group sessions by employeeId and aggregate
  const byEmployee = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const list = byEmployee.get(s.employeeId) ?? []
    list.push(s)
    byEmployee.set(s.employeeId, list)
  }

  const result = employees.map((emp) => {
    const empSessions = byEmployee.get(emp.id)
    if (!empSessions || empSessions.length === 0) {
      return {
        id: `absent-${emp.id}`,
        date: null,
        checkIn: null,
        checkOut: null,
        status: 'ABSENT',
        hoursWorked: null,
        employee: emp,
      }
    }

    // Aggregate: first checkIn, last checkOut, sum of hoursWorked
    const firstCheckIn = empSessions[0].checkIn
    const lastSession = empSessions[empSessions.length - 1]
    const lastCheckOut = lastSession.checkOut ?? null
    const totalHours = empSessions.reduce((sum, s) => sum + (s.hoursWorked ?? 0), 0)
    // Active if the last session has no checkout yet
    const isActive = !lastSession.checkOut
    const status = isActive ? 'PRESENT' : empSessions[0].status

    return {
      id: empSessions[0].id,
      date: empSessions[0].date,
      checkIn: firstCheckIn,
      checkOut: lastCheckOut,
      status,
      hoursWorked: totalHours > 0 ? totalHours : null,
      employee: emp,
    }
  })

  return NextResponse.json(result)
}
