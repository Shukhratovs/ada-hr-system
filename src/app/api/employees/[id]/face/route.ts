import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

const DUPLICATE_THRESHOLD = 0.5

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || (session.role !== 'DIRECTOR' && session.role !== 'HR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { descriptor } = await req.json()

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return NextResponse.json({ error: 'Invalid face descriptor' }, { status: 400 })
  }

  // Check for duplicate face among OTHER active employees
  const others = await prisma.employee.findMany({
    where: { active: true, NOT: { id } },
    select: { id: true, name: true, faceDescriptor: true },
  })

  for (const emp of others) {
    if (!emp.faceDescriptor.length) continue
    const dist = euclideanDistance(descriptor as number[], emp.faceDescriptor)
    if (dist < DUPLICATE_THRESHOLD) {
      return NextResponse.json(
        { error: 'FACE_DUPLICATE', employeeName: emp.name },
        { status: 409 }
      )
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { faceDescriptor: descriptor },
  })

  return NextResponse.json({ ok: true, id: employee.id })
}
