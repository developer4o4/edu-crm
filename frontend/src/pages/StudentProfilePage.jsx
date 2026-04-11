import { useEffect, useState } from 'react'
import { GraduationCap, Phone, MapPin, BookOpen, CreditCard, ClipboardCheck, LogOut, User } from 'lucide-react'
import { authAPI, studentsAPI } from '../utils/api'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { C, Badge, Spinner } from '../components/ui/UI'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0))

const card = C.card

export default function StudentProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [payments, setPayments] = useState({ payments: [], total_paid: 0 })
  const [attendance, setAttendance] = useState(null)
  const [tab, setTab] = useState('info')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Login qilgan user ga bog'liq Student profilini olish
    authAPI.myStudentProfile()
      .then(r => setStudent(r.data))
      .catch(() => toast.error("Profil yuklanmadi"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!student) return
    if (tab === 'payments') {
      studentsAPI.payments(student.id).then(r => setPayments(r.data))
    }
    if (tab === 'attendance') {
      studentsAPI.attendance(student.id).then(r => setAttendance(r.data))
    }
  }, [tab, student])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Chiqildi')
  }

  const tabSt = active => ({
    padding: '10px 20px', fontSize: '13px', cursor: 'pointer',
    border: 'none', background: 'none', fontFamily: 'inherit',
    fontWeight: active ? '600' : '400',
    color: active ? '#1D9E75' : '#6b7280',
    borderBottom: active ? '2px solid #1D9E75' : '2px solid transparent',
    transition: 'all .15s'
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <Spinner />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf8', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#1D9E75', padding: '0 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={18} color="white" />
            </div>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>EduCRM</span>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '7px 14px', color: 'white', fontSize: '13px', cursor: 'pointer' }}>
            <LogOut size={14} /> Chiqish
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>

        {/* Profile card */}
        <div style={{ ...card, padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#1D9E75', flexShrink: 0 }}>
              {student?.last_name?.[0]}{student?.first_name?.[0]}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>
                {student?.full_name || `${user?.first_name} ${user?.last_name}`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280' }}>
                <Phone size={13} />
                {student?.phone || user?.phone || '—'}
              </div>
              {student?.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                  <MapPin size={13} /> {student.address}
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Badge color="green">Aktiv</Badge>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <BookOpen size={20} color="#1D9E75" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>
              {student?.memberships?.length || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Guruhlar</div>
          </div>
          <div style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <CreditCard size={20} color={(student?.total_debt || 0) > 0 ? '#ef4444' : '#1D9E75'} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '18px', fontWeight: '700', color: (student?.total_debt || 0) > 0 ? '#ef4444' : '#1D9E75' }}>
              {fmt(student?.total_debt || 0)} UZS
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Qarz</div>
          </div>
          <div style={{ ...card, padding: '16px', textAlign: 'center' }}>
            <ClipboardCheck size={20} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#111827' }}>
              {student?.attendance_summary?.rate || 0}%
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Davomat</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', overflowX: 'auto' }}>
            <button style={tabSt(tab === 'info')} onClick={() => setTab('info')}>Guruhlarim</button>
            <button style={tabSt(tab === 'payments')} onClick={() => setTab('payments')}>To'lovlar</button>
            <button style={tabSt(tab === 'attendance')} onClick={() => setTab('attendance')}>Davomat</button>
          </div>

          <div style={{ padding: '20px' }}>

            {/* Guruhlar */}
            {tab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {student?.memberships?.filter(m => m.is_active)?.map(m => (
                  <div key={m.id} style={{ border: '1px solid #e1f5ee', borderRadius: '12px', padding: '16px', background: '#f0fdf8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{m.group_name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{m.course_name}</div>
                      </div>
                      <Badge color="green">Aktiv</Badge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      <div style={{ background: 'white', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>O'qituvchi</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{m.teacher_name || '—'}</div>
                      </div>
                      <div style={{ background: 'white', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Oylik to'lov</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{fmt(m.monthly_fee_discounted)} UZS</div>
                      </div>
                      <div style={{ background: 'white', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Dars vaqti</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{m.schedule?.day_type}</div>
                      </div>
                      <div style={{ background: 'white', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>To'lov sanasi</div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>Har oyning {m.schedule?.payment_day || 1}-si</div>
                      </div>
                    </div>
                    {m.discount_percent > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <Badge color="amber">{m.discount_percent}% chegirma mavjud</Badge>
                      </div>
                    )}
                  </div>
                ))}
                {!student?.memberships?.filter(m => m.is_active)?.length && (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                    <BookOpen size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px' }}>Hali hech qaysi guruhga qo'shilmagansiz</p>
                  </div>
                )}
              </div>
            )}

            {/* To'lovlar */}
            {tab === 'payments' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#e1f5ee', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#0f6e56', marginBottom: '2px' }}>Jami to'langan</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f6e56' }}>{fmt(payments.total_paid)} UZS</div>
                  </div>
                  {(student?.total_debt || 0) > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#dc2626', marginBottom: '2px' }}>Qarz</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{fmt(student.total_debt)} UZS</div>
                    </div>
                  )}
                </div>

                {payments.payments?.map(p => (
                  <div key={p.id} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {p.month ? new Date(p.month).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }) : '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{p.group_name} • {p.payment_type_display}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{fmt(p.amount)} UZS</div>
                      <Badge color={p.status === 'paid' ? 'green' : p.status === 'pending' ? 'amber' : 'red'}>
                        {p.status_display}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!payments.payments?.length && (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                    <CreditCard size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '14px' }}>To'lovlar tarixi yo'q</p>
                  </div>
                )}
              </div>
            )}

            {/* Davomat */}
            {tab === 'attendance' && attendance && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { l: 'Jami dars', v: attendance.summary?.total, c: '#111827' },
                    { l: 'Keldi', v: attendance.summary?.present, c: '#1D9E75' },
                    { l: 'Kelmadi', v: attendance.summary?.absent, c: '#ef4444' },
                    { l: 'Davomat', v: `${attendance.summary?.attendance_rate || 0}%`, c: '#3b82f6' },
                  ].map(item => (
                    <div key={item.l} style={{ ...card, padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: item.c }}>{item.v}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>{item.l}</div>
                    </div>
                  ))}
                </div>

                {attendance.by_group?.map(g => (
                  <div key={g.group} style={{ border: '1px solid #f0f0f0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>{g.group}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <span style={{ color: '#1D9E75' }}>✓ {g.present} keldi</span>
                      <span style={{ color: '#ef4444' }}>✗ {g.absent} kelmadi</span>
                      <span style={{ color: '#f59e0b' }}>~ {g.late} kech</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
                      <div style={{ height: '6px', borderRadius: '3px', background: '#1D9E75', width: `${g.total ? Math.round(g.present / g.total * 100) : 0}%` }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', textAlign: 'right' }}>
                      {g.total ? Math.round(g.present / g.total * 100) : 0}% davomat
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: '#9ca3af' }}>
          EduCRM Pro © 2026
        </div>
      </div>
    </div>
  )
}