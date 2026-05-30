'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { isPast, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { translations } from '@/lib/i18n'
import type { StatusItem } from '@/lib/types'

interface ItemDetailOverlayProps {
  item: StatusItem
  onClose: () => void
  onDelete?: (id: string) => Promise<void>
}

function formatDateLocale(date: Date, locale: string, monthsEn: readonly string[], monthsUkGen: readonly string[]): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  if (locale === 'uk') {
    return `${date.getDate()} ${monthsUkGen[date.getMonth()]}, ${date.getFullYear()} · ${h}:${m}`
  }
  return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${h}:${m}`
}

function formatDeadlineLocale(date: Date, today: string, tomorrow: string, locale: string, monthsEn: readonly string[], monthsUkGen: readonly string[]): string {
  if (isToday(date)) return today
  if (isTomorrow(date)) return tomorrow
  return formatDateLocale(date, locale, monthsEn, monthsUkGen)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
    'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-teal-500', 'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function ItemDetailOverlay({ item, onClose, onDelete }: ItemDetailOverlayProps) {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const monthsEn = translations.en.months
  const monthsUkGen = translations.uk.monthsGenitive

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  function close() {
    if (isClosingRef.current) return
    isClosingRef.current = true
    setIsClosing(true)
    closeTimer.current = setTimeout(onClose, 180)
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    const header = document.querySelector('header') as HTMLElement | null
    const main = document.querySelector('main') as HTMLElement | null
    const transition = 'filter 0.15s ease'
    if (header) { header.style.transition = transition; header.style.filter = 'blur(3px)' }
    if (main)   { main.style.transition   = transition; main.style.filter   = 'blur(3px)' }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      if (header) { header.style.filter = ''; header.style.transition = '' }
      if (main)   { main.style.filter   = ''; main.style.transition   = '' }
    }
  }, [handleKeyDown])

  async function doDelete() {
    if (!onDelete) return
    await onDelete(item.id)
    onClose()
  }

  const deadline = new Date(item.deadline)
  const isOverdue = item.status === 'OVERDUE'
  const isPastDeadline = isPast(deadline) && item.status !== 'DONE'
  const deadlineLabel = formatDeadlineLocale(deadline, t('today'), t('tomorrow'), locale, monthsEn, monthsUkGen)
  const avatarColor = getAvatarColor(item.creator_name)
  const avatarInitial = item.creator_name.charAt(0).toUpperCase()

  if (!mounted) return null

  const overlay = createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[100]",
          isClosing ? "animate-fade-out" : "animate-backdrop-in"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[101] p-4"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        <div
          className={cn(
            "bg-card rounded-2xl shadow-2xl w-full max-w-lg",
            isClosing ? "animate-overlay-out" : "animate-overlay-in"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5 pb-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-snug break-words">
                {item.title}
              </h2>
            </div>
            <button
              onClick={close}
              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              type="button"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
            </div>

            {item.description && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t('description')}
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Created at */}
              <div className="rounded-xl bg-muted/50 p-3 col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('createdAt')}
                </p>
                <span className="text-sm font-medium text-foreground">
                  {formatDateLocale(new Date(item.created_at), locale, monthsEn, monthsUkGen)}
                </span>
              </div>

              {/* Deadline */}
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('deadline')}
                </p>
                <span className={cn(
                  'text-sm font-medium',
                  (isOverdue || isPastDeadline) ? 'text-rose-600' : 'text-foreground'
                )}>
                  {deadlineLabel}
                  {(isOverdue || isPastDeadline) && (
                    <span className="ml-1.5 text-xs font-normal text-rose-500/80">· {t('overdue')}</span>
                  )}
                </span>
              </div>

              {/* Creator */}
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {t('by')}
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded-full text-white flex-shrink-0',
                      'text-[10px] font-bold leading-none',
                      avatarColor
                    )}
                    aria-hidden="true"
                  >
                    {avatarInitial}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.creator_name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60">
            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium',
                  'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50',
                  'transition-all duration-150 cursor-pointer'
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('deleteItem')}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/items/${item.id}/edit`)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold',
                'bg-indigo-600 text-white hover:bg-indigo-700',
                'shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer'
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('editItem')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )

  return (
    <>
      {overlay}
      {confirmDelete && (
        <ConfirmDialog
          title={t('confirmDelete')}
          description={`"${item.title}"`}
          confirmLabel={t('deleteItem')}
          cancelLabel={t('cancelBtn')}
          variant="danger"
          onConfirm={() => { setConfirmDelete(false); doDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
