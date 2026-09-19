import { useEffect, useState } from 'react'
import { getInitialVisualTheme, THEME_KEY, THEME_PRESETS } from '../theme/themeTokens'

const MODE_KEY = 'wemoney-theme-mode'

export function getInitialThemeMode() {
  const saved = window.localStorage?.getItem(MODE_KEY)
  if (saved === 'dark' || saved === 'light' || saved === 'system') return saved
  return 'system'
}

export function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getInitialTheme() {
  const mode = getInitialThemeMode()
  return mode === 'system' ? getSystemTheme() : mode
}

export function applyTheme(theme, visualTheme = getInitialVisualTheme()) {
  const root = document.documentElement
  const preset = THEME_PRESETS[visualTheme] || THEME_PRESETS.default
  root.classList.toggle('dark', theme === 'dark')
  document.body.classList.toggle('dark', theme === 'dark')
  root.dataset.wmTheme = visualTheme
  root.style.colorScheme = theme
  const vars = theme === 'light' ? (preset.light || preset.vars) : (preset.dark || preset.vars)\n  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(`--wm-${key}`, value))
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState(getInitialThemeMode)
  const [theme, setThemeState] = useState(() => themeMode === 'system' ? getSystemTheme() : themeMode)
  const [visualTheme, setVisualThemeState] = useState(getInitialVisualTheme)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      if (themeMode === 'system') setThemeState(media?.matches ? 'dark' : 'light')
    }
    syncSystemTheme()
    media?.addEventListener?.('change', syncSystemTheme)
    applyTheme(theme, visualTheme)
    window.localStorage?.setItem(MODE_KEY, themeMode)
    window.localStorage?.setItem(THEME_KEY, visualTheme)
    return () => media?.removeEventListener?.('change', syncSystemTheme)
  }, [themeMode, theme, visualTheme])

  const setTheme = value => {
    const mode = value === 'dark' || value === 'light' || value === 'system' ? value : 'system'
    setThemeModeState(mode)
    setThemeState(mode === 'system' ? getSystemTheme() : mode)
  }
  const setVisualTheme = value => setVisualThemeState(THEME_PRESETS[value] ? value : 'default')
  return { theme, themeMode, setTheme, visualTheme, setVisualTheme }
}
