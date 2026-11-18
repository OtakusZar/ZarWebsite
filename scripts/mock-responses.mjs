#!/usr/bin/env node
/**
 * 模拟问卷数据生成器（可复现）
 * ---------------------------------------------------------------
 * 为什么要有它：
 *   统计工具是否正确，前提是「输入已知、分布已知」。
 *   这个脚本用固定随机种子生成一批符合真实问卷结构的数据，
 *   同时输出一份 expected-stats.json 作为「标准答案」，
 *   你用它对照统计工具的结果即可验证。
 *
 * 用法：
 *   node scripts/mock-responses.mjs                       # 生成 40 份，只写文件
 *   node scripts/mock-responses.mjs --count 60 --seed 7   # 指定数量与种子
 *   node scripts/mock-responses.mjs --post                # 同时 POST 到 .env 里的后端
 *   node scripts/mock-responses.mjs --post --count 120
 *
 * 参数：
 *   --count N     生成条数（默认 40）
 *   --seed S      随机种子（默认 42）——同一个种子永远得到同一批数据
 *   --post        逐条 POST 到 VITE_SURVEY_ENDPOINT（会跳过已存在的 id）
 *   --url URL     覆盖后端地址
 *   --delay ms    每条请求间隔（默认 120ms）
 *   --out DIR     输出目录（默认 mock-data/）
 *   --quiet       只输出结果摘要
 *
 * 输出：
 *   mock-data/responses-<seed>.json   完整 payload 数组（与前端提交格式完全一致）
 *   mock-data/expected-stats-<seed>.json  标准统计结果
 *
 * 数据特征（便于验证统计工具）：
 *   · 「AI 使用强度」越高 → Q5 使用频率越高、Q2 认为 AI 能独立完成的比例越高
 *   · 「适应力」越高 → Q10 二十四项得分越高
 *   · 「对替代的担忧」越高 → Q8/Q9 越倾向于限制使用、隐瞒使用
 *   · 提交时间分布在最近 7 天，可用于验证按日期分组
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/* ------------------------------------------------------------------ *
 * 参数
 * ------------------------------------------------------------------ */
const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

const COUNT = Number(arg('count', 40))
const SEED = Number(arg('seed', 42))
const DELAY = Number(arg('delay', 120))
const OUT_DIR = path.resolve(process.cwd(), arg('out', 'mock-data'))
const QUIET = has('quiet')
const log = (...a) => {
  if (!QUIET) console.log(...a)
}

/* ------------------------------------------------------------------ *
 * 读取应用真实的问卷结构（保证字段与生产环境完全一致）
 * ------------------------------------------------------------------ */
async function loadModule(tsPath) {
  // Node ≥ 23 可以直接 import .ts；更老的版本用 esbuild 现场打包
  try {
    return await import(pathToFileURL(tsPath).href)
  } catch (error) {
    const esbuild = await import('esbuild').catch(() => null)
    if (!esbuild) {
      throw new Error(
        `无法加载 ${tsPath}：当前 Node ${process.version} 不支持直接运行 TypeScript，\n` +
          `也没有找到 esbuild。请升级到 Node 23+ ，或执行 npm i -D esbuild 后重试。\n原始错误：${error.message}`,
      )
    }
    const outfile = path.join(os.tmpdir(), `mock-${path.basename(tsPath)}.${Date.now()}.mjs`)
    await esbuild.build({
      entryPoints: [tsPath],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile,
      logLevel: 'silent',
    })
    return await import(pathToFileURL(outfile).href)
  }
}

const surveyModule = await loadModule(path.resolve('src/data/survey.ts'))
const answersModule = await loadModule(path.resolve('src/lib/answers.ts'))
const survey = surveyModule.survey
const { summariseAnswer, rawAnswer } = answersModule
const { visibleQuestionsOf, getSection } = surveyModule

/* ------------------------------------------------------------------ *
 * 随机数与分布工具（mulberry32，跨平台可复现）
 * ------------------------------------------------------------------ */
function makeRng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = makeRng(SEED)
const rand = () => rng()
const between = (min, max) => min + rand() * (max - min)
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

function gauss(mean = 0, sd = 1) {
  const u = Math.max(rand(), 1e-9)
  const v = Math.max(rand(), 1e-9)
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function pick(list) {
  return list[Math.floor(rand() * list.length)]
}

/** 按权重挑一个值：entries = [[value, weight], …] */
function weighted(entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let threshold = rand() * total
  for (const [value, weight] of entries) {
    threshold -= weight
    if (threshold <= 0) return value
  }
  return entries[entries.length - 1][0]
}

/** 1–5 的李克特打分：把连续的潜在值四舍五入并夹到范围内 */
function likert(value) {
  return clamp(Math.round(value), 1, 5)
}

/* ------------------------------------------------------------------ *
 * 受访者潜在特质
 * ------------------------------------------------------------------ */
function makeRespondent(index) {
  // 三个潜在维度，其它题目都由它们推导，从而产生真实的相关性
  const aiUse = clamp(gauss(0.5, 0.22), 0.02, 0.98) // AI 使用强度
  const adaptability = clamp(gauss(0.52, 0.2), 0.02, 0.98) // 职业适应力
  const anxiety = clamp(gauss(0.45, 0.22), 0.02, 0.98) // 对替代的担忧

  const years = rand() < 0.42 ? '0-3' : '4+'
  const role = weighted([
    ['modelling', 30],
    ['texturing', 19],
    ['rigging', 11],
    ['lighting', 9],
    ['concept', 13],
    ['other', 8],
  ])
  const situation = weighted([
    ['studio', 52],
    ['freelance', 22],
    ['studying', 17],
    ['other', 6],
  ])
  const city = pick([
    '上海',
    '北京',
    '深圳',
    '杭州',
    '成都',
    '广州',
    '武汉',
    '南京',
    '西安',
    '苏州',
    '厦门',
    '长沙',
  ])

  return { index, aiUse, adaptability, anxiety, years, role, situation, city }
}

/* ------------------------------------------------------------------ *
 * 逐题作答
 * ------------------------------------------------------------------ */
/** Q2：十二项任务，AI 目前能到什么程度（1 独立 / 2 辅助 / 3 无法） */
const TASK_BASE = {
  t01: 0.28, // 搭建模型大体块
  t02: 0.44, // 制作贴图
  t03: 0.08, // 角色绑定
  t04: 0.2, // 布置灯光
  t05: 0.12, // 拓扑重建
  t06: 0.55, // 初版概念草图
  t07: 0.62, // 生成变体
  t08: 0.3, // 根据反馈修改
  t09: 0.14, // 判断是否符合需求
  t10: 0.03, // 跨部门排期
  t11: 0.1, // 估算工时
  t12: 0.02, // 对最终质量负责
}

function capabilityRating(taskId, r) {
  const base = TASK_BASE[taskId] ?? 0.2
  const pAlone = clamp(base * (0.65 + 0.75 * r.aiUse), 0.02, 0.92)
  const pCannot = clamp((1 - base) * (0.62 - 0.42 * r.aiUse), 0.02, 0.95)
  const roll = rand()
  if (roll < pAlone) return 1
  if (roll < pAlone + pCannot) return 3
  return 2
}

/** Q10：CAAS 四个维度各自的基准分 */
const CAAS_BASE = { concern: 3.42, control: 3.71, curiosity: 3.55, confidence: 3.5 }

function generateAnswers(r) {
  const answers = {}

  /* ---------- Section A ---------- */
  answers.Q1a = r.years
  answers.Q1b = r.role
  if (r.role === 'other') {
    answers.Q1b_other = pick(['技术美术', '场景美术', '特效', '美术指导', '工具开发'])
  }
  answers.Q1c = r.situation
  if (r.situation === 'other') {
    answers.Q1c_other = pick(['项目间隙', '独立开发', '教学', '转行中'])
  }
  answers.Q1d = r.city

  /* ---------- Section B ---------- */
  const q2 = {}
  for (const item of survey.questions.Q2.items) {
    q2[item.id] = capabilityRating(item.id, r)
  }
  answers.Q2 = q2

  // Q3：最重要的任务——倾向于选与自己职能相符的那一项
  const roleTask = {
    modelling: ['t01', 't05'],
    texturing: ['t02'],
    rigging: ['t03'],
    lighting: ['t04'],
    concept: ['t06', 't07'],
    other: ['t08', 't09', 't12'],
  }[r.role] ?? ['t01']
  answers.Q3 = rand() < 0.55 ? pick(roleTask) : pick(survey.questions.Q2.items.map((i) => i.id))

  /* ---------- Section C ---------- */
  const q4Means = {
    a1: 3.5 + 0.85 * r.aiUse,
    a2: 3.3 + 0.7 * r.aiUse,
    a3: 2.9 + 0.6 * r.aiUse,
    a4: 3.1 + 0.75 * r.aiUse,
    a5: 3.4 + 0.95 * r.aiUse,
  }
  const q4 = {}
  for (const [id, mean] of Object.entries(q4Means)) q4[id] = likert(gauss(mean, 0.78))
  answers.Q4 = q4

  answers.Q5 = weighted([
    ['never', 6 + 24 * (1 - r.aiUse)],
    ['rarely', 10 + 18 * (1 - r.aiUse)],
    ['monthly', 12 + 6 * (1 - Math.abs(r.aiUse - 0.5) * 2)],
    ['weekly', 8 + 34 * r.aiUse],
    ['daily', 2 + 40 * Math.max(0, r.aiUse - 0.45)],
  ])

  /* ---------- Section D ---------- */
  answers.Q6 = weighted([
    ['none', 4 + 16 * (1 - r.aiUse)],
    ['a-little', 18 + 6 * (1 - r.aiUse)],
    ['moderate', 20 + 10 * r.aiUse],
    ['a-lot', 4 + 34 * Math.max(0, r.aiUse - 0.35)],
  ])

  const q7 = []
  if (rand() < 0.5 + 0.15 * r.adaptability) q7.push('technical')
  if (rand() < 0.22 + 0.55 * r.aiUse) q7.push('ai-tools')
  if (rand() < 0.25 + 0.5 * r.anxiety) q7.push('irreplaceable')
  if (rand() < 0.35 + 0.2 * r.adaptability) q7.push('domain')
  answers.Q7 = q7.length ? q7 : ['none']

  const q8 = {
    b1: likert(gauss(2.6 + 1.5 * r.anxiety + 0.3 * r.adaptability, 0.8)),
    b2: likert(gauss(2.4 + 1.6 * r.anxiety, 0.85)),
    b3: likert(gauss(2.8 + 1.2 * r.adaptability, 0.85)),
  }
  answers.Q8 = q8

  const concealed = clamp(0.12 + 0.62 * r.anxiety + 0.25 * (1 - r.aiUse), 0.02, 0.95)
  answers.Q9 = rand() < concealed ? 'yes' : 'no'

  /* ---------- Section E：CAAS 24 题 ---------- */
  const caasGroups = { Q10a: 'concern', Q10b: 'control', Q10c: 'curiosity', Q10d: 'confidence' }
  for (const [qid, dimension] of Object.entries(caasGroups)) {
    const question = survey.questions[qid]
    const base = CAAS_BASE[dimension]
    const record = {}
    for (const item of question.items) {
      record[item.id] = likert(gauss(base + 0.85 * (r.adaptability - 0.5) * 2, 0.72))
    }
    answers[qid] = record
  }

  /* ---------- Section F：开放题（约 1/3 留空） ---------- */
  const openAnswers = [
    '判断力和沟通。写进需求文档的东西 AI 都能做，但「这个模型的剪影对不对」需要人来定。',
    '客户沟通与问题界定。AI 能生成，但不知道客户真正想要什么，也不知道什么时候该说「不」。',
    '审美判断与生产取舍。知道什么该省、什么不能省，这来自真实项目的失败经验。',
    '跨部门协调和对最终质量负责。责任无法外包给模型，这是我真正的护城河。',
    '工具链与自动化。与其被替代，不如成为那个把 AI 接入流程的人。',
    '把 AI 当草稿机，把时间投入到美术基础：形体、光影、色彩。',
    '人际网络与行业理解。知道谁会什么、项目怎么落地，比会点按钮重要得多。',
    '持续学习的能力本身。工具每半年换一次，学习方法不会过期。',
  ]
  answers.Q11 = rand() < 0.68 ? pick(openAnswers) : ''

  return answers
}

/* ------------------------------------------------------------------ *
 * 组装 payload（与 src/lib/payload.ts 的结构一一对应）
 * ------------------------------------------------------------------ */
const DEVICES = [
  {
    type: 'desktop',
    os: 'Windows',
    browser: 'Chrome',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1536, height: 864 },
    screen: { width: 1920, height: 1080 },
    pixelRatio: 1.25,
    touch: false,
  },
  {
    type: 'desktop',
    os: 'macOS',
    browser: 'Safari',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    viewport: { width: 1440, height: 900 },
    screen: { width: 1728, height: 1117 },
    pixelRatio: 2,
    touch: false,
  },
  {
    type: 'mobile',
    os: 'iOS',
    browser: 'Safari',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    pixelRatio: 3,
    touch: true,
  },
  {
    type: 'mobile',
    os: 'Android',
    browser: 'Chrome',
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    touch: true,
  },
]

function buildMatrixRows(question, record) {
  if (!record || typeof record !== 'object') return undefined
  return question.items
    .filter((item) => typeof record[item.id] === 'number')
    .map((item) => {
      const rating = record[item.id]
      const point = question.scale.find((p) => p.value === rating)
      return {
        itemId: item.id,
        label: item.label,
        value: rating,
        valueLabel: point?.label ?? String(rating),
      }
    })
}

function buildPayload(r, submissionId, submittedAt) {
  const answers = generateAnswers(r)
  const device = pick(DEVICES)
  const durationMs = Math.round(between(4.2, 13.5) * 60_000)
  const startedAt = new Date(submittedAt.getTime() - durationMs)

  const entries = []
  const stepTimes = {}
  for (const step of survey.steps) {
    const questions = visibleQuestionsOf(step, answers)
    if (questions.length === 0) continue
    const stepMs = Math.round(durationMs / survey.steps.length)
    stepTimes[step.id] = stepMs
    const share = Math.round(stepMs / questions.length)

    for (const question of questions) {
      const summary = summariseAnswer(question, answers)
      entries.push({
        questionId: question.id,
        questionCode: question.code,
        questionTitle: question.title,
        questionTitleCn: question.titleCn,
        questionType: question.kind,
        sectionId: question.sectionId,
        sectionTitle: getSection(question.sectionId).title,
        required: question.required,
        answered: summary.answered && rawAnswer(question, answers) !== null,
        answer: rawAnswer(question, answers),
        answerLabel: summary.zh,
        answerLabelEn: summary.en || summary.zh,
        answerDetail: summary.detail,
        rows: question.kind === 'matrix' ? buildMatrixRows(question, answers[question.id]) : undefined,
        timeSpentMs: share,
      })
    }
  }

  const answeredCount = entries.filter((e) => e.answered).length

  return {
    surveyId: survey.id,
    surveyVersion: survey.version,
    submissionId,
    startedAt: startedAt.toISOString(),
    submittedAt: submittedAt.toISOString(),
    durationMs,
    device: {
      type: device.type,
      os: device.os,
      browser: device.browser,
      userAgent: device.userAgent,
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      viewport: device.viewport,
      screen: device.screen,
      pixelRatio: device.pixelRatio,
      touch: device.touch,
    },
    answers: entries,
    meta: {
      totalSteps: survey.steps.length,
      totalQuestions: entries.length,
      answeredQuestions: answeredCount,
      completionRate: Math.round((answeredCount / entries.length) * 100) / 100,
      visitedSteps: survey.steps.map((s) => s.id),
      finalStepId: 'step-review',
      autoAdvance: rand() < 0.7,
      uiLanguage: 'zh-CN',
      timeZone: 'Asia/Shanghai',
      userAgent: device.userAgent,
    },
  }
}

/* ------------------------------------------------------------------ *
 * 生成
 * ------------------------------------------------------------------ */
function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
}
function stdev(values) {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1))
}
const round2 = (n) => Math.round(n * 100) / 100

const now = Date.now()
const payloads = []
for (let i = 0; i < COUNT; i += 1) {
  const r = makeRespondent(i)
  // 提交时间铺在最近 7 天，便于验证按日期分组
  const dayOffset = Math.floor((i / COUNT) * 7)
  const submittedAt = new Date(
    now - dayOffset * 86_400_000 - Math.round(between(0, 14) * 3_600_000),
  )
  const submissionId = `mock-${SEED}-${String(i + 1).padStart(3, '0')}`
  payloads.push(buildPayload(r, submissionId, submittedAt))
}

/* ------------------------------------------------------------------ *
 * 统计「标准答案」
 * ------------------------------------------------------------------ */
function buildExpectedStats(list) {
  // 规范顺序：按 steps 里的题目出现顺序排序，方便和统计工具的表格对照
  const order = new Map()
  let cursor = 0
  for (const step of survey.steps) {
    for (const id of step.questions) {
      if (!order.has(id)) order.set(id, cursor++)
    }
  }

  const questionMap = new Map()
  for (const payload of list) {
    for (const entry of payload.answers) {
      if (!questionMap.has(entry.questionId)) {
        const definition = survey.questions[entry.questionId]
        questionMap.set(entry.questionId, {
          id: entry.questionId,
          code: entry.questionCode,
          title: entry.questionTitleCn ?? entry.questionTitle,
          type: entry.questionType,
          section: entry.sectionId,
          group: definition?.kind === 'matrix' ? definition.groupLabelCn : undefined,
          answered: 0,
          entries: [],
        })
      }
      const bucket = questionMap.get(entry.questionId)
      if (entry.answered) bucket.answered += 1
      bucket.entries.push(entry)
    }
  }

  const questions = []
  for (const bucket of [...questionMap.values()].sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  )) {
    const base = {
      id: bucket.id,
      code: bucket.code,
      title: bucket.title,
      type: bucket.type,
      section: bucket.section,
      group: bucket.group,
      answered: bucket.answered,
      total: bucket.entries.length,
    }

    if (bucket.type === 'single') {
      const counts = {}
      for (const entry of bucket.entries) {
        if (!entry.answer) continue
        counts[entry.answer] = (counts[entry.answer] ?? 0) + 1
      }
      questions.push({ ...base, counts, labels: Object.fromEntries(bucket.entries.map((e) => [e.answer, e.answerLabel])) })
    } else if (bucket.type === 'multi') {
      const counts = {}
      for (const entry of bucket.entries) {
        for (const id of entry.answer ?? []) counts[id] = (counts[id] ?? 0) + 1
      }
      const optionLabels = Object.fromEntries(
        bucket.entries.flatMap((e) => (e.answer ?? []).map((id, i) => [id, e.answerLabel.split(' · ')[i] ?? id])),
      )
      questions.push({ ...base, counts, labels: optionLabels })
    } else if (bucket.type === 'matrix') {
      const itemMap = new Map()
      for (const entry of bucket.entries) {
        for (const row of entry.rows ?? []) {
          if (!itemMap.has(row.itemId)) {
            itemMap.set(row.itemId, { id: row.itemId, label: row.label, values: [] })
          }
          itemMap.get(row.itemId).values.push(row.value)
        }
      }
      const items = [...itemMap.values()].map((item) => {
        const counts = {}
        for (const v of item.values) counts[v] = (counts[v] ?? 0) + 1
        return {
          id: item.id,
          label: item.label,
          n: item.values.length,
          mean: round2(mean(item.values)),
          sd: round2(stdev(item.values)),
          counts,
        }
      })
      questions.push({ ...base, items })
    } else {
      const texts = bucket.entries.map((e) => e.answer).filter((t) => typeof t === 'string' && t.trim())
      questions.push({
        ...base,
        answeredWithText: texts.length,
        averageLength: round2(mean(texts.map((t) => t.length))),
      })
    }
  }

  const deviceMix = {}
  for (const p of list) deviceMix[p.device.type] = (deviceMix[p.device.type] ?? 0) + 1

  const byDate = {}
  for (const p of list) {
    const day = p.submittedAt.slice(0, 10)
    byDate[day] = (byDate[day] ?? 0) + 1
  }

  return {
    surveyId: survey.id,
    surveyVersion: survey.version,
    seed: SEED,
    count: list.length,
    generatedAt: new Date(now).toISOString(),
    note: '这份文件是生成器算出的「标准答案」，用于和你的统计工具结果对照。',
    respondents: list.length,
    deviceMix,
    durationMs: {
      mean: Math.round(mean(list.map((p) => p.durationMs))),
      min: Math.min(...list.map((p) => p.durationMs)),
      max: Math.max(...list.map((p) => p.durationMs)),
    },
    answeredPerResponse: {
      mean: round2(mean(list.map((p) => p.meta.answeredQuestions))),
      min: Math.min(...list.map((p) => p.meta.answeredQuestions)),
      max: Math.max(...list.map((p) => p.meta.answeredQuestions)),
    },
    submissionsByDate: byDate,
    questions,
  }
}

const expected = buildExpectedStats(payloads)

/* ------------------------------------------------------------------ *
 * 写文件
 * ------------------------------------------------------------------ */
fs.mkdirSync(OUT_DIR, { recursive: true })
const responsesFile = path.join(OUT_DIR, `responses-${SEED}.json`)
const statsFile = path.join(OUT_DIR, `expected-stats-${SEED}.json`)
fs.writeFileSync(responsesFile, JSON.stringify(payloads, null, 2))
fs.writeFileSync(statsFile, JSON.stringify(expected, null, 2))

log(`已生成 ${COUNT} 份模拟回答（seed=${SEED}）`)
log(`  数据：${path.relative(process.cwd(), responsesFile)}`)
log(`  标准答案：${path.relative(process.cwd(), statsFile)}`)
log('')
log('分布概览：')
for (const q of expected.questions) {
  const name = q.group ? `${q.code}·${q.group}` : q.code
  if (q.type === 'single') {
    const parts = Object.entries(q.counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}=${v}`)
    log(`  ${name.padEnd(8)} ${q.title.slice(0, 16)}  ${parts.join('  ')}`)
  } else if (q.type === 'matrix') {
    const avg = q.items.reduce((s, i) => s + i.mean, 0) / (q.items.length || 1)
    log(`  ${name.padEnd(8)} ${q.title.slice(0, 16)}  平均 ${round2(avg)}（${q.items.length} 项）`)
  } else if (q.type === 'multi') {
    log(`  ${name.padEnd(8)} ${q.title.slice(0, 16)}  ${JSON.stringify(q.counts)}`)
  } else {
    log(`  ${name.padEnd(8)} ${q.title.slice(0, 16)}  ${q.answeredWithText}/${q.total} 有文字`)
  }
}

/* ------------------------------------------------------------------ *
 * 可选：POST 到后端
 * ------------------------------------------------------------------ */
if (has('post')) {
  const envFile = path.resolve('.env')
  const env = {}
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i > -1) env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
    }
  }
  const rawUrl = arg('url', env.VITE_SURVEY_ENDPOINT ?? '')
  if (!rawUrl) {
    console.error('\n✗ 没有后端地址：请设置 .env 的 VITE_SURVEY_ENDPOINT 或用 --url 指定。')
    process.exit(1)
  }
  const endpoint = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  log('')
  log(`开始 POST 到 ${endpoint} …`)
  let ok = 0
  let failed = 0
  for (const [index, payload] of payloads.entries()) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const text = await res.text()
      if (res.ok) {
        ok += 1
        if (!QUIET && (index + 1) % 10 === 0) log(`  ${index + 1}/${payloads.length} …`)
      } else {
        failed += 1
        console.error(`  ✗ ${payload.submissionId}: HTTP ${res.status} ${text.slice(0, 120)}`)
      }
    } catch (error) {
      failed += 1
      console.error(`  ✗ ${payload.submissionId}: ${error.message}`)
    }
    if (DELAY > 0) await new Promise((r) => setTimeout(r, DELAY))
  }
  log(`POST 完成：成功 ${ok} 条，失败 ${failed} 条`)
  if (failed > 0) process.exit(1)
}
