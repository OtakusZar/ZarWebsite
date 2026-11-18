/**
 * Domain types for the questionnaire.
 *
 * The UI never hard-codes question content: everything is driven by
 * `src/data/survey.ts`, which is the single source of truth for copy,
 * options, scales and branch logic.
 */

export type SectionId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'review'

export type QuestionKind = 'single' | 'multi' | 'matrix' | 'text'

/** A point on a rating scale (1 = …, 2 = …). */
export interface ScalePoint {
  value: number
  /** Very short English caption for tight UI. */
  short: string
  /** Very short Chinese caption — this is the one shown in matrix cells. */
  shortCn?: string
  /** Full caption used in legends and screen-reader labels. */
  label: string
  labelCn?: string
}

export interface Option {
  id: string
  label: string
  labelCn?: string
  hint?: string
  hintCn?: string
  /** Multi-select only: choosing this clears every other choice. */
  exclusive?: boolean
}

export interface MatrixItem {
  id: string
  label: string
  labelCn?: string
}

/** Answers are intentionally untagged and keyed by question id. */
export type SingleAnswer = string
export type MultiAnswer = string[]
export type MatrixAnswer = Record<string, number>
export type TextAnswer = string
export type AnswerValue = SingleAnswer | MultiAnswer | MatrixAnswer | TextAnswer
export type Answers = Record<string, AnswerValue>

interface BaseQuestion {
  id: string
  /** Human-facing code, e.g. "Q4". */
  code: string
  title: string
  titleCn?: string
  description?: string
  descriptionCn?: string
  required: boolean
  sectionId: SectionId
  /** Hidden when the predicate returns false (conditional branching). */
  visibleWhen?: (answers: Answers) => boolean
}

export interface SingleQuestion extends BaseQuestion {
  kind: 'single'
  options: Option[]
  layout?: 'list' | 'grid'
  /** Advance to the next step shortly after a selection is made. */
  autoAdvance?: boolean
}

export interface MultiQuestion extends BaseQuestion {
  kind: 'multi'
  options: Option[]
  layout?: 'list' | 'grid'
  minSelections?: number
  maxSelections?: number
}

export interface MatrixQuestion extends BaseQuestion {
  kind: 'matrix'
  items: MatrixItem[]
  scale: ScalePoint[]
  /** Optional heading above the rows, e.g. "Concern". */
  groupLabel?: string
  groupLabelCn?: string
}

export interface TextQuestion extends BaseQuestion {
  kind: 'text'
  placeholder?: string
  placeholderCn?: string
  maxLength: number
  minLength?: number
  multiline?: boolean
  /** Shown above the field, e.g. "Optional". */
  note?: string
}

export type Question = SingleQuestion | MultiQuestion | MatrixQuestion | TextQuestion

export interface Section {
  id: SectionId
  /** "A" … "F" */
  letter: string
  title: string
  titleCn: string
  blurb?: string
}

export interface SurveyStep {
  id: string
  sectionId: SectionId
  /** Question ids rendered inside this step's card. */
  questions: string[]
  /** Card heading for grouped steps (falls back to the single question title). */
  title?: string
  titleCn?: string
  description?: string
  descriptionCn?: string
  /** Optional small label above the question, e.g. "Part 2 of 4". */
  eyebrow?: string
  eyebrowCn?: string
}

export interface SurveyDefinition {
  id: string
  version: string
  title: string
  titleCn: string
  intro: string
  introCn: string
  estimatedMinutes: number
  sections: Section[]
  questions: Record<string, Question>
  steps: SurveyStep[]
}
