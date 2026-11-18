import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { cn } from '../lib/cn'
import { shakeKeyframes, shakeTransition } from '../lib/motion'

interface CardProps {
  children: ReactNode
  className?: string
  /** Increments whenever the respondent tries to continue with missing answers. */
  errorPulse: number
  /** Pulse the border instead of moving, for users who prefer reduced motion. */
  invalid?: boolean
}

export function Card({ children, className, errorPulse, invalid = false }: CardProps) {
  const controls = useAnimationControls()
  const reduce = useReducedMotion()
  const seenPulse = useRef(errorPulse)

  useEffect(() => {
    if (errorPulse === seenPulse.current) return
    seenPulse.current = errorPulse
    if (reduce) return
    void controls
      .start({ x: shakeKeyframes.x, transition: shakeTransition })
      .then(() => controls.set({ x: 0 }))
  }, [errorPulse, controls, reduce])

  return (
    <motion.section
      animate={controls}
      className={cn(
        'relative overflow-hidden rounded-[26px] border shadow-card sm:rounded-[30px]',
        // 手机上不做实时 backdrop 模糊：大面积模糊会让每次重绘慢一倍以上，
        // 直接表现为「点了半天才亮」。桌面上保留毛玻璃质感。
        'bg-white sm:bg-white/85 sm:backdrop-blur-xl',
        'border-white/70',
        invalid ? 'border-rose-300/80 shadow-[0_0_0_3px_rgba(244,63,94,0.08),0_12px_32px_-12px_rgba(16,18,27,0.14)]' : '',
        className,
      )}
    >
      {/* hairline highlight along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/50 to-transparent"
      />
      {children}
    </motion.section>
  )
}
