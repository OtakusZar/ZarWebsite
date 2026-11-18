import { useCallback, useRef, useState } from 'react'

/**
 * 按下即选中 / 按下即反馈。
 *
 * 为什么不用 click：
 *   · 手机上 click 要等浏览器确认「不是双击缩放、不是滑动」才派发；
 *     主线程忙时它会排队，用户这时一开始滑动，浏览器就会丢弃这个 click，
 *     表现就是「点了按钮不亮」。
 *   · 改成 pointerup 立刻上报：手指抬起的那一刻就选中，
 *     之后的滑动再也影响不到这次选择。
 *   · 手指移动超过阈值（默认 10px）视为滑动，取消选择，避免误触。
 *   · 同时返回 pressed 状态：按下就变色，不必等父级状态提交。
 *
 * 键盘（Enter / Space）产生的 click 的 detail 为 0，用 onClick 兜底。
 */
export function usePressSelect(onSelect: () => void, threshold = 10) {
  const handler = useRef(onSelect)
  handler.current = onSelect

  const origin = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const [pressed, setPressed] = useState(false)

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    origin.current = { x: event.clientX, y: event.clientY }
    moved.current = false
    setPressed(true)
  }, [])

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!origin.current) return
      const dx = event.clientX - origin.current.x
      const dy = event.clientY - origin.current.y
      if (Math.hypot(dx, dy) > threshold) {
        // 手指在移动 = 用户想滚动，放弃这次选择
        moved.current = true
        origin.current = null
        setPressed(false)
      }
    },
    [threshold],
  )

  const onPointerUp = useCallback(() => {
    const shouldSelect = origin.current !== null && !moved.current
    origin.current = null
    setPressed(false)
    if (shouldSelect) handler.current()
  }, [])

  const onPointerCancel = useCallback(() => {
    origin.current = null
    moved.current = true
    setPressed(false)
  }, [])

  const onPointerLeave = useCallback(() => {
    // 只有鼠标会离开；触摸移出时由 pointercancel / pointermove 处理
    setPressed(false)
  }, [])

  const onClick = useCallback((event: React.MouseEvent) => {
    // detail === 0 表示由键盘触发（Enter / Space）
    if (event.detail === 0) handler.current()
  }, [])

  return {
    pressed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onClick,
    },
  }
}
