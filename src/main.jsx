import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App'
import { AuthProvider } from './hooks/useAuth'
import './styles/index.css'
import './styles/wemoney-v2.css'
import { applyTheme, getInitialTheme } from './hooks/useTheme'

applyTheme(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
