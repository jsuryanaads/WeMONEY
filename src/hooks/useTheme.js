import { useEffect, useState } from 'react'

const KEY = 'wemoney-theme'

export function getInitialTheme() {
  const saved = localStorage.getItem(KEY)
  if (saved === 'dark' || saved === 'light') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.body.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)
  useEffect(() => { applyTheme(theme); localStorage.setItem(KEY, theme) }, [theme])
  const setTheme = value => setThemeState(value === 'dark' ? 'dark' : 'light')
  return { theme, setTheme }
}
