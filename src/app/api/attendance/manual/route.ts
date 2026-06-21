import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calcHoursWorked } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employeeId, date, checkInISO, checkOutISO } = await req.json()

  if (!employeeId || !date || !checkInISO) {
    return NextResponse.json({ error: 'employeeId, date, checkInISO required' }, { status: 400 })
  }

  const dateUTC = new Date(date + 'T00:00:00.000Z')
  const checkInDt = new Date(checkInISO)
  const checkOutDt = checkOutISO ? new Date(checkOutISO) : null
  const hoursWorked = checkOutDt ? calcHoursWorked(checkInDt, checkOutDt) : null

  const record = await prisma.attendance.create({
    data: {
      employeeId,
      date: dateUTC,
      checkIn: checkInDt,
      checkOut: checkOutDt,
      hoursWorked,
      status: 'PRESENT',
    },
  })

  return NextResponse.json(record)
}
