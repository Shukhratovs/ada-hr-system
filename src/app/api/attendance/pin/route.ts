import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcHoursWorked } from '@/lib/utils'
import { sendTelegram } from '@/lib/telegram'

function formatTime(date: Date) {
  // Uzbekistan is UTC+5
  const local = new Date(date.getTime() + 5 * 60 * 60 * 1000)
  return local.toISOString().slice(11, 16)
}

function formatMinutes(hours: number) {
  const total = Math.round(hours * 60)
  if (total >= 60) return `${Math.floor(total / 60)}h ${total % 60}m`
  return `${total}m`
}

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin || typeof pin !== 'string') {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 })
  }

  const employee = await prisma.employee.findFirst({
    where: { pin, active: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const now = new Date()
  const MAX_SHIFT_HOURS = 16

  // Uzbekistan local date (UTC+5) — used for the stored `date` field so it
  // groups correctly in stats/payroll regardless of the UTC day boundary.
  const uzDateStr = new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dateUTC = new Date(uzDateStr + 'T00:00:00.000Z')

  // Decide check-in vs check-out by the employee's most recent OPEN session
  // (no checkout yet), regardless of date. This is timezone-agnostic and
  // correctly handles shifts that cross the UTC/local midnight boundary.
  const openSession = await prisma.attendance.findFirst({
    where: { employeeId: employee.id, checkOut: null },
    orderBy: { checkIn: 'desc' },
  })

  if (openSession?.checkIn) {
    const hours = calcHoursWorked(openSession.checkIn, now)
    if (hours <= MAX_SHIFT_HOURS) {
      // CHECK OUT
      await prisma.attendance.update({
        where: { id: openSession.id },
        data: { checkOut: now, hoursWorked: hours },
      })
      await sendTelegram(`🚪 <b>Chiqdi</b>\n👤 ${employee.name}\n🕐 ${formatTime(now)}\n⏱ ${formatMinutes(hours)} ishladi`)
      return NextResponse.json({ action: 'checkout', hours, employee: { name: employee.name } })
    }
    // Stale session (forgot to check out long ago) — close it without counting,
    // so the employee isn't stuck as "Ishda", then fall through to a fresh check-in.
    await prisma.attendance.update({
      where: { id: openSession.id },
      data: { checkOut: openSession.checkIn, hoursWorked: 0 },
    })
  }

  // CHECK IN
  await prisma.attendance.create({
    data: { employeeId: employee.id, date: dateUTC, checkIn: now, status: 'PRESENT' },
  })
  await sendTelegram(`✅ <b>Kirdi</b>\n👤 ${employee.name}\n🕐 ${formatTime(now)}`)
  return NextResponse.json({ action: 'checkin', employee: { name: employee.name } })
}
