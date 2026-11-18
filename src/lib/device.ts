import type { DeviceInfo, DeviceType } from '../services/submitSurvey'

function detectOs(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  if (/windows nt 10|windows nt 11/.test(ua)) return 'Windows'
  if (/windows/.test(ua)) return 'Windows'
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS'
  if (/android/.test(ua)) return 'Android'
  if (/mac os x|macintosh/.test(ua)) return 'macOS'
  if (/cros/.test(ua)) return 'ChromeOS'
  if (/linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent
  if (/edg\//i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/firefox\/|fxios/i.test(ua)) return 'Firefox'
  if (/chrome\/|crios/i.test(ua)) return 'Chrome'
  if (/safari\//i.test(ua)) return 'Safari'
  return 'Unknown'
}

function detectType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  const ua = navigator.userAgent
  const isIpad = /ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
  const isTablet = isIpad || (/android/i.test(ua) && !/mobile/i.test(ua))
  const isPhone = /iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)

  if (isTablet || (!isPhone && width >= 640 && width < 1024 && navigator.maxTouchPoints > 0)) {
    return 'tablet'
  }
  if (isPhone || width < 640) return 'mobile'
  return 'desktop'
}

export function detectDevice(): DeviceInfo {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  return {
    type: detectType(),
    os: detectOs(userAgent),
    browser: detectBrowser(userAgent),
    userAgent,
    language: typeof navigator === 'undefined' ? 'en' : navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: {
      width: typeof window === 'undefined' ? 0 : window.innerWidth,
      height: typeof window === 'undefined' ? 0 : window.innerHeight,
    },
    screen: {
      width: typeof window === 'undefined' ? 0 : window.screen.width,
      height: typeof window === 'undefined' ? 0 : window.screen.height,
    },
    pixelRatio: typeof window === 'undefined' ? 1 : Math.round(window.devicePixelRatio * 100) / 100,
    touch: typeof navigator === 'undefined' ? false : navigator.maxTouchPoints > 0,
  }
}
