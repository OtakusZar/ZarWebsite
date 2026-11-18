import { memo, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { usePressSelect } from '../../hooks/usePressSelect'
import { cn } from '../../lib/cn'
import type { MatrixItem, MatrixQuestion as MatrixQuestionType, ScalePoint } from '../../types/survey'

interface MatrixQuestionProps {
  question: MatrixQuestionType
  value: Record<string, number> | undefined
  onChange: (value: Record<string, number>) => void
  shortcuts: boolean
  invalid: boolean
}

/* ------------------------------------------------------------------ *
 * 单个刻度格
 * 用普通 <button> + CSS 过渡，而不是 motion.button：
 * 一个 12 行的矩阵会有 60 个格子，Framer 的手势与样式计算在手机上很贵。
 * ------------------------------------------------------------------ */
interface RatingCellProps {
  point: ScalePoint
  selected: boolean
  showCaption: boolean
  onSelect: () => void
}

const RatingCell = memo(function RatingCell({
  point,
  selected,
  showCaption,
  onSelect,
}: RatingCellProps) {
  // pressed 会在 pointerdown 时立刻变 true，让这一格先变色；
  // 真正的选中状态随后由父级提交，视觉上就感觉不到等待。
  const { pressed, handlers } = usePressSelect(onSelect)
  const active = selected || pressed

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${point.value} — ${point.labelCn ?? point.label}`}
      {...handlers}
      className={cn(
        'group relative flex h-12 w-full flex-col items-center justify-center rounded-xl border',
        'select-none touch-manipulation',
        'transition-[background-color,border-color,color,transform] duration-150',
        'active:scale-[0.94]',
        active
          ? 'border-ink-900 bg-ink-900 text-white shadow-[0_10px_24px_-14px_rgba(16,18,27,0.8)]'
          : 'border-ink-200/80 bg-white/70 text-ink-500 hover:border-accent-300 hover:bg-accent-50/60 hover:text-accent-700',
        'sm:h-[46px]',
      )}
    >
      <span className="font-mono text-[13px] font-semibold tabular-nums">{point.value}</span>
      {showCaption ? (
        <span
          className={cn(
            'mt-0.5 text-[9px] font-medium leading-none',
            active ? 'text-white/75' : 'text-ink-400',
          )}
        >
          {point.shortCn ?? point.short}
        </span>
      ) : null}
    </button>
  )
})

/* ------------------------------------------------------------------ *
 * 一行
 * ------------------------------------------------------------------ */
interface MatrixRowProps {
  item: MatrixItem
  index: number
  scale: ScalePoint[]
  rating: number | undefined
  showCellCaption: boolean
  invalid: boolean
  focused: boolean
  onRate: (itemId: string, rating: number) => void
}

const MatrixRow = memo(function MatrixRow({
  item,
  index,
  scale,
  rating,
  showCellCaption,
  invalid,
  focused,
  onRate,
}: MatrixRowProps) {
  const selectedLabel = scale.find((point) => point.value === rating)
  const missing = invalid && rating === undefined

  return (
    <div
      className={cn(
        'grid gap-2 px-3 py-3 transition-colors duration-200 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6 sm:px-4',
        focused && 'bg-accent-50/40',
        !focused && rating !== undefined && 'bg-ink-50/30',
        missing && 'bg-rose-50/50',
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
          {/* 3 分制的格子里已经有中文标签，不用再重复 */}
          {!showCellCaption ? (
            <p className="mt-1 flex h-[15px] items-center text-[10.5px] font-medium leading-none text-accent-600">
              {selectedLabel ? `${rating} · ${selectedLabel.labelCn ?? selectedLabel.short}` : ''}
            </p>
          ) : null}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={item.labelCn ?? item.label}
        aria-invalid={invalid}
        className="grid gap-1.5 [grid-template-columns:repeat(var(--cols),minmax(0,1fr))] sm:[grid-template-columns:repeat(var(--cols),var(--cell))]"
        style={
          {
            '--cols': scale.length,
            '--cell': scale.length === 3 ? '74px' : '48px',
          } as CSSProperties
        }
      >
        {scale.map((point) => (
          <RatingCell
            key={point.value}
            point={point}
            selected={rating === point.value}
            showCaption={showCellCaption}
            onSelect={() => onRate(item.id, point.value)}
          />
        ))}
      </div>
    </div>
  )
})

/* ------------------------------------------------------------------ *
 * 矩阵
 * ------------------------------------------------------------------ */
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

  // 用 ref 保存最新的值，让 onRate 的引用保持稳定，
  // 这样 memo 过的行不会被无关的父级重渲染带着一起重画。
  const valueRef = useRef(record)
  valueRef.current = record
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const onRate = useCallback((itemId: string, rating: number) => {
    const next = { ...valueRef.current, [itemId]: rating }
    valueRef.current = next
    onChangeRef.current(next)
  }, [])

  const rowRefs = useRef<Array<HTMLDivElement | null>>([])

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
      onRate(item.id, rating)

      const nextMissing = question.items.findIndex(
        (candidate, index) => index > focusedRow && typeof valueRef.current[candidate.id] !== 'number',
      )
      if (nextMissing !== -1) setFocusedRow(nextMissing)
      else if (focusedRow < total - 1) setFocusedRow(focusedRow + 1)
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [focusedRow, onRate, question.items, question.scale, shortcuts, total])

  // 只有用键盘时才自动滚动，触摸时不要跟用户的手抢滚动
  useEffect(() => {
    if (!shortcuts || !keyboardActive) return
    rowRefs.current[focusedRow]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedRow, keyboardActive, shortcuts])

  return (
    <div
      className={cn(
        // 注意：这里刻意不用 backdrop-blur —— 手机上大面积实时模糊会让每次重绘慢一倍以上
        'overflow-hidden rounded-2xl border bg-white',
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
        {question.items.map((item, index) => (
          <div
            key={item.id}
            ref={(node) => {
              rowRefs.current[index] = node
            }}
          >
            <MatrixRow
              item={item}
              index={index}
              scale={question.scale}
              rating={record[item.id]}
              showCellCaption={showCellCaption}
              invalid={invalid}
              focused={shortcuts && keyboardActive && focusedRow === index}
              onRate={onRate}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
