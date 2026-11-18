#!/usr/bin/env node
/**
 * 端到端提交测试（真实浏览器 + 真实后端）
 * ---------------------------------------------------------------
 * 它打开问卷、逐题自动作答、点击提交，并抓取那个 POST 请求：
 * 既验证界面流程，也验证后端确实收到了数据。
 *
 * 用法：
 *   1. 另开一个终端跑 `npm run dev`（或 `npm run preview`）
 *   2. node scripts/e2e-submit.mjs
 *   3. 可选参数：
 *        --url http://127.0.0.1:5173   指定被测地址
 *        --headed                       显示浏览器窗口，方便观察
 *        --slow                         慢速播放（每步多等 300ms）
 *        --browser edge|chrome          指定浏览器
 *
 * 需要本机已安装 Edge 或 Chrome（不需要额外下载浏览器）。
 * 退出码 0 = 通过，1 = 失败，便于之后接 CI。
 */

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

/* ----------------------------- 参数 ----------------------------- */
const args = process.argv.slice(2)
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : (args[i + 1] ?? true)
}
const has = (name) => args.includes(`--${name}`)

const targetUrl = String(flag('url', 'http://127.0.0.1:5173'))
const headed = has('headed')
const slow = has('slow')
const pause = (ms = 0) => new Promise((r) => setTimeout(r, ms + (slow ? 300 : 0)))

/* --------------------------- 浏览器路径 --------------------------- */
function findBrowser(preferred) {
  const candidates = {
    edge: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/usr/bin/microsoft-edge',
    ],
    chrome: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium',
    ],
  }
  const fromEnv = [process.env.CHROME_PATH, process.env.EDGE_PATH].filter(Boolean)
  const order = preferred === 'chrome' ? ['chrome', 'edge'] : ['edge', 'chrome']
  const pool = [...fromEnv, ...order.flatMap((k) => candidates[k])]
  return pool.find((p) => p && fs.existsSync(p)) ?? null
}

const executablePath = findBrowser(String(flag('browser', 'edge')))
if (!executablePath) {
  console.error('✗ 没找到 Edge / Chrome。可以设置 CHROME_PATH 环境变量指向浏览器可执行文件。')
  process.exit(1)
}

/* --------------------------- 读取 .env --------------------------- */
function readEnv() {
  const file = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i > -1) out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}
const env = readEnv()
const rawEndpoint = env.VITE_SURVEY_ENDPOINT ?? ''
const endpoint = /^https?:\/\//i.test(rawEndpoint) ? rawEndpoint : rawEndpoint ? `https://${rawEndpoint}` : ''
const endpointHost = endpoint ? new URL(endpoint).host : null

/* ----------------------------- 工具 ----------------------------- */
const log = (...a) => console.log(...a)
let failures = 0
function check(ok, label, detail = '') {
  log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
  return ok
}

/* ----------------------------- 主流程 ----------------------------- */
const browser = await chromium.launch({ executablePath, headless: !headed })
const context = await browser.newContext({
  viewport: { width: 420, height: 900 },
  locale: 'zh-CN',
  deviceScaleFactor: 2,
})
const page = await context.newPage()

const network = { request: null, response: null, failed: null }
page.on('request', (req) => {
  if (req.method() !== 'POST') return
  const url = req.url()
  if (endpointHost ? url.includes(endpointHost) : url.startsWith('http')) {
    network.request = { url, body: req.postData() }
  }
})
page.on('response', async (res) => {
  if (res.request().method() !== 'POST') return
  const url = res.url()
  if (endpointHost ? !url.includes(endpointHost) : !url.startsWith('http')) return
  try {
    network.response = { status: res.status(), body: await res.text() }
  } catch {
    network.response = { status: res.status(), body: '' }
  }
})
page.on('requestfailed', (req) => {
  if (req.method() === 'POST') network.failed = req.failure()?.errorText ?? 'unknown'
})
page.on('pageerror', (err) => log(`  [pageerror] ${err.message}`))
page.on('console', (m) => {
  if (m.type() === 'error') log(`  [console.error] ${m.text().slice(0, 200)}`)
})

log(`被测地址 : ${targetUrl}`)
log(`后端地址 : ${endpoint || '(未配置，走模拟模式)'}`)
log(`浏览器   : ${executablePath}`)
log('')

try {
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  // 封面 → 开始
  await page.getByRole('button', { name: /开始填写/ }).click({ timeout: 20000 })
  await pause(700)
  check(true, '打开问卷并进入第一题')

  // 关闭自动跳转，让脚本完全掌控节奏
  const autoBtn = page.getByRole('button', { name: /自动跳转/ })
  if (await autoBtn.count()) {
    await autoBtn.click()
    await pause(120)
  }

  const card = () => page.locator('main section').first()
  const primary = () => page.locator('footer button').last()

  async function fillCurrentStep() {
    const c = card()

    // 矩阵题：每行点第 2 个刻度
    const matrixRows = c.locator('[role="radiogroup"][aria-label]')
    const rowCount = await matrixRows.count()
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i += 1) {
        const cells = matrixRows.nth(i).locator('[role="radio"]')
        const count = await cells.count()
        await cells.nth(Math.min(1, count - 1)).click({ force: true })
        await pause(40)
      }
      return
    }

    // 普通单选题（可能一组卡片里有多个，例如 Q1 的背景信息）
    const groups = c.locator('[role="radiogroup"]')
    const groupCount = await groups.count()
    for (let i = 0; i < groupCount; i += 1) {
      const radios = groups.nth(i).locator('[role="radio"]')
      if (await radios.count()) {
        await radios.first().click({ force: true })
        await pause(80)
      }
    }

    // 多选题：勾第一项
    const checks = c.locator('[role="checkbox"]')
    if (await checks.count()) {
      await checks.first().click({ force: true })
      await pause(80)
    }

    // 开放题
    const textarea = c.locator('textarea')
    if (await textarea.count()) {
      await textarea.first().fill('自动化测试写入的回答：判断力、客户沟通与生产取舍，是 AI 短期难以替代的部分。')
      await pause(80)
    }

    // 单行输入（所在城市 / 补充说明）
    const inputs = c.locator('input[type="text"]')
    const inputCount = await inputs.count()
    for (let i = 0; i < inputCount; i += 1) {
      await inputs.nth(i).fill('自动化测试城市')
      await pause(60)
    }
  }

  // 逐题推进，直到总览页
  let steps = 0
  for (; steps < 30; steps += 1) {
    const primaryText = (await primary().innerText()).trim()
    if (primaryText.includes('提交问卷')) break
    await fillCurrentStep()
    await primary().click()
    await pause(650)
  }
  check(steps < 30, `答完 ${steps} 个步骤，到达总览页`)

  const reviewText = await card().innerText()
  check(reviewText.includes('核对并提交'), '总览页正常显示')

  // 提交
  await primary().click()
  await page.waitForFunction(
    () => document.body.innerText.includes('感谢你的参与') || document.body.innerText.includes('提交没有成功'),
    { timeout: 25000 },
  )
  const bodyText = await page.locator('body').innerText()

  if (bodyText.includes('提交没有成功')) {
    check(false, '提交失败（界面进入错误页）')
    const err = await page.locator('p.font-mono').first().innerText().catch(() => '')
    log(`  错误信息：${err}`)
  } else {
    check(true, '提交成功，进入感谢页')
  }

  /* --------------------- 校验网络与后端 --------------------- */
  if (!endpoint) {
    log('')
    log('提示：.env 没有配置 VITE_SURVEY_ENDPOINT，本次是模拟模式，未发送网络请求。')
  } else {
    check(Boolean(network.request), '捕获到 POST 请求', network.request?.url ?? '')
    check(network.response?.status === 200, '后端返回 200', `status=${network.response?.status ?? 'n/a'}`)

    let reply = null
    try {
      reply = JSON.parse(network.response?.body ?? 'null')
    } catch {
      /* ignore */
    }
    check(reply?.success === true, '后端返回 success:true', reply ? JSON.stringify(reply) : '无法解析 JSON')
    check(Boolean(reply?.submissionId), '后端返回 submissionId', reply?.submissionId ?? '')

    if (network.request?.body) {
      // 保存一份真实请求体，用于和模拟数据的字段结构做对照
      try {
        fs.mkdirSync('mock-data', { recursive: true })
        fs.writeFileSync('mock-data/last-e2e-submission.json', network.request.body)
        log('  （真实请求体已保存到 mock-data/last-e2e-submission.json）')
      } catch {
        /* 忽略写入失败 */
      }

      try {
        const sent = JSON.parse(network.request.body)
        const answered = sent.answers?.filter((a) => a.answered).length ?? 0
        check(
          Array.isArray(sent.answers) && sent.answers.length > 0,
          '请求体包含 answers 数组',
          `${sent.answers?.length ?? 0} 题，其中 ${answered} 题有答案`,
        )
        check(Boolean(sent.device?.type), '请求体包含 device 元数据', sent.device?.type ?? '')
        check(Boolean(sent.meta?.completionRate !== undefined), '请求体包含 meta 完成率', `${sent.meta?.completionRate}`)
      } catch (error) {
        check(false, '请求体是合法 JSON', error.message)
      }
    }
  }
} catch (error) {
  check(false, '测试过程异常', error.message)
} finally {
  await browser.close()
}

log('')
if (failures === 0) {
  log('结果：全部通过 ✅')
  process.exit(0)
} else {
  log(`结果：${failures} 项失败 ❌`)
  process.exit(1)
}
