import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'DIRECTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 })
  }

  const from = new Date(fromParam + 'T00:00:00.000Z')
  const to = new Date(toParam + 'T23:59:59.999Z')

  // Total calendar days in range (for computing absent days)
  const totalDays =
    Math.round(
      (new Date(toParam + 'T00:00:00.000Z').getTime() - new Date(fromParam + 'T00:00:00.000Z').getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1

  const [employees, advances, attendanceRecords] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, hourlyRate: true },
      orderBy: { name: 'asc' },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).advance.findMany({
      where: { date: { gte: from, lte: to } },
      select: { employeeId: true, amount: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: from, lte: to } },
      select: { employeeId: true, date: true, status: true, hoursWorked: true },
    }),
  ])

  // Sum advances per employee
  const advancesMap = new Map<string, number>()
  for (const adv of advances) {
    const prev = advancesMap.get(adv.employeeId) ?? 0
    advancesMap.set(adv.employeeId, prev + Number(adv.amount))
  }

  // Group attendance by employee — deduplicate by date for day counts
  const byEmployee = new Map<string, { present: number; totalHours: number; seenDates: Set<string> }>()
  for (const emp of employees) {
    byEmployee.set(emp.id, { present: 0, totalHours: 0, seenDates: new Set() })
  }

  for (const rec of attendanceRecords) {
    const entry = byEmployee.get(rec.employeeId)
    if (!entry) continue
    const dateKey = rec.date instanceof Date ? rec.date.toISOString().slice(0, 10) : String(rec.date).slice(0, 10)
    if (rec.hoursWorked) {
      // Only count as present if there are actual hours (completed checkout)
      if (!entry.seenDates.has(dateKey)) {
        entry.seenDates.add(dateKey)
        if (rec.status === 'PRESENT' || rec.status === 'LATE') entry.present++
      }
      entry.totalHours += rec.hoursWorked
    }
  }

  const result = employees.map((emp) => {
    const stats = byEmployee.get(emp.id) ?? { present: 0, totalHours: 0, seenDates: new Set<string>() }
    const totalEarnings = Math.round(stats.totalHours * emp.hourlyRate)
    const totalAdvances = advancesMap.get(emp.id) ?? 0
    const debt = Math.max(0, totalAdvances - totalEarnings)
    return {
      id: emp.id,
      name: emp.name,
      role: emp.role,
      hourlyRate: emp.hourlyRate,
      presentDays: stats.present,
      absentDays: Math.max(0, totalDays - stats.present),
      totalHours: Math.round(stats.totalHours * 100) / 100,
      totalEarnings,
      totalAdvances,
      debt,
    }
  })

  return NextResponse.json(result)
}
