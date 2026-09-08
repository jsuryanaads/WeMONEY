import { useEffect, useState } from 'react'
import { getInitialVisualTheme, THEME_KEY, THEME_PRESETS } from '../theme/themeTokens'

const MODE_KEY = 'wemoney-theme-mode'

export function getInitialTheme() {
  const saved = window.localStorage?.getItem(MODE_KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme, visualTheme = getInitialVisualTheme()) {
  const root = document.documentElement
  const preset = THEME_PRESETS[visualTheme] || THEME_PRESETS.default
  root.classList.toggle('dark', theme === 'dark')
  document.body.classList.toggle('dark', theme === 'dark')
  root.dataset.wmTheme = visualTheme
  root.style.colorScheme = theme
  Object.entries(preset.vars).forEach(([key, value]) => root.style.setProperty(`--wm-${key}`, value))
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)
  const [visualTheme, setVisualThemeState] = useState(getInitialVisualTheme)

  useEffect(() => {
    applyTheme(theme, visualTheme)
    window.localStorage?.setItem(MODE_KEY, theme)
    window.localStorage?.setItem(THEME_KEY, visualTheme)
  }, [theme, visualTheme])

  const setTheme = value => setThemeState(value === 'dark' ? 'dark' : 'light')
  const setVisualTheme = value => setVisualThemeState(THEME_PRESETS[value] ? value : 'default')
  return { theme, setTheme, visualTheme, setVisualTheme }
}
