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
    await sendTelegram(`✅ <b>Kirdi</b>\n👤 ${employee.name}\n🕐 ${formatTime(now)}`)
    return NextResponse.json({ action: 'checkin', employee: { name: employee.name } })
  }

  if (!lastSession.checkOut) {
    const hours = calcHoursWorked(lastSession.checkIn!, now)
    await prisma.attendance.update({
      where: { id: lastSession.id },
      data: { checkOut: now, hoursWorked: hours },
    })
    await sendTelegram(`🚪 <b>Chiqdi</b>\n👤 ${employee.name}\n🕐 ${formatTime(now)}\n⏱ ${formatMinutes(hours)} ishladi`)
    return NextResponse.json({ action: 'checkout', hours, employee: { name: employee.name } })
  }

  // New check-in session
  await prisma.attendance.create({
    data: { employeeId: employee.id, date: todayDateUTC, checkIn: now, status: 'PRESENT' },
  })
  await sendTelegram(`✅ <b>Kirdi</b>\n👤 ${employee.name}\n🕐 ${formatTime(now)}`)
  return NextResponse.json({ action: 'checkin', employee: { name: employee.name } })
}
