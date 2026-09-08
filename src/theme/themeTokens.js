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
  independence: {
    label: 'Kemerdekaan 🇮🇩',
    description: 'Edisi Merah Putih',
    vars: {
      primary: '#dc2626', primaryHover: '#b91c1c', accent: '#f87171', background: '#09090b', surface: '#18181b', surface2: '#27272a', text: '#fafafa', muted: '#a1a1aa', border: '#3f3f46', success: '#10b981', expense: '#fb7185', warning: '#f59e0b', focus: '#ef4444',
    },
  },
  ramadan: {
    label: 'Ramadhan 🌙',
    description: 'Navy, emerald & gold',
    vars: {
      primary: '#10b981', primaryHover: '#059669', accent: '#fbbf24', background: '#06121a', surface: '#0b1f2a', surface2: '#123040', text: '#f8fafc', muted: '#9fb5c0', border: '#254653', success: '#34d399', expense: '#fb7185', warning: '#fbbf24', focus: '#10b981',
    },
  },
}

export const THEME_KEY = 'wemoney-visual-theme'

export function getSeasonalTheme(date = new Date()) {
  // Independence is intentionally date-based and conservative: August only.
  if (date.getMonth() === 7) return 'independence'
  return 'default'
}

export function getInitialVisualTheme() {
  const saved = window.localStorage?.getItem(THEME_KEY)
  if (saved && THEME_PRESETS[saved]) return saved
  return getSeasonalTheme()
}
