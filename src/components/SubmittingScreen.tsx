import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { popIn } from '../lib/motion'

const stages = [
  { zh: '收集答案', en: 'Collecting answers' },
  { zh: '整理数据格式', en: 'Formatting the response' },
  { zh: '安全发送', en: 'Sending it securely' },
]

export function SubmittingScreen() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setStage(1), 420),
      window.setTimeout(() => setStage(2), 860),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <motion.div
        variants={popIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white/85 p-8 text-center shadow-card backdrop-blur-xl"
      >
        <div className="relative mx-auto mb-6 grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 rounded-full bg-accent-100/70" />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-accent-200 border-t-accent-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
          <Sparkles className="h-5 w-5 text-accent-600" />
        </div>

        <h2 className="text-[19px] font-semibold tracking-tight text-ink-900">
          正在提交你的回答…
        </h2>
        <p className="mt-1.5 text-[12px] text-ink-400">Sending your responses…</p>

        <div className="mt-7 space-y-2.5 text-left">
          {stages.map((item, index) => (
            <div key={item.zh} className="flex items-center gap-2.5">
              <span
                className={
                  index <= stage
                    ? 'h-1.5 w-1.5 rounded-full bg-accent-500'
                    : 'h-1.5 w-1.5 rounded-full bg-ink-200'
                }
              />
              <span
                className={
                  index <= stage
                    ? 'text-[12px] font-medium text-ink-700'
                    : 'text-[12px] text-ink-300'
                }
              >
                {item.zh}
              </span>
              <span className="text-[10px] text-ink-300">{item.en}</span>
              {index === stage ? (
                <span className="ml-auto h-[3px] w-16 overflow-hidden rounded-full bg-ink-100">
                  <span className="block h-full w-1/2 animate-shimmer rounded-full bg-accent-400/80" />
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-7 text-[10px] tracking-[0.06em] text-ink-300">
          请保持此页面打开 · Please keep this tab open
        </p>
      </motion.div>
    </div>
  )
}
