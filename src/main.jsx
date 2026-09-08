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

const favicon = document.querySelector('link[rel="icon"]')
if (favicon) {
  favicon.type = 'image/png'
  favicon.href = appIcon
}

document.querySelector('link[rel="manifest"]')?.remove()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
