import { useCallback } from 'react'
import { OptionCard } from '../OptionCard'
import { useOptionShortcuts } from '../../hooks/useOptionShortcuts'
import { cn } from '../../lib/cn'
import type { SingleQuestion } from '../../types/survey'

interface SingleChoiceQuestionProps {
  question: SingleQuestion
  value: string | undefined
  onChange: (value: string) => void
  shortcuts: boolean
  invalid: boolean
}

export function SingleChoiceQuestion({
  question,
  value,
  onChange,
  shortcuts,
  invalid,
}: SingleChoiceQuestionProps) {
  const pick = useCallback(
    (index: number) => {
      const option = question.options[index]
      if (option) onChange(option.id)
    },
    [onChange, question.options],
  )

  useOptionShortcuts(shortcuts, question.options.length, pick)

  return (
    <div
      role="radiogroup"
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
          selected={value === option.id}
          onSelect={() => onChange(option.id)}
          compact={question.layout === 'grid'}
        />
      ))}
    </div>
  )
}
