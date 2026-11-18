import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { NavBar } from './NavBar'
import { ProgressHeader } from './ProgressHeader'
import { ReviewStep } from './ReviewStep'
import { StepCard } from './StepCard'
import { getSection } from '../data/survey'
import { stepVariants, stepVariantsReduced } from '../lib/motion'
import type { SurveyEngine } from '../hooks/useSurveyEngine'

interface SurveyScreenProps {
  engine: SurveyEngine
  direction: number
  onRequestRestart: () => void
}

export function SurveyScreen({ engine, direction, onRequestRestart }: SurveyScreenProps) {
  const reduceMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const section = getSection(engine.step.sectionId)
  const isReview = engine.step.id === 'step-review'

  // 每一步都从阅读区顶部开始。
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [engine.step.id])

  // 校验失败时把卡片（连同提示）带回视野。
  useEffect(() => {
    if (engine.errorPulse === 0) return
    scrollRef.current?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [engine.errorPulse, reduceMotion])

  const showShortcuts =
    engine.visibleQuestions.length === 1 && engine.visibleQuestions[0]?.kind !== 'text'

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <ProgressHeader
        index={engine.index}
        total={engine.totalSteps}
        section={section}
        autoAdvance={engine.autoAdvance}
        onToggleAutoAdvance={engine.toggleAutoAdvance}
        onRequestRestart={onRequestRestart}
      />

      <main ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-8 pt-5 sm:px-6 sm:pt-9">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={engine.step.id}
              custom={direction}
              variants={reduceMotion ? stepVariantsReduced : stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {isReview ? (
                <ReviewStep
                  answers={engine.answers}
                  errorPulse={engine.errorPulse}
                  onEdit={engine.editStep}
                  onSubmit={engine.submit}
                />
              ) : (
                <StepCard
                  step={engine.step}
                  section={section}
                  questions={engine.visibleQuestions}
                  answers={engine.answers}
                  errors={engine.errors}
                  errorPulse={engine.errorPulse}
                  onAnswer={engine.setAnswer}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10.5px] text-ink-300">
            <span className="h-1 w-1 rounded-full bg-emerald-400/90" />
            答案实时保存在本机 · Draft saved on this device
          </div>
        </div>
      </main>

      <NavBar
        isFirst={engine.isFirstStep}
        isLast={engine.isLastStep}
        onBack={engine.back}
        onNext={engine.isLastStep ? engine.submit : engine.next}
        autoPending={engine.autoPending}
        showShortcuts={showShortcuts}
        primaryLabel={
          engine.isLastStep ? '提交问卷' : engine.returnAfterEdit ? '返回总览' : '下一题'
        }
        primaryLabelEn={
          engine.isLastStep ? 'Submit' : engine.returnAfterEdit ? 'Back to review' : 'Next'
        }
      />
    </div>
  )
}
