import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const TZ_OFFSET_MS = 5 * 60 * 60 * 1000 // Uzbekistan UTC+5

function localDateStr(d: Date) {
  return new Date(d.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10)
}
function localHour(d: Date) {
  return new Date(d.getTime() + TZ_OFFSET_MS).getUTCHours()
}
// Saturday-start week key (matches payroll convention weekStartsOn: 6)
function weekKey(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  const dow = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = (dow - 6 + 7) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'DIRECTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const days = Math.min(Number(req.nextUrl.searchParams.get('days')) || 30, 120)
  const todayLocal = localDateStr(new Date())
  const fromDate = new Date(new Date(todayLocal + 'T00:00:00.000Z').getTime() - (days - 1) * 86400000)
  const from = fromDate
  const to = new Date(todayLocal + 'T23:59:59.999Z')

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      where: { active: true, role: { not: 'DIRECTOR' } },
      select: { id: true, name: true, hourlyRate: true, sundayRate: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: from, lte: to } },
      select: { employeeId: true, date: true, checkIn: true, hoursWorked: true },
      orderBy: { checkIn: 'asc' },
    }),
  ])

  const empMap = new Map(employees.map((e) => [e.id, e]))

  // Per-day aggregates
  const daily = new Map<string, { present: Set<string>; hours: number; cost: number }>()
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getTime() + i * 86400000).toISOString().slice(0, 10)
    daily.set(d, { present: new Set(), hours: 0, cost: 0 })
  }

  // First check-in per employee per day (arrival), hours per employee
  const firstArrival = new Map<string, Date>() // `${empId}|${date}` -> earliest checkIn
  const empHours = new Map<string, number>()

  for (const rec of records) {
    const emp = empMap.get(rec.employeeId)
    if (!emp) continue
    const dateStr = rec.date.toISOString().slice(0, 10)
    const day = daily.get(dateStr)
    if (!day) continue

    if (rec.hoursWorked) {
      day.present.add(rec.employeeId)
      day.hours += rec.hoursWorked
      const isSunday = rec.date.getUTCDay() === 0
      const rate = isSunday ? (emp.sundayRate ?? emp.hourlyRate) : emp.hourlyRate
      day.cost += rec.hoursWorked * rate
      empHours.set(rec.employeeId, (empHours.get(rec.employeeId) ?? 0) + rec.hoursWorked)
    }
    if (rec.checkIn) {
      const key = rec.employeeId + '|' + dateStr
      const prev = firstArrival.get(key)
      if (!prev || rec.checkIn < prev) firstArrival.set(key, rec.checkIn)
      // count open sessions (today, not yet checked out) as present too
      if (!rec.hoursWorked && dateStr === todayLocal) day.present.add(rec.employeeId)
    }
  }

  const dailyOut = [...daily.entries()].map(([date, v]) => ({
    date,
    present: v.present.size,
    hours: Math.round(v.hours * 10) / 10,
    cost: Math.round(v.cost),
  }))

  // Weekly cost (group daily cost into Sat-start weeks)
  const weekly = new Map<string, number>()
  for (const d of dailyOut) {
    const wk = weekKey(d.date)
    weekly.set(wk, (weekly.get(wk) ?? 0) + d.cost)
  }
  const weeklyOut = [...weekly.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, cost]) => ({ weekStart, cost: Math.round(cost) }))

  // Weekday averages (only days that have passed, including today)
  const weekdayAgg = new Map<number, { total: number; days: number }>()
  for (const d of dailyOut) {
    const dow = new Date(d.date + 'T00:00:00.000Z').getUTCDay()
    const agg = weekdayAgg.get(dow) ?? { total: 0, days: 0 }
    agg.total += d.present
    agg.days++
    weekdayAgg.set(dow, agg)
  }
  // Order Mon..Sun (Du..Ya)
  const weekdayOut = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const agg = weekdayAgg.get(dow)
    return { dow, avgPresent: agg && agg.days ? Math.round((agg.total / agg.days) * 10) / 10 : 0 }
  })

  // Arrival-hour histogram (first check-in of each employee-day)
  const arrivalHist = new Map<number, number>()
  let arrivalSumMin = 0
  let arrivalCount = 0
  for (const [, checkIn] of firstArrival) {
    const h = localHour(checkIn)
    arrivalHist.set(h, (arrivalHist.get(h) ?? 0) + 1)
    const local = new Date(checkIn.getTime() + TZ_OFFSET_MS)
    arrivalSumMin += local.getUTCHours() * 60 + local.getUTCMinutes()
    arrivalCount++
  }
  const hours = [...arrivalHist.keys()]
  const minH = hours.length ? Math.min(...hours) : 6
  const maxH = hours.length ? Math.max(...hours) : 10
  const arrivalOut = []
  for (let h = minH; h <= maxH; h++) {
    arrivalOut.push({ hour: h, count: arrivalHist.get(h) ?? 0 })
  }
  const avgArrivalMin = arrivalCount ? Math.round(arrivalSumMin / arrivalCount) : null

  // Top 10 by hours
  const topOut = [...empHours.entries()]
    .map(([id, hrs]) => ({ name: empMap.get(id)?.name ?? '?', hours: Math.round(hrs * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  // KPIs
  const totalHours = dailyOut.reduce((s, d) => s + d.hours, 0)
  const totalCost = dailyOut.reduce((s, d) => s + d.cost, 0)
  const daysWithAny = dailyOut.filter((d) => d.present > 0)
  const avgPresent = daysWithAny.length
    ? Math.round((daysWithAny.reduce((s, d) => s + d.present, 0) / daysWithAny.length) * 10) / 10
    : 0

  return NextResponse.json({
    days,
    kpi: {
      totalHours: Math.round(totalHours),
      totalCost: Math.round(totalCost),
      avgPresent,
      avgArrival: avgArrivalMin !== null
        ? `${String(Math.floor(avgArrivalMin / 60)).padStart(2, '0')}:${String(avgArrivalMin % 60).padStart(2, '0')}`
        : null,
    },
    daily: dailyOut,
    weekly: weeklyOut,
    weekday: weekdayOut,
    arrival: arrivalOut,
    top: topOut,
  })
}
