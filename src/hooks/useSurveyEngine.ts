import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { survey, visibleQuestionsOf } from '../data/survey'
import { isAnswered, validateQuestion, type ValidationIssue } from '../lib/answers'
import { buildSubmissionPayload } from '../lib/payload'
import { clearDraft, loadDraft, saveDraft } from '../lib/storage'
import { submitSurvey, type SubmitSuccess, type SurveySubmissionPayload } from '../services/submitSurvey'
import type { Answers, AnswerValue, Question } from '../types/survey'

export type Phase = 'welcome' | 'survey' | 'submitting' | 'success' | 'error'

const AUTO_ADVANCE_DELAY = 620

export interface SurveyEngine {
  phase: Phase
  index: number
  totalSteps: number
  step: (typeof survey.steps)[number]
  visibleQuestions: Question[]
  answers: Answers
  errors: Record<string, ValidationIssue>
  errorPulse: number
  submitError: string | null
  result: SubmitSuccess | null
  payload: SurveySubmissionPayload | null
  restoredDraft: boolean
  dismissRestored: () => void
  autoAdvance: boolean
  autoPending: boolean
  toggleAutoAdvance: () => void
  startedAt: number
  setAnswer: (questionId: string, value: AnswerValue) => void
  next: () => void
  back: () => void
  goTo: (index: number) => void
  /** Jump to a step for editing, then Continue returns to the review screen. */
  editStep: (index: number) => void
  returnAfterEdit: boolean
  submit: () => void
  restart: () => void
  startFresh: () => void
  retrySubmit: () => void
  resumeSurvey: () => void
  isFirstStep: boolean
  isLastStep: boolean
  answeredSteps: number
  progress: number
}

export function useSurveyEngine(): SurveyEngine {
  const [phase, setPhase] = useState<Phase>('welcome')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [errors, setErrors] = useState<Record<string, ValidationIssue>>({})
  const [errorPulse, setErrorPulse] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitSuccess | null>(null)
  const [payload, setPayload] = useState<SurveySubmissionPayload | null>(null)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [autoPending, setAutoPending] = useState(false)
  const [returnTo, setReturnTo] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState(() => Date.now())

  const stepTimesRef = useRef<Record<string, number>>({})
  const visitedRef = useRef<string[]>([])
  const enteredAtRef = useRef<number>(Date.now())
  const autoTimerRef = useRef<number | null>(null)
  const answersRef = useRef<Answers>({})
  const indexRef = useRef(0)
  const phaseRef = useRef<Phase>('welcome')
  const returnToRef = useRef<number | null>(null)
  const hydratingRef = useRef(true)

  answersRef.current = answers
  indexRef.current = index
  phaseRef.current = phase
  returnToRef.current = returnTo

  /* ---------------- hydrate from draft ---------------- */
  useEffect(() => {
    const draft = loadDraft(survey.id)
    if (draft && Object.keys(draft.answers).length > 0) {
      const anyAnswered = Object.keys(draft.answers).some((id) => id in survey.questions)
      if (anyAnswered) {
        const safeIndex = Math.min(Math.max(draft.index, 0), survey.steps.length - 1)
        setAnswers(draft.answers)
        setIndex(safeIndex)
        setStartedAt(draft.startedAt)
        stepTimesRef.current = draft.stepTimes ?? {}
        visitedRef.current = draft.visitedSteps?.length ? draft.visitedSteps : [survey.steps[safeIndex].id]
        setAutoAdvance(draft.autoAdvance)
        setRestoredDraft(true)
        setPhase('survey')
      }
    }
    enteredAtRef.current = Date.now()
    hydratingRef.current = false
  }, [])

  /* ---------------- persisted draft (debounced) ---------------- */
  useEffect(() => {
    if (hydratingRef.current || phase !== 'survey') return
    const timer = window.setTimeout(() => {
      saveDraft({
        surveyId: survey.id,
        surveyVersion: survey.version,
        answers,
        index,
        startedAt,
        stepTimes: stepTimesRef.current,
        visitedSteps: visitedRef.current,
        autoAdvance,
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [answers, index, startedAt, autoAdvance, phase])

  // Flush the draft if the tab is hidden or closed mid-answer.
  useEffect(() => {
    const flush = () => {
      if (phaseRef.current !== 'survey') return
      saveDraft({
        surveyId: survey.id,
        surveyVersion: survey.version,
        answers: answersRef.current,
        index: indexRef.current,
        startedAt,
        stepTimes: stepTimesRef.current,
        visitedSteps: visitedRef.current,
        autoAdvance,
      })
    }
    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [startedAt, autoAdvance])

  const step = survey.steps[index]
  const visibleQuestions = useMemo(
    () => visibleQuestionsOf(step, answers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, answers],
  )

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
    setAutoPending(false)
  }, [])

  /** Bank the time spent on the step we are leaving. */
  const flushTime = useCallback(() => {
    const now = Date.now()
    const elapsed = Math.max(0, now - enteredAtRef.current)
    const currentStep = survey.steps[indexRef.current]
    if (currentStep) {
      stepTimesRef.current[currentStep.id] = (stepTimesRef.current[currentStep.id] ?? 0) + elapsed
    }
    enteredAtRef.current = now
  }, [])

  const validateStep = useCallback((): boolean => {
    const currentStep = survey.steps[indexRef.current]
    const questions = visibleQuestionsOf(currentStep, answersRef.current)
    const issues: Record<string, ValidationIssue> = {}

    for (const question of questions) {
      const issue = validateQuestion(question, answersRef.current)
      if (issue) issues[question.id] = issue
    }

    if (Object.keys(issues).length > 0) {
      setErrors(issues)
      setErrorPulse((pulse) => pulse + 1)
      return false
    }

    setErrors({})
    return true
  }, [])

  /** Validation across every step — used by the review screen. */
  const findFirstIncompleteStep = useCallback((): { index: number | null; issues: Record<string, ValidationIssue> } => {
    for (let cursor = 0; cursor < survey.steps.length; cursor += 1) {
      const questions = visibleQuestionsOf(survey.steps[cursor], answersRef.current)
      const issues: Record<string, ValidationIssue> = {}
      for (const question of questions) {
        const issue = validateQuestion(question, answersRef.current)
        if (issue) issues[question.id] = issue
      }
      if (Object.keys(issues).length > 0) return { index: cursor, issues }
    }
    return { index: null, issues: {} }
  }, [])

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.min(Math.max(target, 0), survey.steps.length - 1)
      flushTime()
      const nextStep = survey.steps[clamped]
      if (nextStep && !visitedRef.current.includes(nextStep.id)) {
        visitedRef.current = [...visitedRef.current, nextStep.id]
      }
      setErrors({})
      setIndex(clamped)
      window.scrollTo({ top: 0, behavior: 'auto' })
    },
    [flushTime],
  )

  const next = useCallback(() => {
    clearAutoTimer()
    if (!validateStep()) return
    // Coming back from "Edit" on the review screen: return to the review.
    if (returnToRef.current !== null) {
      const target = returnToRef.current
      returnToRef.current = null
      setReturnTo(null)
      goTo(target)
      return
    }
    if (indexRef.current >= survey.steps.length - 1) return
    goTo(indexRef.current + 1)
  }, [clearAutoTimer, goTo, validateStep])

  const back = useCallback(() => {
    clearAutoTimer()
    setErrors({})
    setReturnTo(null)
    goTo(indexRef.current - 1)
  }, [clearAutoTimer, goTo])

  const editStep = useCallback(
    (target: number) => {
      returnToRef.current = survey.steps.length - 1
      setReturnTo(survey.steps.length - 1)
      setErrors({})
      goTo(target)
    },
    [goTo],
  )

  const setAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
      const question = survey.questions[questionId]
      const updated: Answers = { ...answersRef.current, [questionId]: value }
      answersRef.current = updated
      setAnswers(updated)
      setErrors((current) => {
        if (!current[questionId]) return current
        const copy = { ...current }
        delete copy[questionId]
        return copy
      })

      // Single-select questions may continue on their own once answered.
      if (
        autoAdvance &&
        question?.kind === 'single' &&
        question.autoAdvance &&
        phaseRef.current === 'survey'
      ) {
        const currentStep = survey.steps[indexRef.current]
        const questions = visibleQuestionsOf(currentStep, updated)
        if (questions.length === 1 && isAnswered(question, updated)) {
          clearAutoTimer()
          setAutoPending(true)
          autoTimerRef.current = window.setTimeout(() => {
            autoTimerRef.current = null
            setAutoPending(false)
            if (phaseRef.current !== 'survey') return
            if (!validateStep()) return
            if (returnToRef.current !== null) {
              const target = returnToRef.current
              returnToRef.current = null
              setReturnTo(null)
              goTo(target)
              return
            }
            goTo(indexRef.current + 1)
          }, AUTO_ADVANCE_DELAY)
        }
      }
    },
    [autoAdvance, clearAutoTimer, goTo, validateStep],
  )

  const runSubmit = useCallback(async () => {
    clearAutoTimer()
    flushTime()
    setSubmitError(null)
    setPhase('submitting')

    const built = buildSubmissionPayload({
      answers: answersRef.current,
      stepTimes: stepTimesRef.current,
      startedAt,
      visitedSteps: visitedRef.current,
      finalStepId: survey.steps[indexRef.current].id,
      autoAdvance,
    })
    setPayload(built)

    try {
      const response = await submitSurvey(built)
      if (response.success) {
        clearDraft(survey.id)
        setResult(response)
        setPhase('success')
        window.scrollTo({ top: 0 })
      } else {
        setSubmitError(response.error)
        setPhase('error')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong.')
      setPhase('error')
    }
  }, [autoAdvance, clearAutoTimer, flushTime, startedAt])

  const submit = useCallback(() => {
    const currentStep = survey.steps[indexRef.current]
    const isReview = currentStep.id === 'step-review'
    if (isReview) {
      const { index: badIndex, issues } = findFirstIncompleteStep()
      if (badIndex !== null) {
        goTo(badIndex)
        setErrors(issues)
        setErrorPulse((pulse) => pulse + 1)
        return
      }
    } else if (!validateStep()) {
      return
    }
    void runSubmit()
  }, [findFirstIncompleteStep, goTo, runSubmit, validateStep])

  const retrySubmit = useCallback(() => {
    void runSubmit()
  }, [runSubmit])

  /** Leave the error screen and keep editing — nothing was lost. */
  const resumeSurvey = useCallback(() => {
    setSubmitError(null)
    enteredAtRef.current = Date.now()
    setPhase('survey')
  }, [])

  const startFresh = useCallback(() => {
    clearAutoTimer()
    clearDraft(survey.id)
    setAnswers({})
    answersRef.current = {}
    setIndex(0)
    indexRef.current = 0
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setPayload(null)
    setRestoredDraft(false)
    stepTimesRef.current = {}
    visitedRef.current = [survey.steps[0].id]
    enteredAtRef.current = Date.now()
    setStartedAt(Date.now())
    setPhase('survey')
    setErrorPulse(0)
  }, [clearAutoTimer])

  const restart = useCallback(() => {
    clearAutoTimer()
    clearDraft(survey.id)
    setAnswers({})
    answersRef.current = {}
    setIndex(0)
    indexRef.current = 0
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setPayload(null)
    setRestoredDraft(false)
    stepTimesRef.current = {}
    visitedRef.current = []
    setPhase('welcome')
  }, [clearAutoTimer])

  useEffect(() => () => clearAutoTimer(), [clearAutoTimer])

  const dismissRestored = useCallback(() => setRestoredDraft(false), [])
  const toggleAutoAdvance = useCallback(() => setAutoAdvance((value) => !value), [])

  const answeredSteps = useMemo(() => {
    let count = 0
    for (const candidate of survey.steps) {
      const questions = visibleQuestionsOf(candidate, answers)
      if (questions.length === 0) continue
      const complete = questions.every(
        (question) => !question.required || isAnswered(question, answers),
      )
      if (complete) count += 1
    }
    return count
  }, [answers])

  return {
    phase,
    index,
    totalSteps: survey.steps.length,
    step,
    visibleQuestions,
    answers,
    errors,
    errorPulse,
    submitError,
    result,
    payload,
    restoredDraft,
    dismissRestored: dismissRestored,
    autoAdvance,
    autoPending,
    toggleAutoAdvance: toggleAutoAdvance,
    startedAt,
    setAnswer,
    next,
    back,
    goTo,
    editStep,
    returnAfterEdit: returnTo !== null,
    submit,
    restart,
    startFresh,
    retrySubmit,
    resumeSurvey,
    isFirstStep: index === 0,
    isLastStep: index === survey.steps.length - 1,
    answeredSteps,
    progress: (index + 1) / survey.steps.length,
  }
}
