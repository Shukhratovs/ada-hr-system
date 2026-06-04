'use client'

import { useState, useRef, useEffect } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  isAfter,
  getDay,
} from 'date-fns'

interface Props {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  maxDate?: string
  lang?: string
}

const MONTH_NAMES_UZ = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']
const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAY_LABELS = ['Du','Se','Ch','Pa','Ju','Sh','Ya']

export default function DateRangePicker({ from, to, onChange, maxDate, lang = 'uz' }: Props) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => startOfMonth(from ? new Date(from) : new Date()))
  const [hovered, setHovered] = useState<Date | null>(null)
  const [selecting, setSelecting] = useState<'from' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSelecting(null)
        setHovered(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fromDate = from ? new Date(from) : null
  const toDate = to ? new Date(to) : null
  const maxD = maxDate ? new Date(maxDate) : new Date()

  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) })
  const startOffset = (getDay(days[0]) + 6) % 7

  const isInRange = (d: Date) => {
    if (!fromDate) return false
    const end = selecting === 'from' ? hovered : toDate
    if (!end) return false
    const [s, e] = isBefore(fromDate, end) ? [fromDate, end] : [end, fromDate]
    return isAfter(d, s) && isBefore(d, e)
  }

  const isStart = (d: Date) => !!fromDate && isSameDay(d, fromDate)
  const isEnd = (d: Date) => !!toDate && isSameDay(d, toDate)
  const isToday = (d: Date) => isSameDay(d, new Date())
  const isDisabled = (d: Date) => isAfter(d, maxD)

  const handleClick = (d: Date) => {
    if (isDisabled(d)) return
    if (!selecting) {
      onChange(format(d, 'yyyy-MM-dd'), format(d, 'yyyy-MM-dd'))
      setSelecting('from')
    } else {
      const [s, e] = isBefore(d, fromDate!) ? [d, fromDate!] : [fromDate!, d]
      onChange(format(s, 'yyyy-MM-dd'), format(e, 'yyyy-MM-dd'))
      setSelecting(null)
      setHovered(null)
      setOpen(false)
    }
  }

  const monthLabel = (d: Date) => {
    const names = lang === 'ru' ? MONTH_NAMES_RU : MONTH_NAMES_UZ
    return `${names[d.getMonth()]} ${d.getFullYear()}`
  }

  const triggerLabel = fromDate && toDate
    ? `${format(fromDate, 'dd.MM.yyyy')} – ${format(toDate, 'dd.MM.yyyy')}`
    : lang === 'uz' ? 'Sana oralig\'ini tanlang' : 'Выберите период'

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-slate-300 transition-all shadow-sm min-w-64"
      >
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className={fromDate && toDate ? 'text-slate-800 font-semibold tabular-nums' : 'text-slate-400'}>
          {triggerLabel}
        </span>
        <svg className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover calendar */}
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 select-none w-72">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewDate(subMonths(viewDate, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-slate-800">{monthLabel(viewDate)}</span>
            <button
              onClick={() => setViewDate(addMonths(viewDate, 1))}
              disabled={isAfter(startOfMonth(addMonths(viewDate, 1)), maxD)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((l) => (
              <div key={l} className="text-center text-[11px] font-semibold text-slate-400 py-1">{l}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
            {days.map((d) => {
              const start = isStart(d)
              const end = isEnd(d)
              const inRange = isInRange(d)
              const disabled = isDisabled(d)
              const today = isToday(d)
              const highlight = start || end

              return (
                <div
                  key={d.toISOString()}
                  className={`flex items-center justify-center h-9 text-sm transition-colors
                    ${inRange ? 'bg-amber-50' : ''}
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-50'}
                  `}
                  onClick={() => handleClick(d)}
                  onMouseEnter={() => selecting === 'from' && !disabled && setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full font-medium transition-colors
                    ${highlight ? 'bg-amber-500 text-white font-bold shadow-sm' : ''}
                    ${today && !highlight ? 'ring-2 ring-amber-400 text-amber-600' : ''}
                    ${!highlight && !today ? 'text-slate-700' : ''}
                  `}>
                    {d.getDate()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Hint text */}
          <p className="text-center text-[11px] text-slate-400 mt-3">
            {selecting === 'from'
              ? (lang === 'uz' ? 'Tugash sanasini tanlang' : 'Выберите конечную дату')
              : (lang === 'uz' ? 'Boshlang\'ich sanani tanlang' : 'Выберите начальную дату')}
          </p>
        </div>
      )}
    </div>
  )
}
