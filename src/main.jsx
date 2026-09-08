import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { AuthProvider } from './hooks/useAuth'
import './styles/index.css'
import './styles/typography.css'
import './styles/wemoney-v2.css'
import './styles/accessibility.css'
import './styles/capture-menu.css'
import { applyTheme, getInitialTheme } from './hooks/useTheme'
import appIcon from './assets/branding/wemoney-app-icon.png'

applyTheme(getInitialTheme())

const iconUrl = `${appIcon}?v=1.4.3`
const favicon = document.querySelector('link[rel="icon"]') ?? document.createElement('link')
favicon.rel = 'icon'
favicon.type = 'image/png'
favicon.sizes = '1024x1024'
favicon.href = iconUrl
if (!favicon.parentNode) document.head.appendChild(favicon)

const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') ?? document.createElement('link')
appleIcon.rel = 'apple-touch-icon'
appleIcon.href = iconUrl
if (!appleIcon.parentNode) document.head.appendChild(appleIcon)

document.querySelector('link[rel="manifest"]')?.remove()

document.title = 'We MONEY'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
