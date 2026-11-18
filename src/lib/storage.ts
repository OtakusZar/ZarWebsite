import type { Answers } from '../types/survey'

const DRAFT_VERSION = 1

export interface SurveyDraft {
  version: number
  surveyId: string
  surveyVersion: string
  answers: Answers
  index: number
  startedAt: number
  updatedAt: number
  stepTimes: Record<string, number>
  visitedSteps: string[]
  autoAdvance: boolean
}

const key = (surveyId: string) => `gai-survey:${surveyId}:draft`

export function loadDraft(surveyId: string): SurveyDraft | null {
  try {
    const raw = localStorage.getItem(key(surveyId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SurveyDraft>
    if (
      parsed.version !== DRAFT_VERSION ||
      parsed.surveyId !== surveyId ||
      typeof parsed.answers !== 'object' ||
      parsed.answers === null
    ) {
      return null
    }
    return {
      version: DRAFT_VERSION,
      surveyId,
      surveyVersion: parsed.surveyVersion ?? '',
      answers: parsed.answers as Answers,
      index: Number.isFinite(parsed.index) ? Number(parsed.index) : 0,
      startedAt: Number(parsed.startedAt) || Date.now(),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
      stepTimes: parsed.stepTimes ?? {},
      visitedSteps: parsed.visitedSteps ?? [],
      autoAdvance: parsed.autoAdvance !== false,
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: Omit<SurveyDraft, 'version' | 'updatedAt'>): void {
  try {
    const payload: SurveyDraft = {
      ...draft,
      version: DRAFT_VERSION,
      updatedAt: Date.now(),
    }
    localStorage.setItem(key(draft.surveyId), JSON.stringify(payload))
  } catch {
    // Storage can be unavailable (private mode, quota). Drafting is best-effort.
  }
}

export function clearDraft(surveyId: string): void {
  try {
    localStorage.removeItem(key(surveyId))
  } catch {
    // ignore
  }
}

/** "moments ago", "12 minutes ago", … for the resume banner. */
export function relativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'moments ago'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
