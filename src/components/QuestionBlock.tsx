import { SingleChoiceQuestion } from './questions/SingleChoiceQuestion'
import { MultiChoiceQuestion } from './questions/MultiChoiceQuestion'
import { MatrixQuestion } from './questions/MatrixQuestion'
import { TextQuestion } from './questions/TextQuestion'
import { cn } from '../lib/cn'
import type { AnswerValue, Answers, MatrixAnswer, Question } from '../types/survey'

interface QuestionBlockProps {
  question: Question
  answers: Answers
  grouped: boolean
  shortcuts: boolean
  invalid: boolean
  onAnswer: (questionId: string, value: AnswerValue) => void
}

export function QuestionBlock({
  question,
  answers,
  grouped,
  shortcuts,
  invalid,
  onAnswer,
}: QuestionBlockProps) {
  const control = (() => {
    switch (question.kind) {
      case 'single':
        return (
          <SingleChoiceQuestion
            question={question}
            value={answers[question.id] as string | undefined}
            onChange={(value) => onAnswer(question.id, value)}
            shortcuts={shortcuts}
            invalid={invalid}
          />
        )
      case 'multi':
        return (
          <MultiChoiceQuestion
            question={question}
            value={answers[question.id] as string[] | undefined}
            onChange={(value) => onAnswer(question.id, value)}
            shortcuts={shortcuts}
            invalid={invalid}
          />
        )
      case 'matrix':
        return (
          <MatrixQuestion
            question={question}
            value={answers[question.id] as MatrixAnswer | undefined}
            onChange={(value) => onAnswer(question.id, value)}
            shortcuts={shortcuts}
            invalid={invalid}
          />
        )
      case 'text':
        return (
          <TextQuestion
            question={question}
            value={answers[question.id] as string | undefined}
            onChange={(value) => onAnswer(question.id, value)}
            invalid={invalid}
          />
        )
    }
  })()

  if (!grouped) return <div id={`q-${question.id}`}>{control}</div>

  return (
    <div
      id={`q-${question.id}`}
      className="scroll-mt-28 border-t border-dashed border-ink-200/70 pt-5 first:border-0 first:pt-0"
    >
      <div className="mb-3 flex items-start gap-2">
        <span
          className={cn(
            'mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full',
            invalid ? 'bg-rose-400' : 'bg-accent-400/70',
          )}
        />
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-ink-900 sm:text-[15.5px]">
            {question.titleCn ?? question.title}
            {question.required ? (
              <span className="ml-1 align-middle text-[11px] font-normal text-rose-400">*</span>
            ) : null}
          </h3>
          {question.titleCn ? (
            <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{question.title}</p>
          ) : null}
        </div>
      </div>
      {control}
    </div>
  )
}
