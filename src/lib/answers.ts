import type {
  Answers,
  AnswerValue,
  MatrixQuestion,
  MatrixAnswer,
  Question,
} from '../types/survey'

export interface ValidationIssue {
  /** Chinese is the primary language of this study. */
  messageCn: string
  /** English kept as a secondary line. */
  message: string
}

export interface AnswerSummary {
  answered: boolean
  /** Chinese rendering — shown first everywhere. */
  zh: string
  /** English rendering — shown as the muted second line. */
  en: string
  /** Extra context, e.g. the distribution of a matrix answer. */
  detail?: string
}

const isMatrixAnswer = (value: unknown): value is MatrixAnswer =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

/** Number of answered rows in a matrix question. */
export function matrixProgress(
  question: MatrixQuestion,
  answers: Answers,
): { answered: number; total: number } {
  const value = answers[question.id]
  const total = question.items.length
  if (!isMatrixAnswer(value)) return { answered: 0, total }
  const answered = question.items.filter((item) => typeof value[item.id] === 'number').length
  return { answered, total }
}

export function isAnswered(question: Question, answers: Answers): boolean {
  const value = answers[question.id]

  switch (question.kind) {
    case 'single':
      return typeof value === 'string' && value.length > 0
    case 'multi':
      return isStringArray(value) && value.length > 0
    case 'matrix': {
      const { answered, total } = matrixProgress(question, answers)
      return answered === total
    }
    case 'text': {
      const text = typeof value === 'string' ? value.trim() : ''
      if (!question.required) return true
      return text.length >= (question.minLength ?? 1)
    }
  }
}

/** Validation for an explicit user attempt (only required questions block). */
export function validateQuestion(question: Question, answers: Answers): ValidationIssue | null {
  if (!question.required) return null
  if (isAnswered(question, answers)) return null

  switch (question.kind) {
    case 'single':
      return {
        messageCn: '请选择一个选项后再继续。',
        message: 'Please choose one option to continue.',
      }
    case 'multi':
      return {
        messageCn:
          question.minSelections && question.minSelections > 1
            ? `请至少选择 ${question.minSelections} 项。`
            : '请至少选择一项。',
        message:
          question.minSelections && question.minSelections > 1
            ? `Please choose at least ${question.minSelections} options.`
            : 'Please choose at least one option.',
      }
    case 'matrix': {
      const { answered, total } = matrixProgress(question, answers)
      const left = total - answered
      return {
        messageCn: answered ? `还有 ${left} 项没有评分。` : `请为全部 ${total} 项评分。`,
        message: answered
          ? `${left} item${left === 1 ? '' : 's'} still ${left === 1 ? 'needs' : 'need'} a rating.`
          : `Please rate all ${total} items.`,
      }
    }
    case 'text': {
      const text = typeof answers[question.id] === 'string' ? (answers[question.id] as string) : ''
      if (!text.trim()) {
        return {
          messageCn: '这一题是必填的，写一个词也可以。',
          message: 'This one is required — a single word is enough.',
        }
      }
      if (text.trim().length < (question.minLength ?? 1)) {
        return { messageCn: '请稍微多写一点。', message: 'A little more detail, please.' }
      }
      return null
    }
  }
}

/** Compact, human-readable answer used by the review step and the payload. */
export function summariseAnswer(question: Question, answers: Answers): AnswerSummary {
  const value = answers[question.id]

  switch (question.kind) {
    case 'single': {
      if (typeof value !== 'string' || !value) {
        return { answered: false, zh: '未填写', en: 'Not answered' }
      }
      const option = question.options.find((entry) => entry.id === value)
      return {
        answered: true,
        zh: option?.labelCn ?? option?.label ?? value,
        en: option?.label ?? value,
      }
    }
    case 'multi': {
      if (!isStringArray(value) || value.length === 0) {
        return { answered: false, zh: '未填写', en: 'Not answered' }
      }
      const picked = value
        .map((id) => question.options.find((option) => option.id === id))
        .filter((option): option is NonNullable<typeof option> => Boolean(option))
      return {
        answered: true,
        zh: picked.map((option) => option.labelCn ?? option.label).join(' · '),
        en: picked.map((option) => option.label).join(' · '),
      }
    }
    case 'matrix': {
      const { answered, total } = matrixProgress(question, answers)
      if (!answered) return { answered: false, zh: '未填写', en: 'Not answered' }
      const counts = new Map<number, number>()
      const record = isMatrixAnswer(value) ? value : {}
      for (const item of question.items) {
        const rating = record[item.id]
        if (typeof rating === 'number') counts.set(rating, (counts.get(rating) ?? 0) + 1)
      }
      const distribution = [...counts.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([rating, count]) => `${rating}×${count}`)
        .join('  ·  ')
      return {
        answered: answered === total,
        zh: `${answered} / ${total} 项已评分`,
        en: `${answered} / ${total} rated`,
        detail: distribution,
      }
    }
    case 'text': {
      const text = typeof value === 'string' ? value.trim() : ''
      if (!text) {
        return {
          answered: !question.required,
          zh: question.required ? '未填写' : '已跳过',
          en: question.required ? 'Not answered' : 'Skipped',
        }
      }
      return { answered: true, zh: text, en: '' }
    }
  }
}

/** Plain value for the payload — preserves the raw answer shape. */
export function rawAnswer(question: Question, answers: Answers): AnswerValue | null {
  const value = answers[question.id]
  if (value === undefined) return null
  if (question.kind === 'matrix' && isMatrixAnswer(value)) {
    // Store as itemId → rating pairs in a stable, ordered shape.
    const ordered: MatrixAnswer = {}
    for (const item of question.items) {
      if (typeof value[item.id] === 'number') ordered[item.id] = value[item.id]
    }
    return ordered
  }
  if (question.kind === 'text' && typeof value === 'string') return value.trim()
  return value
}
