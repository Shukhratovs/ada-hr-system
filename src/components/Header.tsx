'use client'

import { useLang } from './LanguageProvider'
import { TranslationKey } from '@/lib/translations'

interface HeaderProps {
  titleKey: TranslationKey
  children?: React.ReactNode
}

export default function Header({ titleKey, children }: HeaderProps) {
  const { t } = useLang()
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{t(titleKey)}</h1>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
