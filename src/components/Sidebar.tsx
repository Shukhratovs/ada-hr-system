'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from './LanguageProvider'
import { useAuth } from './AuthProvider'
import Logo from './Logo'

const navItems = [
  {
    href: '/dashboard',
    key: 'dashboard' as const,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    mobileIcon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/employees',
    key: 'employees' as const,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    mobileIcon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/attendance',
    key: 'attendance' as const,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    mobileIcon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/payroll',
    key: 'payroll' as const,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    mobileIcon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

const statsItem = {
  href: '/stats',
  key: 'stats' as const,
  icon: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  mobileIcon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {initials}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { t, lang, setLang } = useLang()
  const { user, logout } = useAuth()

  const allNavItems = [
    ...navItems,
    ...(user?.role === 'DIRECTOR' ? [statsItem] : []),
  ]

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 bg-slate-950 flex-col h-screen flex-shrink-0 border-r border-slate-800/50">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <Logo size="lg" />
            <div className="min-w-0">
              <div className="text-white text-base font-extrabold leading-tight tracking-tight">ADA</div>
              <div className="text-amber-400 text-[11px] font-semibold truncate tracking-wide">Lazzatli Sifat</div>
            </div>
          </div>
        </div>

        <div className="mx-4 border-t border-slate-800/60" />

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">
            {lang === 'uz' ? 'Navigatsiya' : 'Навигация'}
          </p>
          {allNavItems.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{t(item.key)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-5 pt-3 space-y-3">
          <div className="mx-1 border-t border-slate-800/60 mb-3" />
          <div className="flex gap-1 bg-slate-900 rounded-xl p-1">
            {(['uz', 'ru'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  lang === l ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {user && (
            <div className="bg-slate-900 rounded-2xl p-2.5 space-y-1">
              <Link
                href="/profile"
                className={`flex items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-150 ${
                  pathname.startsWith('/profile') ? 'bg-slate-800' : 'hover:bg-slate-800/70'
                }`}
              >
                <Avatar name={user.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate leading-tight">{user.name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    {user.role === 'DIRECTOR' ? t('director') : 'HR'}
                    <span className="text-slate-700">·</span>
                    <span className="text-amber-500/80">{lang === 'uz' ? 'Profil' : 'Профиль'}</span>
                  </div>
                </div>
                <svg className="w-3 h-3 text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-all duration-150"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile top header ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-950 border-b border-slate-800/60 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div>
            <div className="text-white text-sm font-extrabold leading-none">ADA</div>
            <div className="text-amber-400 text-[10px] font-semibold">Lazzatli Sifat</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-slate-900 rounded-lg p-0.5">
            {(['uz', 'ru'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                  lang === l ? 'bg-slate-700 text-white' : 'text-slate-500'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {user && (
            <Link href="/profile">
              <Avatar name={user.name} />
            </Link>
          )}
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950 border-t border-slate-800/60 flex items-stretch">
        {allNavItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                active ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              {item.mobileIcon}
              <span className="text-[9px] font-semibold">{t(item.key)}</span>
            </Link>
          )
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-slate-600 active:text-red-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-[9px] font-semibold">{t('logout')}</span>
        </button>
      </nav>
    </>
  )
}
