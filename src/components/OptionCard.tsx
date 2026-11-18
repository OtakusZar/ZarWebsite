import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { usePressSelect } from '../hooks/usePressSelect'
import { cn } from '../lib/cn'
import { SPRING } from '../lib/motion'

interface OptionCardProps {
  index: number
  /** Chinese label — rendered large. */
  label: string
  /** English label — rendered small underneath. */
  labelEn?: string
  selected: boolean
  multi?: boolean
  onSelect: () => void
  compact?: boolean
}

export function OptionCard({
  index,
  label,
  labelEn,
  selected,
  multi = false,
  onSelect,
  compact = false,
}: OptionCardProps) {
  // 手指抬起即选中，不等 click（手机上 click 可能被滚动取消）
  const { pressed, handlers } = usePressSelect(onSelect)

  return (
    <motion.button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      {...handlers}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={SPRING}
      className={cn(
        'group relative flex w-full items-center gap-3 rounded-2xl border text-left tap-highlight-none',
        'select-none touch-manipulation',
        'transition-[border-color,background-color,box-shadow] duration-200',
        compact ? 'min-h-[54px] px-3.5 py-2.5' : 'min-h-[56px] px-4 py-3',
        selected || pressed
          ? 'border-accent-500/80 bg-accent-50/80 shadow-[0_0_0_3px_rgba(58,99,242,0.10),0_12px_28px_-20px_rgba(58,99,242,0.9)]'
          : 'border-ink-200/80 bg-white/70 hover:border-ink-300 hover:bg-white hover:shadow-[0_10px_26px_-20px_rgba(16,18,27,0.55)]',
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-lg border font-mono text-[11px] font-medium transition-colors duration-200',
          selected
            ? 'border-accent-500 bg-accent-500 text-white'
            : 'border-ink-200/90 bg-ink-50/80 text-ink-400 group-hover:text-ink-600',
        )}
      >
        {index + 1}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block text-[14.5px] font-medium leading-snug transition-colors duration-200 sm:text-[15px]',
            selected ? 'text-ink-900' : 'text-ink-700',
          )}
        >
          {label}
        </span>
        {labelEn ? (
          <span
            className={cn(
              'mt-0.5 block text-[11.5px] leading-snug transition-colors duration-200',
              selected ? 'text-accent-700/70' : 'text-ink-400',
            )}
          >
            {labelEn}
          </span>
        ) : null}
      </span>

      <span
        aria-hidden
        className={cn(
          'grid h-[22px] w-[22px] shrink-0 place-items-center border transition-colors duration-200',
          multi ? 'rounded-[7px]' : 'rounded-full',
          selected
            ? 'border-accent-500 bg-accent-500'
            : 'border-ink-200 bg-white group-hover:border-ink-300',
        )}
      >
        <AnimatePresence initial={false}>
          {selected ? (
            <motion.span
              key="check"
              initial={{ scale: 0.2, opacity: 0, rotate: -25 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={SPRING}
              className="text-white"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3.2} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </motion.button>
  )
}
