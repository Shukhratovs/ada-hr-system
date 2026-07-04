'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatMoney } from '@/lib/utils'

interface Analytics {
  days: number
  kpi: { totalHours: number; totalCost: number; avgPresent: number; avgArrival: string | null }
  daily: { date: string; present: number; hours: number; cost: number }[]
  weekly: { weekStart: string; cost: number }[]
  weekday: { dow: number; avgPresent: number }[]
  arrival: { hour: number; count: number }[]
  top: { name: string; hours: number }[]
}

interface Tip {
  xPct: number
  lines: string[]
}

function niceMax(v: number) {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * pow >= v) return m * pow
  }
  return 10 * pow
}

function compactSum(v: number, lang: string) {
  if (v >= 1_000_000) return (Math.round(v / 100_000) / 10) + (lang === 'uz' ? ' mln' : ' млн')
  if (v >= 1_000) return Math.round(v / 1_000) + (lang === 'uz' ? ' ming' : ' тыс')
  return String(Math.round(v))
}

// Rounded top only — data-end rounding anchored to the baseline
function topRoundedRect(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

function TipBox({ tip }: { tip: Tip | null }) {
  if (!tip) return null
  const flip = tip.xPct > 72
  return (
    <div
      className="absolute top-1 z-10 pointer-events-none rounded-lg bg-slate-900 text-white text-[11px] px-2.5 py-1.5 shadow-xl whitespace-nowrap"
      style={flip ? { right: `${100 - tip.xPct}%` } : { left: `${tip.xPct}%` }}
    >
      {tip.lines.map((l, i) => (
        <div key={i} className={i === 0 ? 'text-slate-400 font-medium' : 'font-semibold tabular-nums'}>{l}</div>
      ))}
    </div>
  )
}

const W = 600
const H = 210
const PAD_L = 40
const PAD_B = 22
const PAD_T = 10

interface Col {
  label: string
  value: number
  highlight?: boolean
  tipLines: string[]
}

function ColumnChart({ data, labelEvery = 1, tickFormat }: {
  data: Col[]
  labelEvery?: number
  tickFormat: (v: number) => string
}) {
  const [tip, setTip] = useState<Tip | null>(null)
  const [hovered, setHovered] = useState(-1)
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const innerW = W - PAD_L - 6
  const innerH = H - PAD_T - PAD_B
  const slot = innerW / Math.max(data.length, 1)
  const barW = Math.min(slot * 0.68, 42)
  const y = (v: number) => PAD_T + innerH * (1 - v / max)

  return (
    <div className="relative">
      <TipBox tip={tip} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD_L} x2={W - 6} y1={y(max * f)} y2={y(max * f)} stroke="var(--viz-grid)" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="var(--viz-muted)" className="tabular-nums">
              {tickFormat(max * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const bx = PAD_L + i * slot + (slot - barW) / 2
          const by = y(d.value)
          const bh = PAD_T + innerH - by
          return (
            <g key={i}>
              {bh > 0.5 && (
                <path
                  d={topRoundedRect(bx, by, barW, bh, 3)}
                  fill={d.highlight ? 'var(--viz-accent)' : 'var(--viz-series)'}
                  opacity={hovered === -1 || hovered === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={bx + barW / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--viz-muted)">
                  {d.label}
                </text>
              )}
              <rect
                x={PAD_L + i * slot} y={PAD_T} width={slot} height={innerH + PAD_B}
                fill="transparent"
                onMouseEnter={() => { setHovered(i); setTip({ xPct: ((PAD_L + i * slot + slot / 2) / W) * 100, lines: d.tipLines }) }}
                onMouseLeave={() => { setHovered(-1); setTip(null) }}
              />
            </g>
          )
        })}
        <line x1={PAD_L} x2={W - 6} y1={PAD_T + innerH} y2={PAD_T + innerH} stroke="var(--viz-grid)" strokeWidth="1.5" />
      </svg>
    </div>
  )
}

function AreaChart({ data, labelEvery, tickFormat }: {
  data: Col[]
  labelEvery: number
  tickFormat: (v: number) => string
}) {
  const [tip, setTip] = useState<Tip | null>(null)
  const [hovered, setHovered] = useState(-1)
  const max = niceMax(Math.max(...data.map((d) => d.value), 1))
  const innerW = W - PAD_L - 10
  const innerH = H - PAD_T - PAD_B
  const x = (i: number) => PAD_L + (data.length < 2 ? innerW / 2 : (i / (data.length - 1)) * innerW)
  const y = (v: number) => PAD_T + innerH * (1 - v / max)
  const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1).toFixed(1)},${PAD_T + innerH} L${x(0).toFixed(1)},${PAD_T + innerH} Z`

  return (
    <div className="relative">
      <TipBox tip={tip} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD_L} x2={W - 10} y1={y(max * f)} y2={y(max * f)} stroke="var(--viz-grid)" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="var(--viz-muted)" className="tabular-nums">
              {tickFormat(max * f)}
            </text>
          </g>
        ))}
        <path d={area} fill="var(--viz-series-soft)" />
        <path d={line} fill="none" stroke="var(--viz-series)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hovered >= 0 && (
          <>
            <line x1={x(hovered)} x2={x(hovered)} y1={PAD_T} y2={PAD_T + innerH} stroke="var(--viz-muted)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hovered)} cy={y(data[hovered].value)} r="4.5" fill="var(--viz-series)" stroke="white" strokeWidth="2" />
          </>
        )}
        {data.map((d, i) => (
          <g key={i}>
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--viz-muted)">{d.label}</text>
            )}
            <rect
              x={x(i) - (innerW / Math.max(data.length - 1, 1)) / 2} y={PAD_T}
              width={innerW / Math.max(data.length - 1, 1)} height={innerH + PAD_B}
              fill="transparent"
              onMouseEnter={() => { setHovered(i); setTip({ xPct: (x(i) / W) * 100, lines: d.tipLines }) }}
              onMouseLeave={() => { setHovered(-1); setTip(null) }}
            />
          </g>
        ))}
      </svg>
    </div>
  )
}

function HBarList({ data, format }: { data: { name: string; hours: number }[]; format: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.hours), 1)
  return (
    <div className="space-y-2.5 pt-1">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <div className="w-28 text-xs font-medium text-slate-600 truncate text-right">{d.name}</div>
          <div className="flex-1 h-4.5 relative">
            <div
              className="absolute inset-y-0 left-0 rounded-r"
              style={{ width: `${Math.max((d.hours / max) * 100, 1)}%`, background: 'var(--viz-series)', minWidth: 3, borderRadius: '0 4px 4px 0' }}
            />
          </div>
          <div className="w-16 text-xs font-semibold text-slate-800 tabular-nums">{format(d.hours)}</div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">—</p>}
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      {sub && <p className="text-xs text-slate-400 mt-0.5 mb-3">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </div>
  )
}

export default function AnalyticsPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d) })
      .finally(() => setLoading(false))
  }, [days])

  if (user && user.role !== 'DIRECTOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Access denied</p>
      </div>
    )
  }

  const dayNamesUz = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha']
  const dayNamesRu = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const dayNames = lang === 'uz' ? dayNamesUz : dayNamesRu
  const hoursUnit = lang === 'uz' ? 'soat' : 'ч'
  const fmtDayLabel = (dateStr: string) => dateStr.slice(8, 10) + '.' + dateStr.slice(5, 7)

  const dailyLabelEvery = days <= 7 ? 1 : days <= 30 ? 5 : 15

  return (
    <div>
      {/* Header + range filter */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('analytics')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {lang === 'uz' ? `So'nggi ${days} kun ko'rsatkichlari` : `Показатели за последние ${days} дней`}
          </p>
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                days === d ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {d} {lang === 'uz' ? 'kun' : 'дней'}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'uz' ? 'Jami ish soatlari' : 'Всего часов'}
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
                {data.kpi.totalHours.toLocaleString()} <span className="text-sm font-semibold text-slate-400">{hoursUnit}</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'uz' ? 'Mehnat xarajati' : 'Затраты на труд'}
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{formatMoney(data.kpi.totalCost)}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'uz' ? "O'rtacha kunlik davomat" : 'Средняя посещаемость'}
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">
                {data.kpi.avgPresent} <span className="text-sm font-semibold text-slate-400">{lang === 'uz' ? 'xodim' : 'сотр.'}</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'uz' ? "O'rtacha kelish vaqti" : 'Среднее время прихода'}
              </p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{data.kpi.avgArrival ?? '—'}</p>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card
              title={lang === 'uz' ? 'Kunlik davomat' : 'Ежедневная посещаемость'}
              sub={lang === 'uz' ? 'Har kuni kelgan xodimlar soni' : 'Число пришедших сотрудников в день'}
            >
              <ColumnChart
                data={data.daily.map((d) => ({
                  label: fmtDayLabel(d.date),
                  value: d.present,
                  tipLines: [fmtDayLabel(d.date), `${d.present} ${lang === 'uz' ? 'xodim' : 'сотр.'}`],
                }))}
                labelEvery={dailyLabelEvery}
                tickFormat={(v) => String(Math.round(v))}
              />
            </Card>

            <Card
              title={lang === 'uz' ? 'Kunlik ish soatlari' : 'Отработанные часы в день'}
              sub={lang === 'uz' ? 'Barcha xodimlar bo\'yicha jami' : 'Суммарно по всем сотрудникам'}
            >
              <AreaChart
                data={data.daily.map((d) => ({
                  label: fmtDayLabel(d.date),
                  value: d.hours,
                  tipLines: [fmtDayLabel(d.date), `${d.hours} ${hoursUnit}`],
                }))}
                labelEvery={dailyLabelEvery}
                tickFormat={(v) => String(Math.round(v))}
              />
            </Card>

            <Card
              title={lang === 'uz' ? 'Haftalik mehnat xarajati' : 'Недельные затраты на труд'}
              sub={lang === 'uz' ? "Ishlangan soatlar × stavka (yakshanba stavkasi hisobga olingan), so'mda" : 'Часы × ставка (с учётом воскресной), в сумах'}
            >
              <ColumnChart
                data={data.weekly.map((w) => ({
                  label: fmtDayLabel(w.weekStart),
                  value: w.cost,
                  tipLines: [
                    (lang === 'uz' ? 'Hafta: ' : 'Неделя: ') + fmtDayLabel(w.weekStart),
                    formatMoney(w.cost),
                  ],
                }))}
                labelEvery={1}
                tickFormat={(v) => compactSum(v, lang)}
              />
            </Card>

            <Card
              title={lang === 'uz' ? "Hafta kunlari bo'yicha davomat" : 'Посещаемость по дням недели'}
              sub={lang === 'uz' ? "O'rtacha kelgan xodimlar soni" : 'Среднее число пришедших'}
            >
              {/* Legend — Sunday is a separate (accent) series */}
              <div className="flex items-center gap-4 mb-1 -mt-1">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--viz-series)' }} />
                  {lang === 'uz' ? 'Oddiy kunlar' : 'Обычные дни'}
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--viz-accent)' }} />
                  {lang === 'uz' ? 'Yakshanba' : 'Воскресенье'}
                </span>
              </div>
              <ColumnChart
                data={data.weekday.map((d) => ({
                  label: dayNames[d.dow],
                  value: d.avgPresent,
                  highlight: d.dow === 0,
                  tipLines: [dayNames[d.dow], `${d.avgPresent} ${lang === 'uz' ? 'xodim' : 'сотр.'}`],
                }))}
                labelEvery={1}
                tickFormat={(v) => String(Math.round(v * 10) / 10)}
              />
            </Card>

            <Card
              title={lang === 'uz' ? 'Kelish vaqti taqsimoti' : 'Распределение времени прихода'}
              sub={lang === 'uz' ? 'Birinchi kirish soati bo\'yicha' : 'По часу первого прихода'}
            >
              <ColumnChart
                data={data.arrival.map((a) => ({
                  label: String(a.hour).padStart(2, '0') + ':00',
                  value: a.count,
                  tipLines: [
                    `${String(a.hour).padStart(2, '0')}:00–${String(a.hour + 1).padStart(2, '0')}:00`,
                    `${a.count} ${lang === 'uz' ? 'ta kelish' : 'приходов'}`,
                  ],
                }))}
                labelEvery={data.arrival.length > 10 ? 2 : 1}
                tickFormat={(v) => String(Math.round(v))}
              />
            </Card>

            <Card
              title={lang === 'uz' ? 'Eng ko\'p ishlagan xodimlar' : 'Топ сотрудников по часам'}
              sub={lang === 'uz' ? `So'nggi ${days} kun bo'yicha top-10` : `Топ-10 за ${days} дней`}
            >
              <HBarList data={data.top} format={(v) => `${v} ${hoursUnit}`} />
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
