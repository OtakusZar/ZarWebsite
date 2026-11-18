import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { MatrixQuestion as MatrixQuestionType } from '../../types/survey'

interface MatrixQuestionProps {
  question: MatrixQuestionType
  value: Record<string, number> | undefined
  onChange: (value: Record<string, number>) => void
  shortcuts: boolean
  invalid: boolean
}

export function MatrixQuestion({
  question,
  value,
  onChange,
  shortcuts,
  invalid,
}: MatrixQuestionProps) {
  const record = value ?? {}
  const total = question.items.length
  const answered = question.items.filter((item) => typeof record[item.id] === 'number').length
  const showCellCaption = question.scale.length <= 3
  const [focusedRow, setFocusedRow] = useState(0)
  const [keyboardActive, setKeyboardActive] = useState(false)
  const rowRefs = useRef<Array<HTMLDivElement | null>>([])

  const setRating = useCallback(
    (itemId: string, rating: number) => {
      onChange({ ...record, [itemId]: rating })
    },
    [onChange, record],
  )

  /** 数字键为当前行打分，打完后自动跳到下一行未评分项。 */
  useEffect(() => {
    if (!shortcuts) return

    const handle = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        setKeyboardActive(true)
        setFocusedRow((current) => {
          const next = event.key === 'ArrowDown' ? current + 1 : current - 1
          return Math.min(Math.max(next, 0), total - 1)
        })
        return
      }

      if (!/^[1-9]$/.test(event.key)) return
      const rating = Number(event.key)
      if (!question.scale.some((point) => point.value === rating)) return

      event.preventDefault()
      setKeyboardActive(true)
      const item = question.items[focusedRow]
      if (!item) return
      setRating(item.id, rating)

      const nextMissing = question.items.findIndex(
        (candidate, index) => index > focusedRow && typeof record[candidate.id] !== 'number',
      )
      if (nextMissing !== -1) setFocusedRow(nextMissing)
      else if (focusedRow < total - 1) setFocusedRow(focusedRow + 1)
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [focusedRow, question.items, question.scale, record, setRating, shortcuts, total])

  // 用键盘移动时，保证当前行在可视区域内。
  useEffect(() => {
    if (!shortcuts) return
    rowRefs.current[focusedRow]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedRow, shortcuts])

  const cellStyle = {
    '--cols': question.scale.length,
    '--cell': question.scale.length === 3 ? '74px' : '48px',
  } as CSSProperties

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white/55 backdrop-blur-[2px]',
        invalid ? 'border-rose-200' : 'border-ink-200/70',
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-100/80 bg-ink-50/40 px-3.5 py-2 sm:px-4">
        <p className="font-mono text-[10.5px] tracking-[0.06em] text-ink-400">
          {question.groupLabelCn
            ? `${question.groupLabelCn} · ${question.groupLabel}`
            : '逐项评分 · Rate each item'}
        </p>
        <p
          className={cn(
            'font-mono text-[10.5px] tabular-nums',
            answered === total ? 'text-emerald-600' : 'text-ink-400',
          )}
        >
          {answered} / {total}
        </p>
      </div>

      <div className="divide-y divide-ink-100/70">
        {question.items.map((item, index) => {
          const selectedRating = record[item.id]
          const selectedLabel = question.scale.find((point) => point.value === selectedRating)
          const isFocused = shortcuts && keyboardActive && focusedRow === index

          return (
            <div
              key={item.id}
              ref={(node) => {
                rowRefs.current[index] = node
              }}
              className={cn(
                'grid gap-2 px-3 py-3 transition-colors duration-200 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-4',
                isFocused && 'bg-accent-50/40',
                !isFocused && selectedRating !== undefined && 'bg-ink-50/30',
                invalid && selectedRating === undefined && 'bg-rose-50/50',
              )}
            >
              <div className="flex items-start gap-2">
                <span className="mt-[3px] w-4 shrink-0 font-mono text-[10px] tabular-nums text-ink-300">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium leading-snug text-ink-800 sm:text-[14px]">
                    {item.labelCn ?? item.label}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-ink-400">{item.label}</p>
                  {/* 3 分制单元格里已经有中文标签，无需再重复一遍选中项 */}
                  {!showCellCaption ? (
                    <p className="mt-1 flex h-[15px] items-center text-[10.5px] font-medium leading-none text-accent-600">
                      {selectedLabel
                        ? `${selectedRating} · ${selectedLabel.labelCn ?? selectedLabel.short}`
                        : ''}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                role="radiogroup"
                aria-label={item.labelCn ?? item.label}
                aria-invalid={invalid}
                className="grid gap-1.5 [grid-template-columns:repeat(var(--cols),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--cols),var(--cell))]"
                style={cellStyle}
              >
                {question.scale.map((point) => {
                  const selected = selectedRating === point.value
                  return (
                    <motion.button
                      key={point.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`${point.value} — ${point.labelCn ?? point.label}`}
                      onClick={() => setRating(item.id, point.value)}
                      whileTap={{ scale: 0.93 }}
                      className={cn(
                        'group relative flex h-12 w-full flex-col items-center justify-center rounded-xl border',
                        'tap-highlight-none transition-colors duration-150 sm:h-[46px]',
                        selected
                          ? 'border-ink-900 bg-ink-900 text-white shadow-[0_10px_24px_-14px_rgba(16,18,27,0.8)]'
                          : 'border-ink-200/80 bg-white/70 text-ink-500 hover:border-accent-300 hover:bg-accent-50/60 hover:text-accent-700',
                      )}
                    >
                      <span className="font-mono text-[13px] font-semibold tabular-nums">
                        {point.value}
                      </span>
                      {showCellCaption ? (
                        <span
                          className={cn(
                            'mt-0.5 text-[9px] font-medium leading-none',
                            selected ? 'text-white/75' : 'text-ink-400',
                          )}
                        >
                          {point.shortCn ?? point.short}
                        </span>
                      ) : null}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
