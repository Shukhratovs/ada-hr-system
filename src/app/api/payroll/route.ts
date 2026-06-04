import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = req.nextUrl
  const weekParam = searchParams.get('week')
  const date = weekParam ? new Date(weekParam) : new Date()

  const weekStart = startOfWeek(date, { weekStartsOn: 6 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 6 })

  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const [payrolls, advances] = await Promise.all([
    prisma.payroll.findMany({
      where: {
        weekStart: { gte: weekStart },
        weekEnd: { lte: weekEnd },
      },
      include: {
        employee: { select: { id: true, name: true, role: true, hourlyRate: true } },
      },
      orderBy: { employee: { name: 'asc' } },
    }),
    prisma.advance.findMany({
      where: { weekStart: new Date(weekStartStr + 'T00:00:00.000Z') },
      orderBy: { date: 'asc' },
    }),
  ])

  const advancesByEmployee = new Map<string, typeof advances>()
  for (const adv of advances) {
    const list = advancesByEmployee.get(adv.employeeId) ?? []
    list.push(adv)
    advancesByEmployee.set(adv.employeeId, list)
  }

  return NextResponse.json(
    payrolls.map((p) => {
      const empAdvances = advancesByEmployee.get(p.employeeId) ?? []
      const totalAdvances = empAdvances.reduce((sum: number, a: { amount: bigint }) => sum + Number(a.amount), 0)
      const grossPay = Number(p.grossPay)
      const netPay = grossPay - totalAdvances // allow negative (debt)
      return {
        ...p,
        grossPay: grossPay.toString(),
        totalAdvances: totalAdvances.toString(),
        netPay: netPay.toString(),
        advances: empAdvances.map((a: { amount: bigint; [key: string]: unknown }) => ({
          ...a,
          amount: a.amount.toString(),
        })),
      }
    })
  )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[payroll GET]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
