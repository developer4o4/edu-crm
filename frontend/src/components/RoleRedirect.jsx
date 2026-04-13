import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function RoleRedirect() {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'super_admin') {
    return <Navigate to="/admin" replace />
  }

  if (user.role === 'teacher') {
    return <Navigate to="/teacher" replace />
  }

  return <Navigate to="/student" replace />
}