import { motion } from 'framer-motion'
import { ArrowRight, Clock, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { sections, survey, stepCount } from '../data/survey'
import { itemFadeUp, staggerParent } from '../lib/motion'

interface WelcomeScreenProps {
  onStart: () => void
}

const contentSections = sections.filter((section) => section.id !== 'review')

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col justify-center px-5 py-14 pb-[max(3.5rem,env(safe-area-inset-bottom))] sm:px-8">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="mx-auto w-full max-w-[720px]"
      >
        <motion.div variants={itemFadeUp} className="mb-7 flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200/70 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-ink-600 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            研究问卷 · 2026
          </span>
          <span className="text-[11px] text-ink-400">匿名填写 · Anonymous</span>
        </motion.div>

        <motion.h1
          variants={itemFadeUp}
          className="break-keep text-[28px] font-semibold leading-[1.28] tracking-[-0.01em] text-ink-950 sm:text-[44px] sm:leading-[1.16]"
        >
          生成式 AI 与游戏 / 3D 美术的工作
        </motion.h1>

        <motion.p
          variants={itemFadeUp}
          className="mt-3 font-display text-[15px] italic leading-snug text-ink-400 sm:text-[18px]"
        >
          Generative AI and the work of game &amp; 3D artists
        </motion.p>

        <motion.div
          variants={itemFadeUp}
          className="mt-6 max-w-[600px] space-y-1.5 border-l-2 border-ink-200/70 pl-4"
        >
          <p className="pretty text-[13.5px] leading-relaxed text-ink-600 sm:text-[14px]">
            {survey.introCn}
          </p>
          <p className="pretty text-[11.5px] leading-relaxed text-ink-400">{survey.intro}</p>
        </motion.div>

        <motion.div variants={itemFadeUp} className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
            <Clock className="h-3.5 w-3.5 text-ink-300" />约 {survey.estimatedMinutes} 分钟
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
            <Layers className="h-3.5 w-3.5 text-ink-300" />
            {contentSections.length} 个章节 · {stepCount} 个步骤
          </span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-500">
            <ShieldCheck className="h-3.5 w-3.5 text-ink-300" />
            无需姓名与邮箱
          </span>
        </motion.div>

        <motion.div variants={itemFadeUp} className="mt-9 flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.985 }}
            className="group flex h-14 items-center gap-3 rounded-2xl bg-ink-950 pl-6 pr-5 text-[14.5px] font-medium text-white shadow-[0_20px_44px_-20px_rgba(15,18,25,0.95)]"
          >
            <span className="flex items-baseline gap-2">
              开始填写
              <span className="text-[10.5px] font-normal text-white/45">Start</span>
            </span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </motion.button>
          <p className="text-[11.5px] leading-relaxed text-ink-400">
            答题进度会实时保存在本机，
            <br className="hidden sm:block" />
            关闭页面后也能接着填。
          </p>
        </motion.div>

        {/* 目录 */}
        <motion.div variants={itemFadeUp} className="mt-12">
          <p className="mb-3 flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.08em] text-ink-300">
            <Sparkles className="h-3 w-3" />
            问卷包含
            <span className="font-normal text-ink-300/80">What we will cover</span>
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {contentSections.map((section) => (
              <div
                key={section.id}
                className="flex items-start gap-2.5 rounded-xl border border-ink-100/70 bg-white/45 px-3 py-2.5 transition-colors hover:border-ink-200/80 hover:bg-white/70"
              >
                <span className="mt-[1px] grid h-5 w-5 shrink-0 place-items-center rounded-md bg-ink-900/90 font-mono text-[10px] font-semibold text-white">
                  {section.letter}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium leading-tight text-ink-700">
                    {section.titleCn}
                  </p>
                  <p className="truncate text-[10px] leading-tight text-ink-400">{section.title}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p variants={itemFadeUp} className="mt-8 text-[11px] leading-relaxed text-ink-300">
          问卷没有标准答案，我们关心的是你的真实判断。随时可以用「上一题」返回修改。
        </motion.p>
      </motion.div>
    </div>
  )
}
