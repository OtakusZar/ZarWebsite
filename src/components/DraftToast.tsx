import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

interface DraftToastProps {
  open: boolean
  label: string
  onDismiss: () => void
}

export function DraftToast({ open, label, onDismiss }: DraftToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-bottom)+5.5rem)] z-40 flex justify-center px-4">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/70 bg-ink-950/90 py-2 pl-3.5 pr-2 text-white shadow-float backdrop-blur-md"
            role="status"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-300" />
            <p className="text-[12px] font-medium">
              已恢复草稿 <span className="text-white/50">·</span>{' '}
              <span className="text-white/70">{label}</span>
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="grid h-6 w-6 place-items-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="关闭提示"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
