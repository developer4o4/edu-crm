import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Clock, CreditCard, Calendar, UserPlus, Search, X } from 'lucide-react'
import { groupsAPI, studentsAPI } from '../utils/api'
import { Btn, Badge, Spinner, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n || 0))
const card = C.card

function AddStudentModal({ groupId, onClose, onAdded }) {
  const [search, setSearch]       = useState('')
  const [results, setResults]     = useState([])
  const [loading, setLoading]     = useState(false)
  const [adding, setAdding]       = useState(null) // student id being added
  const [discount, setDiscount]   = useState(0)
  const [selected, setSelected]   = useState(null)

  // search students not in this group
  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 1) { setResults([]); return }
    setLoading(true)
    try {
      const { data } = await studentsAPI.list({ search: q, page_size: 20, status: 'active' })
      setResults(data.results || data)
    } catch {
      toast.error('Qidirishda xato')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(search), 350)
    return () => clearTimeout(t)
  }, [search, doSearch])

  const add = async (student) => {
    setAdding(student.id)
    try {
      await studentsAPI.addToGroup(student.id, { group_id: groupId, discount_percent: discount })
      toast.success(`${student.full_name} qo'shildi`)
      setResults(prev => prev.filter(s => s.id !== student.id))
      onAdded()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Xato')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          autoFocus
          placeholder="Ism, familiya yoki telefon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#1D9E75'}
          onBlur={e => e.target.style.borderColor = '#e5e7eb'}
        />
        {search && (
          <button onClick={() => { setSearch(''); setResults([]) }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Discount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>Chegirma (%):</label>
        <input
          type="number" min={0} max={100} value={discount}
          onChange={e => setDiscount(Number(e.target.value))}
          style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
        />
      </div>

      {/* Results */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px' }}>
            Qidirilmoqda...
          </div>
        )}

        {!loading && search && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>
            O'quvchi topilmadi
          </div>
        )}

        {!loading && !search && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>
            Qidirish uchun ism yoki telefon yozing
          </div>
        )}

        {results.map(s => {
          const alreadyIn = s.active_groups?.some(g => g.id === groupId)
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #f0f0f0', background: alreadyIn ? '#f9fafb' : '#fff' }}>
              {/* Avatar */}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#0f6e56', flexShrink: 0 }}>
                {s.last_name?.[0]}{s.first_name?.[0]}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{s.full_name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>{s.phone}</div>
                {s.active_groups?.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                    {s.active_groups.map(g => (
                      <span key={g.id} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: g.id === groupId ? '#fee2e2' : '#eff6ff', color: g.id === groupId ? '#dc2626' : '#1d4ed8' }}>
                        {g.name}{g.id === groupId ? ' (Bu guruh)' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Add button */}
              {alreadyIn ? (
                <span style={{ fontSize: '11px', color: '#9ca3af', padding: '5px 10px' }}>Allaqachon bor</span>
              ) : (
                <button
                  onClick={() => add(s)}
                  disabled={adding === s.id}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: adding === s.id ? '#9FE1CB' : '#1D9E75', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: adding === s.id ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                >
                  {adding === s.id ? '...' : "Qo'shish"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Btn onClick={onClose}>Yopish</Btn>
      </div>
    </div>
  )
}

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group,     setGroup]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showAdd,   setShowAdd]   = useState(false)

  const loadGroup = useCallback(() => {
    groupsAPI.detail(id)
      .then(r => setGroup(r.data))
      .catch(() => toast.error('Topilmadi'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadGroup() }, [loadGroup])

  const removeStudent = async (studentId, studentName, groupId) => {
    if (!confirm(`${studentName} guruhdan chiqarilsinmi?`)) return
    try {
      await studentsAPI.removeFromGroup(studentId, { group_id: groupId })
      toast.success('Guruhdan chiqarildi')
      loadGroup()
    } catch (e) {
      toast.error(e.response?.data?.error || 'Xato')
    }
  }

  if (loading) return <Spinner />
  if (!group) return <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>Guruh topilmadi</div>

  const g = group

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Btn sm onClick={() => navigate(-1)}><ArrowLeft size={14} /></Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>{g.name}</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0' }}>{g.course_name}</p>
        </div>
        <Badge color={g.is_active ? 'green' : 'gray'}>{g.is_active ? 'Aktiv' : 'Tugagan'}</Badge>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { icon: Users,     label: "O'quvchilar",   val: `${g.student_count}/${g.max_students}` },
          { icon: CreditCard, label: "Oylik to'lov",  val: `${fmt(g.monthly_fee)} UZS` },
          { icon: Clock,     label: 'Dars vaqti',     val: `${g.start_time?.slice(0,5)}-${g.end_time?.slice(0,5)}` },
          { icon: Calendar,  label: "To'lov sanasi",  val: `Har oyning ${g.payment_day}-si` },
        ].map(item => (
          <div key={item.label} style={{ ...card, padding: '20px' }}>
            <item.icon size={16} color="#9ca3af" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* Students + Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Students list */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', flex: 1 }}>O'quvchilar ro'yxati</div>
            <Badge color="blue">{g.students?.length || 0} ta</Badge>
            <button
              onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
            >
              <UserPlus size={14} /> O'quvchi qo'shish
            </button>
          </div>

          <div style={{ padding: '8px', maxHeight: '480px', overflowY: 'auto' }}>
            {g.students?.map(s => (
              <div key={s.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '2px', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {/* Avatar */}
                <div
                  onClick={() => navigate(`/students/${s.id}`)}
                  style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#e1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: '#0f6e56', flexShrink: 0, cursor: 'pointer' }}
                >
                  {s.full_name?.[0]}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{s.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.phone}</div>
                </div>
                {/* Discount */}
                {s.discount_percent > 0 && <Badge color="amber">{s.discount_percent}%</Badge>}
                {/* Remove */}
                <button
                  onClick={() => removeStudent(s.id, s.full_name, g.id)}
                  style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '11px', fontWeight: '500', cursor: 'pointer', flexShrink: 0 }}
                >
                  Chiqarish
                </button>
              </div>
            ))}
            {!g.students?.length && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', color: '#9ca3af' }}>
                <UserPlus size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Guruhda o'quvchilar yo'q</p>
                <button onClick={() => setShowAdd(true)} style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#1D9E75', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                  O'quvchi qo'shish
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Group info */}
        <div style={{ ...card, padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '16px' }}>Guruh ma'lumotlari</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              ["O'qituvchi",    g.teacher_name || '—'],
              ["Kurs",          g.course_name],
              ["Dars kunlari",  g.day_type],
              ["Xona",          g.room || '—'],
              ["Boshlanish",    g.start_date ? new Date(g.start_date).toLocaleDateString('uz-UZ') : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ paddingBottom: '12px', borderBottom: '1px solid #f9fafb' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '3px' }}>{k}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
              <span>To'lganlik</span>
              <span>{g.student_count}/{g.max_students}</span>
            </div>
            <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '6px', borderRadius: '3px', background: g.is_full ? '#ef4444' : '#1D9E75', width: `${Math.min(100, (g.student_count / g.max_students) * 100)}%`, transition: 'width .3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Add student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`O'quvchi qo'shish — ${g.name}`} size="md">
        <AddStudentModal
          groupId={g.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => { loadGroup() }}
        />
      </Modal>
    </div>
  )
}
