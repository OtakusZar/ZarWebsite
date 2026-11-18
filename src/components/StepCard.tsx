import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Info } from 'lucide-react'
import { Card } from './Card'
import { QuestionBlock } from './QuestionBlock'
import { cn } from '../lib/cn'
import type { ValidationIssue } from '../lib/answers'
import type { AnswerValue, Answers, Question, Section, SurveyStep } from '../types/survey'

interface StepCardProps {
  step: SurveyStep
  section: Section
  questions: Question[]
  answers: Answers
  errors: Record<string, ValidationIssue>
  errorPulse: number
  onAnswer: (questionId: string, value: AnswerValue) => void
}

function ScaleLegend({ question }: { question: Extract<Question, { kind: 'matrix' }> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {question.scale.map((point) => (
        <span
          key={point.value}
          className="inline-flex items-start gap-1.5 rounded-lg border border-ink-200/60 bg-white/70 px-2 py-1"
        >
          <span className="mt-[1px] font-mono text-[11px] font-bold tabular-nums text-ink-900">
            {point.value}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[11.5px] leading-tight text-ink-700">
              {point.labelCn ?? point.label}
            </span>
            <span className="mt-0.5 hidden text-[9.5px] leading-tight text-ink-400 sm:block">
              {point.label}
            </span>
          </span>
        </span>
      ))}
    </div>
  )
}

export function StepCard({
  step,
  section,
  questions,
  answers,
  errors,
  errorPulse,
  onAnswer,
}: StepCardProps) {
  const primary = questions[0]
  const grouped = questions.length > 1
  const shortcuts = questions.length === 1
  const errorList = Object.values(errors)
  const first = errorList[0]
  const isOptionalStep = questions.length > 0 && questions.every((question) => !question.required)

  // 中文是主标题，英文退为副标题。
  const title = step.titleCn ?? primary?.titleCn ?? step.title ?? primary?.title ?? ''
  const titleEn = step.titleCn ? step.title : primary?.titleCn ? primary?.title : undefined

  const description = step.descriptionCn ?? primary?.descriptionCn
  const descriptionEn = step.descriptionCn ? step.description : primary?.descriptionCn ? primary?.description : undefined

  return (
    <Card errorPulse={errorPulse} invalid={errorList.length > 0}>
      <div className="p-5 sm:p-8">
        {/* eyebrow: 题号 + 分册 + 必填标记 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center rounded-md bg-ink-900 px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white">
            {primary?.code ?? section.letter}
          </span>
          {step.eyebrowCn ? (
            <span className="inline-flex h-6 items-center rounded-md border border-ink-200/70 bg-white/60 px-2 text-[10.5px] font-medium tracking-[0.02em] text-ink-500">
              {step.eyebrowCn}
              {step.eyebrow ? (
                <span className="ml-1.5 hidden text-[9.5px] font-normal text-ink-300 sm:inline">
                  {step.eyebrow}
                </span>
              ) : null}
            </span>
          ) : null}
          <span className="text-[10.5px] font-medium tracking-[0.06em] text-ink-300">
            {section.titleCn}
          </span>
          <span className="ml-auto">
            {isOptionalStep ? (
              <span className="inline-flex h-6 items-center rounded-md border border-ink-200/60 bg-ink-50/70 px-2 text-[10.5px] font-medium text-ink-400">
                选填
              </span>
            ) : (
              <span className="inline-flex h-6 items-center rounded-md border border-accent-100 bg-accent-50/70 px-2 text-[10.5px] font-medium text-accent-600">
                必填
              </span>
            )}
          </span>
        </div>

        <h2 className="balanced text-[21px] font-semibold leading-[1.35] tracking-[-0.01em] text-ink-900 sm:text-[26px]">
          {title}
        </h2>
        {titleEn ? (
          <p className="balanced mt-2 text-[12.5px] leading-relaxed text-ink-400 sm:text-[13px]">
            {titleEn}
          </p>
        ) : null}

        {primary?.kind === 'matrix' && primary.scale ? (
          <div className="mt-4 rounded-xl border border-ink-100/80 bg-ink-50/40 px-3 py-2.5">
            <ScaleLegend question={primary} />
          </div>
        ) : description ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-ink-100/80 bg-ink-50/40 px-3 py-2.5">
            <Info className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ink-300" />
            <div className="min-w-0">
              <p className="text-[12px] leading-relaxed text-ink-600">{description}</p>
              {descriptionEn ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-400">{descriptionEn}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {first ? (
            <motion.div
              key="validation"
              initial={{ opacity: 0, height: 0, y: -3 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -3 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-3.5 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium leading-snug text-rose-800">
                    {first.messageCn}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-rose-500/80">{first.message}</p>
                  {errorList.length > 1 ? (
                    <p className="mt-1 text-[11px] text-rose-400">
                      下方另有 {errorList.length - 1} 处需要填写。
                    </p>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className={cn('mt-5 space-y-5', !grouped && 'mt-6')}>
          {questions.map((question) => (
            <QuestionBlock
              key={question.id}
              question={question}
              answers={answers}
              grouped={grouped}
              shortcuts={shortcuts}
              invalid={Boolean(errors[question.id])}
              onAnswer={onAnswer}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
