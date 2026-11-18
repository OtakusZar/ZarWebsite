/**
 * Full-bleed atmospheric backdrop: warm paper, a faint engineering grid and
 * two slow "aurora" washes. Purely decorative, fixed behind everything.
 */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-paper" />

      {/* soft colour washes — 不加 filter: blur，径向渐变本身已经足够柔和，
          在手机上给几百像素的大图层加滤镜会拖慢每一次重绘 */}
      <div className="absolute -left-[18%] -top-[26%] h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(58,99,242,0.20),rgba(58,99,242,0)_62%)] animate-aurora-a" />
      <div className="absolute -right-[16%] top-[6%] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(176,144,95,0.22),rgba(176,144,95,0)_62%)] animate-aurora-b" />
      <div className="absolute -bottom-[28%] left-[24%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(146,180,255,0.20),rgba(146,180,255,0)_65%)] animate-aurora-a [animation-delay:-6s]" />

      {/* texture */}
      <div className="absolute inset-0 paper-grid opacity-80" />

      {/* light falloff to keep text contrast high */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(250,248,244,0.55),rgba(250,248,244,0.1)_38%,rgba(250,248,244,0.72))]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/50 to-transparent" />
    </div>
  )
}
