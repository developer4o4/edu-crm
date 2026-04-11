import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import StudentProfilePage from './pages/StudentProfilePage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailPage from './pages/StudentDetailPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import PaymentsPage from './pages/PaymentsPage'
import AttendancePage from './pages/AttendancePage'
import ReportsPage from './pages/ReportsPage'
import SMSPage from './pages/SMSPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #1D9E75', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Student roli bo'lsa profil sahifasiga yo'naltir
  if (user?.role === 'student') return <Navigate to="/profile" replace />
  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { fontSize: '13px', borderRadius: '10px' } }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* O'quvchi profil sahifasi */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <StudentProfilePage />
          </ProtectedRoute>
        } />

        {/* Admin/Teacher panel */}
        <Route path="/" element={
          <AdminRoute>
            <Layout />
          </AdminRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:id" element={<GroupDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sms" element={<SMSPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}