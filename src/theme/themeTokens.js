export const THEME_PRESETS = {
  default: {
    label: 'We MONEY',
    description: 'Modern Fintech',
    vars: {
      primary: '#2563eb', primaryHover: '#1d4ed8', accent: '#60a5fa', background: '#020617', surface: '#0f172a', surface2: '#111c31', text: '#f8fafc', muted: '#94a3b8', border: '#334155', success: '#10b981', expense: '#f43f5e', warning: '#f59e0b', focus: '#3b82f6',
    },
  },
  light: {
    label: 'Light',
    description: 'Terang & bersih',
    vars: {
      primary: '#2563eb', primaryHover: '#1d4ed8', accent: '#3b82f6', background: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', success: '#059669', expense: '#e11d48', warning: '#d97706', focus: '#3b82f6',
    },
  },
}

export const THEME_KEY = 'wemoney-visual-theme'

export function getInitialVisualTheme() {
  // Only the core We MONEY themes are supported. Legacy seasonal values
  // (independence/ramadan) automatically fall back to the default theme.
  const saved = window.localStorage?.getItem(THEME_KEY)
  if (saved && THEME_PRESETS[saved]) return saved
  return 'default'
}
