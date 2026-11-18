import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { popIn } from '../lib/motion'

interface ErrorScreenProps {
  message: string
  onRetry: () => void
  onBack: () => void
}

export function ErrorScreen({ message, onRetry, onBack }: ErrorScreenProps) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <motion.div
        variants={popIn}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/85 p-7 text-center shadow-card backdrop-blur-xl sm:p-9"
      >
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 ring-1 ring-rose-100">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <h2 className="text-[19px] font-semibold tracking-tight text-ink-900">提交没有成功</h2>
        <p className="mt-1.5 text-[12px] text-ink-400">
          We couldn&rsquo;t send your responses.
        </p>
        <p className="mt-2 text-[12.5px] text-ink-500">你的答案仍然安全地保存在本机，可以直接重试。</p>
        <p className="mx-auto mt-4 max-w-xs rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-500">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200/80 bg-white text-[13px] font-medium text-ink-700 transition-colors hover:bg-ink-50/60"
          >
            <ArrowLeft className="h-4 w-4" />
            返回修改
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink-950 text-[13px] font-medium text-white transition-colors hover:bg-ink-800"
          >
            <RefreshCw className="h-4 w-4" />
            重试
          </button>
        </div>
      </motion.div>
    </div>
  )
}
