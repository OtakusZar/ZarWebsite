import { getSection, survey, visibleQuestionsOf } from '../data/survey'
import { rawAnswer, summariseAnswer } from './answers'
import { detectDevice } from './device'
import type {
  MatrixRowAnswer,
  SubmittedAnswer,
  SurveySubmissionPayload,
} from '../services/submitSurvey'
import type { Answers, MatrixAnswer, MatrixQuestion } from '../types/survey'

export interface BuildPayloadInput {
  answers: Answers
  /** Milliseconds spent per step id. */
  stepTimes: Record<string, number>
  startedAt: number
  visitedSteps: string[]
  finalStepId: string
  autoAdvance: boolean
}

function buildMatrixRows(
  question: MatrixQuestion,
  answers: Answers,
): MatrixRowAnswer[] | undefined {
  const value = answers[question.id] as MatrixAnswer | undefined
  if (!value || typeof value !== 'object') return undefined

  return question.items
    .filter((item) => typeof value[item.id] === 'number')
    .map((item) => {
      const rating = value[item.id]
      const scalePoint = question.scale.find((point) => point.value === rating)
      return {
        itemId: item.id,
        label: item.label,
        value: rating,
        valueLabel: scalePoint?.label ?? String(rating),
      }
    })
}

export function buildSubmissionPayload(input: BuildPayloadInput): SurveySubmissionPayload {
  const answers: SubmittedAnswer[] = []
  const stepOf = new Map<string, string>()

  for (const step of survey.steps) {
    for (const question of visibleQuestionsOf(step, input.answers)) {
      stepOf.set(question.id, step.id)
    }
  }

  for (const step of survey.steps) {
    const questions = visibleQuestionsOf(step, input.answers)
    if (questions.length === 0) continue
    const stepTime = input.stepTimes[step.id] ?? 0
    const share = Math.round(stepTime / questions.length)

    for (const question of questions) {
      const summary = summariseAnswer(question, input.answers)
      answers.push({
        questionId: question.id,
        questionCode: question.code,
        questionTitle: question.title,
        questionTitleCn: question.titleCn,
        questionType: question.kind,
        sectionId: question.sectionId,
        sectionTitle: getSection(question.sectionId).title,
        required: question.required,
        answered: summary.answered && rawAnswer(question, input.answers) !== null,
        answer: rawAnswer(question, input.answers),
        answerLabel: summary.zh,
        answerLabelEn: summary.en || summary.zh,
        answerDetail: summary.detail,
        rows: question.kind === 'matrix' ? buildMatrixRows(question, input.answers) : undefined,
        timeSpentMs: share,
      })
    }
  }

  const submittedAt = new Date()
  const answeredCount = answers.filter((entry) => entry.answered).length

  return {
    surveyId: survey.id,
    surveyVersion: survey.version,
    submissionId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(input.startedAt).toISOString(),
    submittedAt: submittedAt.toISOString(),
    durationMs: Math.max(0, submittedAt.getTime() - input.startedAt),
    device: detectDevice(),
    answers,
    meta: {
      totalSteps: survey.steps.length,
      totalQuestions: answers.length,
      answeredQuestions: answeredCount,
      completionRate: answers.length ? Math.round((answeredCount / answers.length) * 100) / 100 : 0,
      visitedSteps: input.visitedSteps,
      finalStepId: input.finalStepId,
      autoAdvance: input.autoAdvance,
      uiLanguage: typeof navigator === 'undefined' ? 'en' : navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
    },
  }
}

/** Trigger a browser download of the payload (handy for research records). */
export function downloadPayload(payload: SurveySubmissionPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `survey-response-${payload.submissionId.slice(0, 8)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
