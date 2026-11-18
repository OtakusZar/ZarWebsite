import { useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Download, RotateCcw, Terminal } from 'lucide-react'
import { downloadPayload } from '../lib/payload'
import { itemFadeUp, staggerParent } from '../lib/motion'
import type { SurveySubmissionPayload } from '../services/submitSurvey'

interface ThankYouScreenProps {
  payload: SurveySubmissionPayload | null
  onRestart: () => void
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  if (minutes === 0) return `${seconds} 秒`
  return `${minutes} 分 ${String(seconds).padStart(2, '0')} 秒`
}

export function ThankYouScreen({ payload, onRestart }: ThankYouScreenProps) {
  const [copied, setCopied] = useState(false)
  const answered = payload?.answers.filter((entry) => entry.answered).length ?? 0
  const totalQuestions = payload?.meta.totalQuestions ?? 0
  const submissionId = payload?.submissionId ?? ''

  const copyId = async () => {
    if (!submissionId) return
    try {
      await navigator.clipboard.writeText(submissionId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-12 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg"
      >
        <motion.div
          variants={itemFadeUp}
          className="rounded-[28px] border border-white/70 bg-white/85 p-7 text-center shadow-card backdrop-blur-xl sm:p-9"
        >
          <div className="relative mx-auto grid h-[72px] w-[72px] place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
            <motion.span
              aria-hidden
              initial={{ scale: 0.45, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              className="absolute inset-0 rounded-full bg-emerald-100/60"
            />
            <svg viewBox="0 0 52 52" className="relative h-11 w-11" aria-hidden>
              <circle
                cx="26"
                cy="26"
                r="23"
                fill="none"
                stroke="rgb(16 185 129)"
                strokeOpacity="0.4"
                strokeWidth="1.5"
              />
              <path
                d="M15.5 27.5 L23 35 L37 20.5"
                fill="none"
                stroke="rgb(5 150 105)"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-draw"
                style={{ '--check-len': '31px' } as CSSProperties}
              />
            </svg>
          </div>

          <h1 className="balanced mt-6 text-[26px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink-950 sm:text-[31px]">
            感谢你的参与，回答已记录。
          </h1>
          <p className="mt-2 font-display text-[14px] italic text-ink-400">
            Thank you — your response is in.
          </p>
          <p className="mx-auto mt-4 max-w-sm pretty text-[12.5px] leading-relaxed text-ink-500">
            你的回答将用于分析生成式 AI 如何改变这一行业的工作方式：技能、工时与职业选择。
            <span className="mt-1 block text-[11px] leading-relaxed text-ink-400">
              Your answers help us understand how generative AI is reshaping the craft, the hours and
              the career decisions of game and 3D artists.
            </span>
          </p>

          <div className="mt-7 grid grid-cols-3 gap-2">
            {[
              { label: '已填题数', value: `${answered}`, sub: `共 ${totalQuestions} 项` },
              { label: '用时', value: formatDuration(payload?.durationMs ?? 0), sub: '本次填写' },
              { label: '章节', value: '6', sub: '全部完成' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-ink-100/90 bg-white/70 px-2 py-3"
              >
                <p className="font-mono text-[17px] font-semibold tabular-nums text-ink-900">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10.5px] font-medium text-ink-500">{stat.label}</p>
                <p className="text-[10px] text-ink-300">{stat.sub}</p>
              </div>
            ))}
          </div>

          {submissionId ? (
            <button
              type="button"
              onClick={copyId}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-100 bg-ink-50/50 px-3 py-2 text-[11px] text-ink-400 transition-colors hover:text-ink-600"
              title="复制本次提交的编号"
            >
              <span className="font-mono tracking-tight text-ink-500">
                编号 · {submissionId.slice(0, 8)}
              </span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => payload && downloadPayload(payload)}
              disabled={!payload}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200/80 bg-white text-[13px] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50/50 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              下载我的回答
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-950 text-[13px] font-medium text-white transition-colors hover:bg-ink-800"
            >
              <RotateCcw className="h-4 w-4" />
              重新填写
            </button>
          </div>
        </motion.div>

        <motion.p
          variants={itemFadeUp}
          className="mx-auto mt-5 flex max-w-md items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed text-ink-300"
        >
          <Terminal className="mt-[1px] h-3 w-3 shrink-0" />
          <span>
            试点模式：完整数据已打印在浏览器控制台（F12 → Console），尚未发送到服务器。
            <span className="mt-0.5 block text-[10px]">
              Pilot mode: nothing leaves this device yet.
            </span>
          </span>
        </motion.p>
      </motion.div>
    </div>
  )
}
