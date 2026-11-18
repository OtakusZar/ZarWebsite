import { useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { OptionCard } from '../OptionCard'
import { useOptionShortcuts } from '../../hooks/useOptionShortcuts'
import { cn } from '../../lib/cn'
import type { MultiQuestion } from '../../types/survey'

interface MultiChoiceQuestionProps {
  question: MultiQuestion
  value: string[] | undefined
  onChange: (value: string[]) => void
  shortcuts: boolean
  invalid: boolean
}

export function MultiChoiceQuestion({
  question,
  value,
  onChange,
  shortcuts,
  invalid,
}: MultiChoiceQuestionProps) {
  const selected = value ?? []

  const toggle = useCallback(
    (id: string) => {
      const option = question.options.find((entry) => entry.id === id)
      if (!option) return

      if (selected.includes(id)) {
        onChange(selected.filter((entry) => entry !== id))
        return
      }

      // 「以上都没有」这类互斥项会清空其它选项；反之选了其它项也会清掉它。
      if (option.exclusive) {
        onChange([id])
        return
      }

      const exclusiveIds = question.options
        .filter((entry) => entry.exclusive)
        .map((entry) => entry.id)
      const cleaned = selected.filter((entry) => !exclusiveIds.includes(entry))

      if (question.maxSelections && cleaned.length >= question.maxSelections) return
      onChange([...cleaned, id])
    },
    [onChange, question.maxSelections, question.options, selected],
  )

  const pick = useCallback(
    (index: number) => {
      const option = question.options[index]
      if (option) toggle(option.id)
    },
    [question.options, toggle],
  )

  useOptionShortcuts(shortcuts, question.options.length, pick)

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-invalid={invalid}
        className={cn(
          'gap-2',
          question.layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col',
        )}
      >
        {question.options.map((option, index) => (
          <OptionCard
            key={option.id}
            index={index}
            label={option.labelCn ?? option.label}
            labelEn={option.labelCn ? option.label : undefined}
            selected={selected.includes(option.id)}
            multi
            onSelect={() => toggle(option.id)}
            compact={question.layout === 'grid'}
          />
        ))}
      </div>

      <div className="flex h-5 items-center justify-between px-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={selected.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="text-[11.5px] font-medium text-ink-400"
          >
            {selected.length === 0
              ? '可多选 · Select all that apply'
              : `已选 ${selected.length} 项 · ${selected.length} selected`}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
