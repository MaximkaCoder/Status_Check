'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  function close(cb: () => void) {
    setClosing(true)
    setTimeout(cb, 180)
  }

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    const header = document.querySelector('header') as HTMLElement | null
    const main = document.querySelector('main') as HTMLElement | null
    const transition = 'filter 0.15s ease'
    if (header) { header.style.transition = transition; header.style.filter = 'blur(3px)' }
    if (main)   { main.style.transition   = transition; main.style.filter   = 'blur(3px)' }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(onCancel)
      if (e.key === 'Enter')  close(onConfirm)
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      if (header) { header.style.filter = ''; header.style.transition = '' }
      if (main)   { main.style.filter   = ''; main.style.transition   = '' }
      document.removeEventListener('keydown', onKey)
    }
  }, [onCancel, onConfirm])

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-[300]",
          closing ? "animate-fade-out" : "animate-backdrop-in"
        )}
        onClick={() => close(onCancel)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-[301] p-4" role="dialog" aria-modal="true">
        <div
          className={cn(
            "bg-card rounded-2xl shadow-2xl w-full max-w-sm",
            closing ? "animate-overlay-out" : "animate-overlay-in"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center pt-6 pb-2">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              variant === 'danger'
                ? 'bg-rose-100 dark:bg-rose-900/40'
                : 'bg-indigo-100 dark:bg-indigo-900/40'
            )}>
              {variant === 'danger' ? (
                <svg className="h-6 w-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-3 text-center space-y-1.5">
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={() => close(onCancel)}
              className={cn(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold',
                'border border-border text-foreground hover:bg-muted/60',
                'transition-all duration-150 cursor-pointer'
              )}
              autoFocus
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => close(onConfirm)}
              className={cn(
                'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold',
                variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white',
                'shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
