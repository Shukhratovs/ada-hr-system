import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { week } = await req.json()
  const date = week ? new Date(week) : new Date()
  const weekStart = startOfWeek(date, { weekStartsOn: 6 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 6 })

  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const [employees, allAdvances] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true },
      include: {
        attendances: {
          where: {
            date: {
              gte: startOfDay(weekStart),
              lte: endOfDay(weekEnd),
            },
            checkOut: { not: null },
          },
        },
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma as any).advance.findMany({
      where: { weekStart: new Date(weekStartStr + 'T00:00:00.000Z') },
      select: { employeeId: true, amount: true },
    }),
  ])

  const advancesMap = new Map<string, bigint>()
  for (const adv of allAdvances) {
    const prev = advancesMap.get(adv.employeeId) ?? BigInt(0)
    advancesMap.set(adv.employeeId, prev + adv.amount)
  }

  const results = []

  for (const emp of employees) {
    const totalHours = emp.attendances.reduce(
      (sum: number, a: { hoursWorked: number | null }) => sum + (a.hoursWorked ?? 0),
      0
    )

    if (totalHours === 0) {
      // Remove stale payroll if attendance was deleted (only if not PAID)
      const stale = await prisma.payroll.findUnique({
        where: { employeeId_weekStart: { employeeId: emp.id, weekStart } },
        select: { status: true },
      })
      if (stale && stale.status !== 'PAID') {
        await prisma.payroll.delete({
          where: { employeeId_weekStart: { employeeId: emp.id, weekStart } },
        })
      }
      continue
    }

    const grossPay = BigInt(Math.round(totalHours * emp.hourlyRate))
    const totalAdvances = advancesMap.get(emp.id) ?? BigInt(0)
    const netPay = grossPay - totalAdvances

    // PAID records are frozen — never recalculate
    // APPROVED records go back to PENDING if numbers changed
    const existing = await prisma.payroll.findUnique({
      where: { employeeId_weekStart: { employeeId: emp.id, weekStart } },
      select: { status: true, grossPay: true, totalAdvances: true, netPay: true },
    })

    if (existing?.status === 'PAID') continue

    const numbersChanged =
      !existing ||
      existing.grossPay !== grossPay ||
      (existing as typeof existing & { totalAdvances: bigint }).totalAdvances !== totalAdvances

    const newStatus =
      existing?.status === 'APPROVED' && numbersChanged ? 'PENDING' : (existing?.status ?? 'PENDING')

    const payroll = await prisma.payroll.upsert({
      where: { employeeId_weekStart: { employeeId: emp.id, weekStart } },
      update: { totalHours, grossPay, totalAdvances, netPay, status: newStatus },
      create: {
        employeeId: emp.id,
        weekStart,
        weekEnd,
        totalHours,
        grossPay,
        totalAdvances,
        netPay,
        status: 'PENDING',
      },
    })

    results.push({
      ...payroll,
      grossPay: grossPay.toString(),
      totalAdvances: totalAdvances.toString(),
      netPay: netPay.toString(),
    })
  }

  return NextResponse.json({ calculated: results.length, payrolls: results })
}
