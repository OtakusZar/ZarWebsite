import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, PencilLine, Send } from 'lucide-react'
import { Card } from './Card'
import { survey, visibleQuestionsOf } from '../data/survey'
import { summariseAnswer } from '../lib/answers'
import { cn } from '../lib/cn'
import type { Answers } from '../types/survey'

interface ReviewStepProps {
  answers: Answers
  errorPulse: number
  onEdit: (stepIndex: number) => void
  onSubmit: () => void
}

export function ReviewStep({ answers, errorPulse, onEdit, onSubmit }: ReviewStepProps) {
  const groups = useMemo(
    () =>
      survey.sections
        .filter((section) => section.id !== 'review')
        .map((section) => ({
          section,
          steps: survey.steps
            .map((step, index) => ({
              step,
              index,
              questions: step.sectionId === section.id ? visibleQuestionsOf(step, answers) : [],
            }))
            .filter((entry) => entry.questions.length > 0),
        }))
        .filter((group) => group.steps.length > 0),
    [answers],
  )

  const stats = useMemo(() => {
    let required = 0
    let missing = 0
    let answered = 0
    for (const group of groups) {
      for (const entry of group.steps) {
        for (const question of entry.questions) {
          const summary = summariseAnswer(question, answers)
          if (summary.answered) answered += 1
          if (question.required) {
            required += 1
            if (!summary.answered) missing += 1
          }
        }
      }
    }
    return { required, missing, answered }
  }, [answers, groups])

  return (
    <Card errorPulse={errorPulse} invalid={stats.missing > 0}>
      <div className="p-5 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-md bg-ink-900 px-2 text-[10.5px] font-semibold tracking-[0.06em] text-white">
                总览
              </span>
              <span className="text-[10.5px] font-medium tracking-[0.08em] text-ink-300">
                最后一步 · Final step
              </span>
            </div>
            <h2 className="balanced text-[21px] font-semibold leading-[1.35] tracking-[-0.01em] text-ink-900 sm:text-[26px]">
              核对并提交
            </h2>
            <p className="mt-1.5 text-[12.5px] text-ink-400">
              One last look before you send it.
            </p>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2',
              stats.missing > 0
                ? 'border-rose-200 bg-rose-50/70 text-rose-700'
                : 'border-emerald-200/80 bg-emerald-50/70 text-emerald-700',
            )}
          >
            {stats.missing > 0 ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="text-[12px] font-medium leading-tight">
              {stats.missing > 0
                ? `${stats.missing} 道必填题还没有答案`
                : `${stats.answered} 项回答已就绪`}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.section.id}>
              <header className="mb-2 flex items-center gap-2 px-1">
                <span className="grid h-5 w-5 place-items-center rounded-md bg-ink-100 font-mono text-[10px] font-semibold text-ink-500">
                  {group.section.letter}
                </span>
                <h3 className="text-[12px] font-semibold tracking-[0.04em] text-ink-600">
                  {group.section.titleCn}
                </h3>
                <span className="truncate text-[10.5px] text-ink-300">{group.section.title}</span>
              </header>

              <div className="divide-y divide-ink-100/80 overflow-hidden rounded-2xl border border-ink-100/90 bg-white/55">
                {group.steps.flatMap((entry) =>
                  entry.questions.map((question) => {
                    const summary = summariseAnswer(question, answers)
                    const missing = question.required && !summary.answered
                    return (
                      <div
                        key={question.id}
                        className={cn(
                          'flex items-start gap-3 px-3 py-3 transition-colors sm:px-4',
                          missing ? 'bg-rose-50/40' : 'hover:bg-white/70',
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-ink-300">
                              {question.code}
                              {question.kind === 'matrix' && question.groupLabelCn
                                ? ` · ${question.groupLabelCn}`
                                : ''}
                            </span>
                            <p className="text-[12.5px] font-medium leading-snug text-ink-700">
                              {question.titleCn ?? question.title}
                            </p>
                          </div>
                          <p
                            className={cn(
                              'mt-1 line-clamp-2 text-[12.5px] leading-snug',
                              missing ? 'text-rose-600' : 'text-ink-900',
                            )}
                          >
                            {missing ? '未填写' : summary.zh}
                            {!missing && summary.en && summary.en !== summary.zh ? (
                              <span className="text-ink-400"> · {summary.en}</span>
                            ) : null}
                          </p>
                          {summary.detail && !missing ? (
                            <p className="mt-0.5 line-clamp-1 font-mono text-[10.5px] leading-snug text-ink-400">
                              {summary.detail}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => onEdit(entry.index)}
                          className="mt-0.5 flex shrink-0 items-center gap-1 rounded-lg border border-ink-200/70 bg-white/80 px-2 py-1 text-[11px] font-medium text-ink-500 transition-colors hover:border-accent-300 hover:text-accent-700"
                          aria-label={`修改 ${question.code} 的回答`}
                        >
                          <PencilLine className="h-3 w-3" />
                          修改
                        </button>
                      </div>
                    )
                  }),
                )}
              </div>
            </section>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {stats.missing > 0 ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-3.5 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-[12.5px] leading-relaxed text-rose-700">
                  还有必填题没有完成。点右侧的「修改」回到对应题目，或者直接点继续 ——
                  我们会带你跳到第一处缺口。
                  <span className="mt-0.5 block text-[11px] text-rose-500/80">
                    A few required questions are still empty.
                  </span>
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] leading-relaxed text-ink-500">
            点击「提交问卷」完成填写，在此之前不会发送任何内容。
            <span className="mt-0.5 block text-[11px] text-ink-400">
              Nothing is sent until you submit.
            </span>
          </p>
          <button
            type="button"
            onClick={onSubmit}
            className="group flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent-600 px-5 text-[13.5px] font-medium text-white shadow-[0_14px_30px_-16px_rgba(41,71,212,0.9)] transition-colors hover:bg-accent-700"
          >
            提交问卷
            <span className="text-[10px] font-normal text-white/60">Submit</span>
            <Send className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </Card>
  )
}
