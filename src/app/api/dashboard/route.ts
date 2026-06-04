import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 6 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 6 })

  const [totalEmployees, todayAttendance, weeklyPayroll] =
    await Promise.all([
      prisma.employee.count({ where: { active: true } }),

      prisma.attendance.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: { employee: { select: { name: true } } },
        orderBy: { checkIn: 'asc' },
      }),

      prisma.payroll.aggregate({
        where: {
          weekStart: { gte: weekStart },
          weekEnd: { lte: weekEnd },
        },
        _sum: { grossPay: true },
      }),
    ])

  // Group sessions by employee
  const byEmployee = new Map<string, typeof todayAttendance>()
  for (const a of todayAttendance) {
    const list = byEmployee.get(a.employeeId) ?? []
    list.push(a)
    byEmployee.set(a.employeeId, list)
  }

  // Count employees currently at work (last session has no checkout)
  const currentlyWorking = [...byEmployee.values()].filter((sessions) => {
    const last = sessions[sessions.length - 1]
    return (last.status === 'PRESENT' || last.status === 'LATE') && !last.checkOut
  }).length
  const notWorking = totalEmployees - currentlyWorking

  // Build one aggregated row per employee for recent checkins
  const recentCheckins = [...byEmployee.entries()]
    .map(([, sessions]) => {
      const first = sessions[0]
      const last = sessions[sessions.length - 1]
      const isActive = !last.checkOut
      return {
        id: first.id,
        employeeId: first.employeeId,
        checkIn: first.checkIn,
        checkOut: last.checkOut ?? null,
        status: isActive ? 'PRESENT' : first.status,
        employee: first.employee,
      }
    })
    .sort((a, b) => {
      if (!a.checkIn) return 1
      if (!b.checkIn) return -1
      return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
    })
    .slice(0, 8)

  return NextResponse.json({
    totalEmployees,
    currentlyWorking,
    notWorking: Math.max(0, notWorking),
    weeklyPayroll: weeklyPayroll._sum.grossPay?.toString() ?? '0',
    recentCheckins,
  })
}
