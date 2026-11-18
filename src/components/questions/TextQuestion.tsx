import { cn } from '../../lib/cn'
import type { TextQuestion } from '../../types/survey'

interface TextQuestionProps {
  question: TextQuestion
  value: string | undefined
  onChange: (value: string) => void
  invalid: boolean
}

export function TextQuestion({ question, value, onChange, invalid }: TextQuestionProps) {
  const text = value ?? ''
  const remaining = question.maxLength - text.length
  const nearLimit = remaining <= 40

  const shared = cn(
    'w-full rounded-2xl border bg-white/70 text-[15px] text-ink-900 outline-none',
    'transition-[border-color,box-shadow,background-color] duration-200',
    'placeholder:text-ink-400 focus:bg-white',
    'focus:border-accent-400 focus:shadow-[0_0_0_4px_rgba(58,99,242,0.10)]',
    invalid ? 'border-rose-300 bg-rose-50/30' : 'border-ink-200/80 hover:border-ink-300',
  )

  if (question.multiline) {
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          maxLength={question.maxLength}
          rows={6}
          placeholder={question.placeholderCn ?? question.placeholder}
          aria-label={question.titleCn ?? question.title}
          aria-invalid={invalid}
          spellCheck
          className={cn(shared, 'min-h-[150px] resize-none px-4 py-3.5 leading-relaxed')}
        />
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="line-clamp-2 text-[11px] leading-snug text-ink-400">
            {question.placeholder}
          </p>
          <p
            className={cn(
              'shrink-0 font-mono text-[11px] tabular-nums',
              nearLimit ? 'text-rose-500' : 'text-ink-300',
            )}
          >
            {text.length} / {question.maxLength}
          </p>
        </div>
      </div>
    )
  }

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => onChange(event.target.value)}
      maxLength={question.maxLength}
      placeholder={question.placeholderCn ?? question.placeholder}
      aria-label={question.titleCn ?? question.title}
      aria-invalid={invalid}
      autoComplete="off"
      enterKeyHint="next"
      className={cn(shared, 'h-12 px-4')}
    />
  )
}
