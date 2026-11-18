import { motion } from 'framer-motion'
import { RotateCcw, Zap } from 'lucide-react'
import { cn } from '../lib/cn'
import type { Section } from '../types/survey'

interface ProgressHeaderProps {
  index: number
  total: number
  section: Section
  autoAdvance: boolean
  onToggleAutoAdvance: () => void
  onRequestRestart: () => void
}

export function ProgressHeader({
  index,
  total,
  section,
  autoAdvance,
  onToggleAutoAdvance,
  onRequestRestart,
}: ProgressHeaderProps) {
  const progress = (index + 1) / total
  const percent = Math.round(progress * 100)

  return (
    <header className="relative z-30 shrink-0">
      {/* 进度条轨道 */}
      <div
        className="relative h-[3px] w-full bg-ink-900/[0.07]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="问卷进度"
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r from-ink-900 via-accent-600 to-accent-400"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24, mass: 0.9 }}
        >
          <span className="absolute -right-px inset-y-0 w-6 rounded-full bg-white/40 blur-[3px]" />
        </motion.div>
      </div>

      <div className="glass border-b border-ink-900/[0.06]">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-900 text-[11px] font-semibold tracking-wide text-white shadow-sm">
              {section.letter}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium leading-tight text-ink-800 sm:text-[13.5px]">
                {section.titleCn}
              </p>
              <p className="hidden truncate text-[10px] leading-tight text-ink-400 sm:block">
                {section.title}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              onClick={onToggleAutoAdvance}
              aria-pressed={autoAdvance}
              aria-label={autoAdvance ? '自动跳转已开启' : '自动跳转已关闭'}
              className={cn(
                'group flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors duration-200 sm:text-[12px]',
                autoAdvance
                  ? 'border-accent-200 bg-accent-50 text-accent-700'
                  : 'border-ink-200/70 bg-white/60 text-ink-400 hover:text-ink-600',
              )}
              title={
                autoAdvance
                  ? '单选后自动进入下一题（点此改为手动）'
                  : '当前为手动模式（点此改为自动跳转）'
              }
            >
              <Zap className={cn('h-3.5 w-3.5', autoAdvance && 'fill-accent-500/20')} />
              <span>{autoAdvance ? '自动' : '手动'}</span>
            </button>

            <button
              type="button"
              onClick={onRequestRestart}
              className="grid h-9 w-9 place-items-center rounded-full border border-ink-200/70 bg-white/60 text-ink-400 transition-colors hover:text-rose-600"
              title="重新开始"
              aria-label="重新开始"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-center gap-1 pl-1 font-mono text-[12px] sm:text-[13px]">
              <span className="hidden text-[10px] text-ink-300 sm:inline">{percent}%</span>
              <span className="font-semibold tabular-nums text-ink-900">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-ink-300">/</span>
              <span className="tabular-nums text-ink-400">{total}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
