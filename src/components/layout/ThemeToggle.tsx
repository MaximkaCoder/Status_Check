'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { withViewTransition } from '@/lib/view-transition'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return (
    <button className="flex h-8 w-8 items-center justify-center rounded-xl opacity-0" aria-hidden="true" tabIndex={-1} type="button" />
  )

  return (
    <button
      onClick={() => withViewTransition(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl",
        "bg-white/40 dark:bg-white/[0.06]",
        "border border-white/70 dark:border-white/[0.10]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none",
        "text-slate-500 dark:text-white/60",
        "hover:bg-white/60 dark:hover:bg-white/[0.10] hover:text-slate-700 dark:hover:text-white",
        "transition-all duration-150 cursor-pointer outline-none"
      )}
      aria-label="Toggle theme"
      type="button"
    >
      {theme === 'dark' ? (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}
