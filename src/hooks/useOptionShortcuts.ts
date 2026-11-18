import { useEffect } from 'react'

/**
 * Number keys 1–9 and letters A–Z select options by position.
 * Only wired up when a step holds a single question, so the mapping is
 * never ambiguous. Typing inside inputs is ignored.
 */
export function useOptionShortcuts(
  enabled: boolean,
  count: number,
  onPick: (index: number) => void,
): void {
  useEffect(() => {
    if (!enabled) return

    const handle = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      let index = -1
      if (/^[1-9]$/.test(event.key)) {
        index = Number(event.key) - 1
      } else if (/^[a-zA-Z]$/.test(event.key)) {
        index = event.key.toUpperCase().charCodeAt(0) - 65
      }

      if (index < 0 || index >= count) return
      event.preventDefault()
      onPick(index)
    }

    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [enabled, count, onPick])
}
