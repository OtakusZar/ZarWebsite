import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Background } from './components/Background'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DraftToast } from './components/DraftToast'
import { ErrorScreen } from './components/ErrorScreen'
import { SubmittingScreen } from './components/SubmittingScreen'
import { SurveyScreen } from './components/SurveyScreen'
import { ThankYouScreen } from './components/ThankYouScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { useSurveyEngine } from './hooks/useSurveyEngine'
import { EASE_OUT } from './lib/motion'

const phaseTransition = { duration: 0.34, ease: EASE_OUT }

export default function App() {
  const engine = useSurveyEngine()
  const [direction, setDirection] = useState(1)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const previousIndex = useRef(engine.index)

  // Forward / backward awareness for the step transition.
  useEffect(() => {
    if (engine.index === previousIndex.current) return
    setDirection(engine.index > previousIndex.current ? 1 : -1)
    previousIndex.current = engine.index
  }, [engine.index])

  // Auto-dismiss the "draft restored" toast.
  useEffect(() => {
    if (!engine.restoredDraft) return
    const timer = window.setTimeout(engine.dismissRestored, 6000)
    return () => window.clearTimeout(timer)
  }, [engine.restoredDraft, engine.dismissRestored])

  const advance = useCallback(() => {
    if (engine.isLastStep) engine.submit()
    else engine.next()
  }, [engine])

  // Global keyboard shortcuts: Enter (continue / start), Escape (back / blur).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const typing =
        tag === 'INPUT' || tag === 'TEXTAREA' || Boolean(target?.isContentEditable)

      if (event.key === 'Escape') {
        if (typing) {
          target?.blur()
          return
        }
        if (engine.phase === 'survey' && !confirmRestart) engine.back()
        return
      }

      if (event.key === 'Enter') {
        // Buttons and links handle Enter themselves.
        if (tag === 'BUTTON' || tag === 'A') return
        // A multi-line answer needs Enter for new lines.
        if (tag === 'TEXTAREA') return

        if (engine.phase === 'welcome') {
          event.preventDefault()
          engine.startFresh()
          return
        }
        if (engine.phase === 'survey' && !confirmRestart) {
          event.preventDefault()
          advance()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [advance, confirmRestart, engine])

  return (
    <div className="relative min-h-[100dvh]">
      <Background />

      <AnimatePresence mode="wait" initial={false}>
        {engine.phase === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={phaseTransition}
          >
            <WelcomeScreen onStart={engine.startFresh} />
          </motion.div>
        ) : null}

        {engine.phase === 'survey' ? (
          <motion.div
            key="survey"
            className="min-h-[100dvh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <SurveyScreen
              engine={engine}
              direction={direction}
              onRequestRestart={() => setConfirmRestart(true)}
            />
          </motion.div>
        ) : null}

        {engine.phase === 'submitting' ? (
          <motion.div
            key="submitting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            transition={{ duration: 0.22 }}
          >
            <SubmittingScreen />
          </motion.div>
        ) : null}

        {engine.phase === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ThankYouScreen payload={engine.payload} onRestart={engine.restart} />
          </motion.div>
        ) : null}

        {engine.phase === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ErrorScreen
              message={engine.submitError ?? 'Unknown error'}
              onRetry={engine.retrySubmit}
              onBack={engine.resumeSurvey}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DraftToast
        open={engine.phase === 'survey' && engine.restoredDraft}
        label={`第 ${engine.index + 1} / ${engine.totalSteps} 步`}
        onDismiss={engine.dismissRestored}
      />

      <ConfirmDialog
        open={confirmRestart}
        title="要重新开始吗？"
        bodyZh="本机已保存的答案会全部清空，这个操作无法撤销。"
        bodyEn="Every answer saved on this device will be cleared. This cannot be undone."
        confirmLabel="重新开始"
        cancelLabel="继续填写"
        onCancel={() => setConfirmRestart(false)}
        onConfirm={() => {
          setConfirmRestart(false)
          engine.restart()
        }}
      />
    </div>
  )
}
