import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Chinese body copy — the primary line. */
  bodyZh: string
  /** English body copy — the muted second line. */
  bodyEn?: string
  confirmLabel: string
  cancelLabel?: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  bodyZh,
  bodyEn,
  confirmLabel,
  cancelLabel = '继续填写',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="absolute inset-0 bg-ink-950/35 backdrop-blur-[3px]"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-sm rounded-[26px] border border-white/60 bg-white/95 p-6 shadow-float"
          >
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
              <RotateCcw className="h-5 w-5 text-rose-500" />
            </div>
            <h3 id="confirm-title" className="text-[16.5px] font-semibold tracking-tight text-ink-900">
              {title}
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{bodyZh}</p>
            {bodyEn ? (
              <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{bodyEn}</p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="h-11 flex-1 rounded-xl border border-ink-200/80 bg-white text-[13px] font-medium text-ink-700 transition-colors hover:bg-ink-50/60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-11 flex-1 rounded-xl bg-rose-600 text-[13px] font-medium text-white transition-colors hover:bg-rose-700"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
