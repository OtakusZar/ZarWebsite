import type { AnswerValue, QuestionKind, SectionId } from '../types/survey'

/* ------------------------------------------------------------------ *
 * Data contract
 * ------------------------------------------------------------------ *
 * Everything the backend needs travels in a single `SurveySubmissionPayload`.
 * Keep this file framework-free: it must stay usable from any transport
 * (fetch, Supabase, Cloudflare Worker, Web3Forms, …).
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface DeviceInfo {
  type: DeviceType
  os: string
  browser: string
  userAgent: string
  language: string
  timezone: string
  viewport: { width: number; height: number }
  screen: { width: number; height: number }
  pixelRatio: number
  touch: boolean
}

/** One matrix row, flattened so analysts do not have to unpack objects downstream. */
export interface MatrixRowAnswer {
  itemId: string
  label: string
  value: number
  valueLabel: string
}

export interface SubmittedAnswer {
  /** Stable id used by the data model, e.g. "Q4", "Q10a", "Q1b". */
  questionId: string
  /** Display code shown to the respondent, e.g. "Q1 · b". */
  questionCode: string
  questionTitle: string
  questionTitleCn?: string
  questionType: QuestionKind
  sectionId: SectionId
  sectionTitle: string
  required: boolean
  answered: boolean
  /** Raw value: string | string[] | Record<itemId, rating> | string (text). */
  answer: AnswerValue | null
  /** Human-readable rendering in Chinese (primary language of the study). */
  answerLabel: string
  /** Same answer in English, kept for international collaborators. */
  answerLabelEn?: string
  /** Extra context: matrix distribution, option hints, … */
  answerDetail?: string
  /** Matrix answers expanded into rows. */
  rows?: MatrixRowAnswer[]
  /** Milliseconds the respondent spent on the step containing this question. */
  timeSpentMs: number
}

export interface SurveySubmissionPayload {
  surveyId: string
  surveyVersion: string
  /** Generated once per submission attempt; use it as an idempotency key. */
  submissionId: string
  startedAt: string
  submittedAt: string
  durationMs: number
  device: DeviceInfo
  answers: SubmittedAnswer[]
  meta: {
    totalSteps: number
    totalQuestions: number
    answeredQuestions: number
    completionRate: number
    /** Which step ids the respondent actually visited, in order. */
    visitedSteps: string[]
    /** Where the respondent was when they submitted. */
    finalStepId: string
    autoAdvance: boolean
    uiLanguage: string
    timeZone: string
    userAgent: string
  }
}

export interface SubmitSuccess {
  success: true
  submissionId: string
  submittedAt: string
}

export interface SubmitFailure {
  success: false
  error: string
}

export type SubmitResult = SubmitSuccess | SubmitFailure

/* ------------------------------------------------------------------ *
 * Transport
 * ------------------------------------------------------------------ */

/**
 * Optional real endpoint. Set `VITE_SURVEY_ENDPOINT` in a `.env` file to enable
 * it; while it is empty the service runs in simulation mode.
 */
const RAW_ENDPOINT: string = (import.meta.env.VITE_SURVEY_ENDPOINT as string | undefined) ?? ''

/**
 * `.env` 里很容易漏写协议头（写成 `api.example.com`），
 * 那样 fetch 会把它当成相对路径打到当前站点上。这里统一补齐。
 */
export function normaliseEndpoint(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(withScheme).toString()
  } catch {
    return withScheme
  }
}

const ENDPOINT = normaliseEndpoint(RAW_ENDPOINT)

const SIMULATED_LATENCY_MS = 1200

/** Server responses we know how to read; anything else is treated as "ok enough". */
interface ServerReply {
  success?: boolean
  submissionId?: string
  receivedAt?: string
  error?: string
  message?: string
}

export async function submitSurvey(payload: SurveySubmissionPayload): Promise<SubmitResult> {
  /* ================================================================
   * TODO: Replace with actual backend API endpoint
   *       (e.g., Cloudflare Worker / Web3Forms / Supabase)
   * ----------------------------------------------------------------
   * 1. Pick a receiver. Any service that accepts a JSON POST works:
   *      - Cloudflare Worker  → POST https://your-worker.workers.dev/submit
   *      - Web3Forms          → POST https://api.web3forms.com/submit  (add access_key)
   *      - Supabase           → supabase.from('responses').insert(payload)
   * 2. Put the URL in `.env` as VITE_SURVEY_ENDPOINT=https://…
   * 3. Add auth headers below if the receiver needs a key.
   *    (Never hard-code secrets in the bundle — use a server-side proxy.)
   * 4. Delete the simulation block once the request works end to end.
   * ================================================================ */
  if (ENDPOINT) {
    try {
      if (import.meta.env.DEV) {
        console.log('[submitSurvey] POST', ENDPOINT, payload)
      }

      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })

      const rawBody = await response.text()
      let reply: ServerReply = {}
      try {
        reply = rawBody ? (JSON.parse(rawBody) as ServerReply) : {}
      } catch {
        // 非 JSON 响应（例如某些表单服务返回 HTML）时不做解析
      }

      if (!response.ok) {
        return {
          success: false,
          error:
            reply.error ??
            reply.message ??
            `The server responded with ${response.status} ${response.statusText}.`,
        }
      }

      // 后端可能显式返回 success:false（例如校验没通过）
      if (reply.success === false) {
        return { success: false, error: reply.error ?? reply.message ?? 'The server rejected the submission.' }
      }

      if (import.meta.env.DEV) {
        console.log('[submitSurvey] reply', response.status, reply)
      }

      return {
        success: true,
        submissionId: reply.submissionId ?? payload.submissionId,
        submittedAt: reply.receivedAt ?? payload.submittedAt,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed.',
      }
    }
  }

  // ---- Simulation mode -------------------------------------------------
  // Lets the whole front-end flow (loading → thank-you page) be exercised
  // before any backend exists.
  console.groupCollapsed(
    `%c survey submission %c ${payload.submissionId} · ${payload.answers.length} answers · ${(payload.durationMs / 1000).toFixed(1)}s`,
    'background:#3a63f2;color:#fff;border-radius:3px;padding:2px 6px;font-weight:600',
    'color:#3a63f2;font-weight:600',
  )
  console.log(JSON.stringify(payload, null, 2))
  console.groupEnd()

  await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS))

  return {
    success: true,
    submissionId: payload.submissionId,
    submittedAt: payload.submittedAt,
  }
}

/** Absolute URL of the configured endpoint (empty while simulating). */
export const submitEndpoint = ENDPOINT
