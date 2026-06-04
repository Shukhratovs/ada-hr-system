import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'DIRECTOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!['APPROVED', 'PAID'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const payroll = await prisma.payroll.update({
    where: { id },
    data: { status },
  })

  const p = payroll as typeof payroll & { totalAdvances: bigint; netPay: bigint }
  return NextResponse.json({
    ...p,
    grossPay: p.grossPay.toString(),
    totalAdvances: p.totalAdvances.toString(),
    netPay: p.netPay.toString(),
  })
}
