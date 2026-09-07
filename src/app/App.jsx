import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from './ProtectedRoute'
import Dashboard from '../pages/Dashboard'
import FinancePage from '../pages/FinancePage'
import SettingsPage from '../pages/SettingsPage'
import GuidePage from '../pages/GuidePage'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'

function PublicOnly({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-50 text-sm font-semibold text-slate-500">Memuat WeMoney...</div>
  return session ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
    <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
    <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transaksi" element={<FinancePage section="transaksi" />} />
      <Route path="/kategori" element={<FinancePage section="kategori" />} />
      <Route path="/dompet" element={<FinancePage section="dompet" />} />
      <Route path="/laporan" element={<FinancePage section="laporan" />} />
      <Route path="/pengaturan" element={<SettingsPage />} />
      <Route path="/panduan" element={<GuidePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
}
