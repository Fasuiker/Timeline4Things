const UI_PREFS_KEY = 'timeline4things-ui'

export const DISPLAY_SCALE_MIN = 1
export const DISPLAY_SCALE_MAX = 2.5
export const DISPLAY_SCALE_STEP = 0.25
export const DEFAULT_DISPLAY_SCALE = 1.5

export interface UiPreferences {
  displayScale: number
}

export function clampScale(scale: number) {
  const stepped = Math.round(scale / DISPLAY_SCALE_STEP) * DISPLAY_SCALE_STEP
  return Math.min(DISPLAY_SCALE_MAX, Math.max(DISPLAY_SCALE_MIN, stepped))
}

export function loadUiPreferences(): UiPreferences {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY)
    if (!raw) return { displayScale: DEFAULT_DISPLAY_SCALE }
    const parsed = JSON.parse(raw) as Partial<UiPreferences>
    return {
      displayScale: clampScale(parsed.displayScale ?? DEFAULT_DISPLAY_SCALE),
    }
  } catch {
    return { displayScale: DEFAULT_DISPLAY_SCALE }
  }
}

export function saveUiPreferences(prefs: UiPreferences) {
  localStorage.setItem(
    UI_PREFS_KEY,
    JSON.stringify({ displayScale: clampScale(prefs.displayScale) }),
  )
}

export function applyDisplayScale(scale: number) {
  document.documentElement.style.setProperty('--tl-scale', String(clampScale(scale)))
}
