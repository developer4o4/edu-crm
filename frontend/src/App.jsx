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
import TeachersPage from './pages/TeachersPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import PaymentsPage from './pages/PaymentsPage'
import AttendancePage from './pages/AttendancePage'
import ReportsPage from './pages/ReportsPage'
import SMSPage from './pages/SMSPage'
import Course from './pages/CoursesPage'

<<<<<<< HEAD
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
=======
import ProtectedRoute from './components/ProtectedRoute'
import RoleRedirect from './components/RoleRedirect'

// (student page bo‘lsa keyin qo‘shasan)
import StudentProfilePage from './pages/StudentProfilePage'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])
>>>>>>> recovery-work

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ duration: 3000, style: { fontSize: '13px', borderRadius: '10px' } }}
      />

      <Routes>

        {/* LOGIN */}
        <Route path="/login" element={<LoginPage />} />

<<<<<<< HEAD
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
=======
        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        {/* ADMIN / MAIN LAYOUT */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
>>>>>>> recovery-work
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentDetailPage />} />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="groups/:id" element={<GroupDetailPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="sms" element={<SMSPage />} />
          <Route path="courses" element={<Course />} />
        </Route>

        {/* DIRECT ADMIN PATHS FOR REFRESH/DIRECT OPEN */}
        <Route
          path="/students"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StudentsPage />} />
          <Route path=":id" element={<StudentDetailPage />} />
        </Route>
        <Route
          path="/groups"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<GroupsPage />} />
          <Route path=":id" element={<GroupDetailPage />} />
        </Route>
        <Route
          path="/teachers"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TeachersPage />} />
        </Route>
        <Route
          path="/payments"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PaymentsPage />} />
        </Route>
        <Route
          path="/attendance"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AttendancePage />} />
        </Route>
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ReportsPage />} />
        </Route>
        <Route
          path="/sms"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SMSPage />} />
        </Route>
        <Route
          path="/courses"
          element={
            <ProtectedRoute roles={['admin', 'super_admin']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Course />} />
        </Route>

        {/* TEACHER */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute roles={['teacher']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
        </Route>

        {/* STUDENT */}
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['student']}>
              <StudentProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 403 */}
        <Route
          path="/403"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1 className="text-xl font-bold">403 - Ruxsat yo‘q</h1>
            </div>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <h1>404 - Page not found</h1>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}