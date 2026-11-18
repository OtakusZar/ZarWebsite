import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react'
import { cn } from '../lib/cn'

interface NavBarProps {
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onNext: () => void
  autoPending: boolean
  showShortcuts: boolean
  primaryLabel?: string
  /** English hint shown next to the Chinese label on wide screens. */
  primaryLabelEn?: string
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.35rem] items-center justify-center rounded-[5px] border border-ink-200/80 bg-white px-1 font-mono text-[10px] font-medium text-ink-500 shadow-[0_1px_0_rgba(27,31,43,0.08)]">
      {children}
    </kbd>
  )
}

export function NavBar({
  isFirst,
  isLast,
  onBack,
  onNext,
  autoPending,
  showShortcuts,
  primaryLabel,
  primaryLabelEn,
}: NavBarProps) {
  const label = primaryLabel ?? (isLast ? '提交问卷' : '下一题')
  const labelEn = primaryLabelEn ?? (isLast ? 'Submit' : 'Next')

  return (
    <footer className="relative z-20 shrink-0 border-t border-ink-900/[0.07] bg-[rgba(252,251,249,0.94)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[760px] px-4 sm:px-6">
        <div className="safe-bottom flex items-center gap-2.5 pt-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isFirst}
            className={cn(
              'flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-medium transition-all duration-200',
              'border-ink-200/70 bg-white/70 text-ink-600 hover:bg-white hover:text-ink-900',
              'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/70',
              'sm:px-4',
            )}
            aria-label="上一题"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">上一题</span>
          </button>

          <div className="hidden flex-1 items-center gap-3.5 pl-2 text-[11px] text-ink-400 md:flex">
            {showShortcuts ? (
              <span className="flex items-center gap-1.5">
                <Kbd>1</Kbd>
                <span>–</span>
                <Kbd>9</Kbd>
                <span>选择</span>
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              <span>{isLast ? '提交' : '下一题'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>esc</Kbd>
              <span>上一题</span>
            </span>
          </div>

          <motion.button
            type="button"
            onClick={onNext}
            whileTap={{ scale: 0.985 }}
            className={cn(
              'group relative flex h-12 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl px-5',
              'text-[14px] font-medium text-white transition-colors duration-200 sm:flex-none sm:px-7',
              'bg-ink-900 shadow-[0_14px_30px_-16px_rgba(15,18,25,0.9)] hover:bg-ink-800',
              'sm:min-w-[150px]',
            )}
          >
            {autoPending ? (
              <motion.span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease: 'linear' }}
              />
            ) : null}
            <span className="flex items-baseline gap-1.5">
              <span className="truncate">{label}</span>
              <span className="hidden text-[10px] font-normal text-white/45 sm:inline">{labelEn}</span>
            </span>
            {isLast ? (
              <Send className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            ) : autoPending ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
            )}
          </motion.button>
        </div>
      </div>
    </footer>
  )
}
