import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, CreditCard, ClipboardCheck, BarChart3, MessageSquare, LogOut, GraduationCap } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/students', icon: Users, label: "O'quvchilar" },
  { to: '/groups', icon: BookOpen, label: 'Guruhlar' },
  { to: '/payments', icon: CreditCard, label: "To'lovlar" },
  { to: '/attendance', icon: ClipboardCheck, label: 'Davomat' },
  { to: '/reports', icon: BarChart3, label: 'Hisobotlar' },
  { to: '/sms', icon: MessageSquare, label: 'SMS' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Tizimdan chiqdingiz')
    navigate('/login')
  }

  const roleLabel = { super_admin:'Super Admin', admin:'Admin', teacher:"O'qituvchi", student:"O'quvchi" }[user?.role] || ''

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f9fafb', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width:'220px', minWidth:'220px', background:'#fff', borderRight:'1px solid #f0f0f0', display:'flex', flexDirection:'column' }}>
        {/* Logo */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', background:'#1D9E75', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize:'14px', fontWeight:'600', color:'#111827' }}>EduCRM Pro</div>
              <div style={{ fontSize:'11px', color:'#9ca3af' }}>O'quv markaz</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:'2px' }}>
          <div style={{ fontSize:'10px', color:'#9ca3af', padding:'6px 10px 4px', textTransform:'uppercase', letterSpacing:'0.08em' }}>Asosiy</div>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px',
              borderRadius:'8px', fontSize:'13px', textDecoration:'none', transition:'all .15s',
              fontWeight: isActive ? '500' : '400',
              background: isActive ? '#e1f5ee' : 'transparent',
              color: isActive ? '#0f6e56' : '#4b5563',
            })}>
              <Icon size={16} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ borderTop:'1px solid #f0f0f0', padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#e1f5ee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'600', color:'#0f6e56', flexShrink:0 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'12px', fontWeight:'500', color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize:'11px', color:'#9ca3af' }}>{roleLabel}</div>
            </div>
            <button onClick={handleLogout} title="Chiqish" style={{ padding:'6px', border:'none', background:'none', cursor:'pointer', color:'#9ca3af', borderRadius:'6px' }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1, padding:'28px 32px', overflowX:'hidden', minWidth:0 }}>
        <Outlet />
      </main>
    </div>
  )
}
