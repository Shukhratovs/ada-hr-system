'use client'

import { useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export default function Logo({ size = 'md', dark = false }: LogoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`${sizes[size]} ${dark ? 'bg-amber-500' : 'bg-amber-500'} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        ADA
      </div>
    )
  }

  return (
    <div className={`${sizes[size]} rounded-xl overflow-hidden flex-shrink-0 shadow-sm`}>
      <img
        src="/logo.png"
        alt="ADA"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  )
}
