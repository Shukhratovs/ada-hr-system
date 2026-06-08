'use client'

import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color: 'green' | 'yellow' | 'red' | 'blue' | 'amber' | 'slate'
  icon: React.ReactNode
  href?: string
}

const colorMap = {
  green: {
    iconBg: 'bg-emerald-100 text-emerald-600',
    value: 'text-slate-900',
    dot: 'bg-emerald-500',
  },
  yellow: {
    iconBg: 'bg-yellow-100 text-yellow-600',
    value: 'text-slate-900',
    dot: 'bg-yellow-500',
  },
  red: {
    iconBg: 'bg-red-100 text-red-500',
    value: 'text-slate-900',
    dot: 'bg-red-500',
  },
  blue: {
    iconBg: 'bg-blue-100 text-blue-600',
    value: 'text-slate-900',
    dot: 'bg-blue-500',
  },
  amber: {
    iconBg: 'bg-amber-100 text-amber-600',
    value: 'text-slate-900',
    dot: 'bg-amber-500',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-600',
    value: 'text-slate-900',
    dot: 'bg-slate-400',
  },
}

export default function StatCard({ label, value, sub, color, icon, href }: StatCardProps) {
  const c = colorMap[color]
  const inner = (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className={`${c.iconBg} w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} mt-1.5`} />
      </div>
      <div className={`text-2xl font-bold ${c.value} tabular-nums leading-none`}>{value}</div>
      <div className="text-slate-500 text-xs font-medium mt-1.5 leading-tight">{label}</div>
      {sub && <div className="text-slate-400 text-xs mt-0.5">{sub}</div>}
    </>
  )
  const base = 'bg-white rounded-2xl p-5 shadow-sm border border-slate-100'
  if (href) {
    return (
      <Link href={href} className={`${base} block transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}>
        {inner}
      </Link>
    )
  }
  return <div className={base}>{inner}</div>
}
