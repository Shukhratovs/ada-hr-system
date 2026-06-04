'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatTime, formatDate, formatMoney } from '@/lib/utils'

interface DashboardData {
  totalEmployees: number
  currentlyWorking: number
  notWorking: number
  weeklyPayroll: string
  recentCheckins: Array<{
    id: string
    checkIn: string | null
    checkOut: string | null
    status: string
    employee: { name: string }
  }>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useLang()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData)
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-slate-400 text-xs font-medium">{t('loading')}</span>
        </div>
      </div>
    )
  }

  const statusBadge = (status: string, checkOut: string | null) => {
    if ((status === 'PRESENT' || status === 'LATE') && !checkOut)
      return <span className="text-[11px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">{t('present')}</span>
    return <span className="text-[11px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">{t('absent')}</span>
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('dashboard')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">{formatDate(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{user?.role === 'DIRECTOR' ? t('director') : 'HR'}</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-7">
        <StatCard
          label={t('totalEmployees')}
          value={data.totalEmployees}
          color="slate"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label={t('presentToday')}
          value={data.currentlyWorking}
          color="green"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label={t('absentToday')}
          value={data.notWorking}
          color="red"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent check-ins */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">{t('recentCheckins')}</h2>
            <a href="/attendance" className="text-xs text-amber-500 hover:text-amber-600 font-semibold flex items-center gap-1">
              {t('attendance')}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          <div className="divide-y divide-slate-50">
            {data.recentCheckins.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-slate-400 text-sm">{t('noActivity')}</p>
              </div>
            ) : (
              data.recentCheckins.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <Avatar name={r.employee.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{r.employee.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      {r.checkIn ? formatTime(r.checkIn) : '—'}
                      {r.checkOut ? ` → ${formatTime(r.checkOut)}` : ''}
                    </div>
                  </div>
                  {statusBadge(r.status, r.checkOut)}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Weekly payroll card */}
        <div className="bg-slate-950 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest">{t('weeklyPayroll')}</p>
            <p className="text-slate-600 text-xs mt-0.5">{t('thisWeek')}</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mt-6 leading-tight tabular-nums">
              {formatMoney(BigInt(data.weeklyPayroll))}
            </div>
            <a
              href="/payroll"
              className="inline-flex items-center gap-1 mt-3 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              {t('payroll')}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
