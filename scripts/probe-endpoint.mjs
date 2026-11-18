#!/usr/bin/env node
/**
 * 后端连通性 / CORS 探测脚本
 * ---------------------------------------------------------------
 * 用法：
 *   node scripts/probe-endpoint.mjs                  # 读取 .env 里的 VITE_SURVEY_ENDPOINT
 *   node scripts/probe-endpoint.mjs https://api.xxx.com/submit
 *
 * 它依次做三件事：
 *   1. OPTIONS 预检 —— 检查 CORS 头（浏览器跨域提交的前提）
 *   2. POST 一条标记为 probe 的最小 JSON
 *   3. 打印状态码、CORS 头、响应体（截断）
 *
 * 这个脚本不含任何密钥，可以安全提交进仓库。
 */

import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env')
function readEnv(file) {
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    out[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
  }
  return out
}

const env = readEnv(envPath)
const raw = process.argv[2] || env.VITE_SURVEY_ENDPOINT || ''
if (!raw) {
  console.error('没有找到 VITE_SURVEY_ENDPOINT，请写 .env 或把 URL 作为参数传入。')
  process.exit(1)
}

// 与前端一致的归一化：缺协议时补 https://
const endpoint = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

const origin = process.env.PROBE_ORIGIN || 'http://localhost:5173'
const payload = {
  probe: true,
  surveyId: 'endpoint-probe',
  submissionId: `probe-${Date.now()}`,
  answers: [],
  meta: { note: 'connectivity probe from scripts/probe-endpoint.mjs' },
}

const show = (value) => (value ? String(value) : '(空)')
const clip = (text, n = 400) => (text ?? '').replace(/\s+/g, ' ').slice(0, n)

async function attempt(label, run) {
  process.stdout.write(`\n▶ ${label}\n`)
  try {
    await run()
  } catch (error) {
    console.log(`  ✗ 请求失败：${error.message}`)
    if (error.cause) console.log(`    cause: ${error.cause?.code ?? error.cause}`)
  }
}

console.log(`Endpoint : ${endpoint}`)
console.log(`Origin   : ${origin}`)

await attempt('OPTIONS 预检 (CORS)', async () => {
  const res = await fetch(endpoint, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })
  console.log(`  status: ${res.status} ${res.statusText}`)
  for (const [key, value] of res.headers) {
    if (key.startsWith('access-control')) console.log(`  ${key}: ${value}`)
  }
  const body = await res.text().catch(() => '')
  if (body) console.log(`  body: ${clip(body)}`)
})

await attempt('POST 探测数据', async () => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Origin: origin },
    body: JSON.stringify(payload),
  })
  console.log(`  status: ${res.status} ${res.statusText}`)
  for (const [key, value] of res.headers) {
    if (key.startsWith('access-control') || key === 'content-type') {
      console.log(`  ${key}: ${value}`)
    }
  }
  const body = await res.text().catch(() => '')
  console.log(`  body: ${clip(body) || '(空)'}`)
})

await attempt('GET（了解根路径行为）', async () => {
  const res = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/json' } })
  console.log(`  status: ${res.status} ${res.statusText}`)
  const body = await res.text().catch(() => '')
  console.log(`  body: ${clip(body, 200) || '(空)'}`)
})

console.log('')
