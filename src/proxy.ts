import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/kiosk', '/api/auth/login', '/api/attendance/checkin']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    const session = await getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only director can access payroll approve/paid actions
    if (pathname.includes('/payroll/approve') || pathname.includes('/payroll/paid')) {
      if (session.role !== 'DIRECTOR') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.next()
  }

  const session = await getSessionFromRequest(req)
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|models|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.ico).*)'],
}
