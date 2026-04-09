import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { coursesAPI } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, Inp } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

function CourseForm({ initial, onSubmit, loading }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    duration_months: initial?.duration_months || 3,
    is_active: initial?.is_active ?? true,
  })
  const s = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <form onSubmit={e => { e.preventDefault(); if (!f.name) { toast.error('Nom kiriting'); return } onSubmit(f) }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Inp label="Kurs nomi *" placeholder="Python dasturlash" value={f.name} onChange={e => s('name', e.target.value)} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: '500', color: '#4b5563' }}>Tavsif</label>
        <textarea value={f.description} onChange={e => s('description', e.target.value)} rows={2} placeholder="Kurs haqida..."
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
      </div>
      <Inp label="Davomiyligi (oy)" type="number" min={1} max={60} value={f.duration_months} onChange={e => s('duration_months', Number(e.target.value))} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
        <input type="checkbox" checked={f.is_active} onChange={e => s('is_active', e.target.checked)} style={{ accentColor: '#1D9E75', width: '16px', height: '16px' }} />
        Aktiv kurs
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Btn type="submit" primary disabled={loading}>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</Btn>
      </div>
    </form>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(null)

  const fetch = () => {
    setLoading(true)
    coursesAPI.list({ page_size: 100 })
      .then(r => setCourses(r.data.results || r.data))
      .catch(() => toast.error('Yuklanmadi'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const create = async form => {
    setSaving(true)
    try { await coursesAPI.create(form); toast.success("Kurs qo'shildi"); setShowAdd(false); fetch() }
    catch (e) { toast.error(e.response?.data?.name?.[0] || 'Xato') }
    finally { setSaving(false) }
  }

  const update = async form => {
    setSaving(true)
    try { await coursesAPI.update(showEdit.id, form); toast.success('Yangilandi'); setShowEdit(null); fetch() }
    catch (e) { toast.error(e.response?.data?.name?.[0] || 'Xato') }
    finally { setSaving(false) }
  }

  const del = async (id, name) => {
    if (!confirm(`"${name}" kursini o'chirishni tasdiqlaysizmi?`)) return
    try { await coursesAPI.delete(id); toast.success("O'chirildi"); fetch() }
    catch { toast.error("O'chirishda xato — guruhlar bog'liq bo'lishi mumkin") }
  }

  return (
    <div>
      <PageHeader title="Kurslar" sub={`${courses.length} ta kurs`}
        action={<Btn primary onClick={() => setShowAdd(true)}><Plus size={14} />Yangi kurs</Btn>} />

      {loading ? <Spinner /> : (
        <Card p="0" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Kurs nomi', 'Tavsif', 'Davomiyligi', 'Guruhlar', 'Status', ''].map(h => <Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f9fafb' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e1f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={15} color="#0f6e56" />
                      </div>
                      <span style={{ fontWeight: '500', color: '#111827' }}>{c.name}</span>
                    </div>
                  </Td>
                  <Td style={{ color: '#6b7280', fontSize: '12px', maxWidth: '200px' }}>
                    {c.description || '—'}
                  </Td>
                  <Td><Badge color="blue">{c.duration_months} oy</Badge></Td>
                  <Td><Badge color="gray">{c.groups_count} ta guruh</Badge></Td>
                  <Td><Badge color={c.is_active ? 'green' : 'gray'}>{c.is_active ? 'Aktiv' : 'Nofaol'}</Badge></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setShowEdit(c)} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '6px' }} title="Tahrirlash"><Pencil size={14} /></button>
                      <button onClick={() => del(c.id, c.name)} style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', borderRadius: '6px' }} title="O'chirish"><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </tr>
              ))}
              {!courses.length && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  Kurslar yo'q — "Yangi kurs" tugmasini bosing
                </td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Yangi kurs" size="sm">
        <CourseForm onSubmit={create} loading={saving} />
      </Modal>
      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title={`Tahrirlash: ${showEdit?.name || ''}`} size="sm">
        {showEdit && <CourseForm initial={showEdit} onSubmit={update} loading={saving} />}
      </Modal>
    </div>
  )
}
