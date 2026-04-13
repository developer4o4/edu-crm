import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Eye, Trash2, Phone, Edit, DollarSign } from 'lucide-react'
import { studentsAPI } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, Inp, Sel, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const card = C.card
const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))

// ── Add/Edit teacher form ────────────────────────────────────────────────────
function TeacherForm({ teacher, onSubmit, loading }) {
  const [f, setF] = useState({
    first_name: teacher?.first_name || '',
    last_name: teacher?.last_name || '',
    phone: teacher?.phone || '+998',
    subject: teacher?.subject || '',
    salary: teacher?.salary || '',
    salary_type: teacher?.salary_type || 'fixed',
    salary_percent: teacher?.salary_percent || '',
  })

  const s = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = e => {
    e.preventDefault()
    if (!f.first_name || !f.last_name || !f.phone) {
      toast.error('Majburiy maydonlar')
      return
    }

    const data = {
      ...f,
      salary: f.salary_type === 'fixed' ? Number(f.salary) : 0,
      salary_percent: f.salary_type === 'percent' ? Number(f.salary_percent) : 0,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Inp label="Familiya *" placeholder="Aliyev" value={f.last_name} onChange={e => s('last_name', e.target.value)} />
        <Inp label="Ism *" placeholder="Jasur" value={f.first_name} onChange={e => s('first_name', e.target.value)} />
        <Inp label="Telefon *" placeholder="+998901234567" value={f.phone} onChange={e => s('phone', e.target.value)} />
        <Inp label="Fan/yo'nalish" placeholder="Matematika, Ingliz tili..." value={f.subject} onChange={e => s('subject', e.target.value)} />
        <Sel label="Maosh turi" value={f.salary_type} onChange={e => s('salary_type', e.target.value)}>
          <option value="fixed">Belgilangan</option>
          <option value="percent">Foiz asosida</option>
        </Sel>
        {f.salary_type === 'fixed' ? (
          <Inp label="Maosh (UZS)" type="number" placeholder="2000000" value={f.salary} onChange={e => s('salary', e.target.value)} min={0} />
        ) : (
          <Inp label="Foiz (%)" type="number" placeholder="20" value={f.salary_percent} onChange={e => s('salary_percent', e.target.value)} min={0} max={100} step={0.1} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
        <Btn type="submit" primary disabled={loading}>
          {loading ? 'Saqlanmoqda...' : teacher ? 'Saqlash' : "O'qituvchi qo'shish"}
        </Btn>
      </div>
    </form>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [meta, setMeta] = useState({ count: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [creating, setCreating] = useState(false)

  // filters
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const p = { page, page_size: 20 }
      if (search) p.search = search

      const { data } = await studentsAPI.teachers(p)
      const teachersData = data.results || data
      setTeachers(Array.isArray(teachersData) ? teachersData : [])
      if (data.count !== undefined)
        setMeta({ count: data.count, total_pages: data.total_pages || 1 })
    } catch {
      toast.error('Yuklanmadi')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchTeachers, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchTeachers])

  const resetPage = () => setPage(1)

  const create = async data => {
    setCreating(true)
    try {
      await studentsAPI.createTeacher(data)
      toast.success("O'qituvchi qo'shildi")
      setShowCreate(false)
      fetchTeachers()
    } catch (e) {
      toast.error(e.response?.data?.phone?.[0] || 'Xato')
    } finally {
      setCreating(false)
    }
  }

  const update = async data => {
    setCreating(true)
    try {
      await studentsAPI.updateTeacher(editingTeacher.id, data)
      toast.success("O'qituvchi tahrirlandi")
      setEditingTeacher(null)
      fetchTeachers()
    } catch (e) {
      toast.error(e.response?.data?.phone?.[0] || 'Xato')
    } finally {
      setCreating(false)
    }
  }

  const remove = async teacher => {
    if (!confirm(`${teacher.full_name} o'qituvchini o'chirmoqchimisiz?`)) return
    try {
      await studentsAPI.deleteTeacher(teacher.id)
      toast.success("O'qituvchi o'chirildi")
      fetchTeachers()
    } catch {
      toast.error('Xato')
    }
  }

  return (
    <div>
      <PageHeader title="O'qituvchilar" sub={`${teachers.length} ta o'qituvchi`} action={<Btn primary onClick={() => setShowCreate(true)}><Plus size={14}/>Yangi o'qituvchi</Btn>} />

      <div style={{...card, padding:'12px', marginBottom:'16px', display:'flex', gap:'12px'}}>
        <div style={{position:'relative', maxWidth:'300px', flex:1}}>
          <Search size={14} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}}/>
          <input placeholder="O'qituvchi nomi..." value={search} onChange={e=>{setSearch(e.target.value); resetPage()}}
            style={{width:'100%', padding:'8px 12px 8px 32px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'13px', outline:'none'}}/>
        </div>
      </div>

      {loading ? <Spinner/> : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'16px'}}>
          {teachers.map(t => (
            <div key={t.id} style={{...card, padding:'20px', transition:'box-shadow .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'}>
              <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px'}}>
                <div>
                  <div style={{fontSize:'16px', fontWeight:'600', color:'#111827'}}>{t.full_name}</div>
                  <div style={{fontSize:'12px', color:'#6b7280', marginTop:'2px'}}>{t.subject || 'Fan belgilanmagan'}</div>
                </div>
                <Badge color={t.is_active ? 'green' : 'gray'}>{t.is_active ? 'Faol' : 'Faol emas'}</Badge>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#4b5563'}}>
                  <Phone size={12} color="#9ca3af"/>{t.phone}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'#4b5563'}}>
                  <DollarSign size={12} color="#9ca3af"/>
                  {t.salary_type === 'fixed' ? `${fmt(t.salary)} UZS` : `${t.salary_percent}%`}
                </div>
                <div style={{fontSize:'12px', color:'#6b7280'}}>
                  {t.groups_count} ta guruh
                </div>
              </div>

              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={() => setEditingTeacher(t)} style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'8px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'13px', color:'#374151'}}>
                  <Edit size={13}/>Tahrirlash
                </button>
                <button onClick={() => remove(t)} style={{padding:'8px 10px', borderRadius:'8px', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', color:'#ef4444'}}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
          {!teachers.length && (
            <div style={{gridColumn:'1/-1', display:'flex', flexDirection:'column', alignItems:'center', padding:'64px', color:'#9ca3af'}}>
              <Plus size={40} style={{opacity:0.2, marginBottom:'12px'}}/>
              <p style={{fontSize:'14px'}}>O'qituvchilar topilmadi</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Yangi o'qituvchi">
        <TeacherForm onSubmit={create} loading={creating} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingTeacher} onClose={() => setEditingTeacher(null)} title="O'qituvchi tahrirlash">
        {editingTeacher && <TeacherForm teacher={editingTeacher} onSubmit={update} loading={creating} />}
      </Modal>
    </div>
  )
}