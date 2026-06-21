import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { calcHoursWorked } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { employeeId, date, checkIn, checkOut } = await req.json()

  if (!employeeId || !date || !checkIn) {
    return NextResponse.json({ error: 'employeeId, date, checkIn required' }, { status: 400 })
  }

  const dateUTC = new Date(date + 'T00:00:00.000Z')
  const checkInDt = new Date(date + 'T' + checkIn + ':00.000Z')
  const checkOutDt = checkOut ? new Date(date + 'T' + checkOut + ':00.000Z') : null
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
