import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
<<<<<<< HEAD
import { Plus, Search, Users, Clock, CreditCard, Eye, MessageSquare, Calendar, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { groupsAPI, coursesAPI } from '../utils/api'
=======
import { Plus, Search, Users, Clock, CreditCard, Eye, MessageSquare, Calendar, BookOpen } from 'lucide-react'
import { groupsAPI, coursesAPI, studentsAPI } from '../utils/api'
>>>>>>> recovery-work
import { Btn, Badge, Spinner, PageHeader, Inp, Sel, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))
const card = C.card

<<<<<<< HEAD
function GroupForm({ onSubmit, loading, initial }) {
  const [courses,setCourses]=useState([])
  const [f,setF]=useState(initial ? {
    name: initial.name||'',
    course: initial.course||'',
    teacher: initial.teacher||'',
    day_type: initial.day_type||'odd',
    start_time: initial.start_time?.slice(0,5)||'09:00',
    end_time: initial.end_time?.slice(0,5)||'11:00',
    monthly_fee: initial.monthly_fee||'',
    payment_day: initial.payment_day||1,
    start_date: initial.start_date||new Date().toISOString().slice(0,10),
    max_students: initial.max_students||15,
    room: initial.room||''
  } : {name:'',course:'',teacher:'',day_type:'odd',start_time:'09:00',end_time:'11:00',monthly_fee:'',payment_day:1,start_date:new Date().toISOString().slice(0,10),max_students:15,room:''})
  const s=(k,v)=>setF(p=>({...p,[k]:v}))
  useEffect(()=>{coursesAPI.list({page_size:100}).then(r=>setCourses(r.data.results||r.data))},[])
  const submit=e=>{e.preventDefault();if(!f.name||!f.course||!f.monthly_fee){toast.error("Majburiy maydonlar");return};onSubmit({...f,monthly_fee:Number(f.monthly_fee),payment_day:Number(f.payment_day),max_students:Number(f.max_students)})}
=======

function GroupForm({ onSubmit, loading }) {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [f, setF] = useState({
    name: '',
    course: '',
    teacher: '',
    day_type: 'odd',
    start_time: '09:00:00', // default boshlanish vaqti
    end_time: '11:00:00',   // default tugash vaqti
    monthly_fee: '',
    payment_day: 1,
    start_date: new Date().toISOString().slice(0,10),
    max_students: 15,
    room: ''
  });

  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  useEffect(() => {
    coursesAPI.list({ page_size: 100 })
      .then(r => setCourses(r.data.results || r.data))
  }, []);

  useEffect(() => {
    studentsAPI.teachers()
      .then(r => setTeachers(r.data.results || r.data))
  }, []);

  const submit = e => {
    e.preventDefault();

    if (!f.name || !f.course || !f.monthly_fee) {
      toast.error("Majburiy maydonlar");
      return;
    }

    // HH:MM -> HH:MM:SS

    onSubmit({
      ...f,
      teacher: f.teacher || null,
      start_time: f.start_time + ':00',
      end_time: f.end_time + ':00',
      monthly_fee: Number(f.monthly_fee),
      payment_day: Number(f.payment_day),
      max_students: Number(f.max_students)
    });
  }

>>>>>>> recovery-work
  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <Inp label="Guruh nomi *" placeholder="IT-7, IELTS-3..." value={f.name} onChange={e=>s('name',e.target.value)}/>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <Sel label="Kurs *" value={f.course} onChange={e=>s('course',e.target.value)}>
          <option value="">Tanlang...</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Sel>
<<<<<<< HEAD
        <Sel label="Dars kunlari" value={f.day_type} onChange={e=>s('day_type',e.target.value)}>
=======
        <Sel label="O'qituvchi" value={f.teacher} onChange={e => s('teacher', e.target.value)}>
          <option value="">Tanlang...</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
        </Sel>
        <Sel label="Dars kunlari" value={f.day_type} onChange={e => s('day_type', e.target.value)}>
>>>>>>> recovery-work
          <option value="odd">Toq kunlar (Du,Cho,Ju)</option>
          <option value="even">Juft kunlar (Se,Pa,Sha)</option>
          <option value="daily">Har kuni</option>
          <option value="weekend">Dam olish kunlari</option>
        </Sel>
<<<<<<< HEAD
        <Inp label="Boshlanish vaqti" type="time" value={f.start_time} onChange={e=>s('start_time',e.target.value)}/>
        <Inp label="Tugash vaqti" type="time" value={f.end_time} onChange={e=>s('end_time',e.target.value)}/>
        <Inp label="Oylik to'lov (UZS) *" type="number" placeholder="500000" value={f.monthly_fee} onChange={e=>s('monthly_fee',e.target.value)} min={0}/>
        <Inp label="To'lov sanasi (1-28)" type="number" value={f.payment_day} onChange={e=>s('payment_day',e.target.value)} min={1} max={28}/>
        <Inp label="Boshlanish sanasi" type="date" value={f.start_date} onChange={e=>s('start_date',e.target.value)}/>
        <Inp label="Max o'quvchilar" type="number" value={f.max_students} onChange={e=>s('max_students',e.target.value)} min={1}/>
        <Inp label="Xona" placeholder="101-xona" value={f.room} onChange={e=>s('room',e.target.value)}/>
=======
        <Inp label="Boshlanish vaqti" type="time" value={f.start_time} onChange={e => s('start_time', e.target.value)} />
        <Inp label="Tugash vaqti" type="time" value={f.end_time} onChange={e => s('end_time', e.target.value)} />
        <Inp label="Oylik to'lov (UZS) *" type="number" placeholder="500000" value={f.monthly_fee} onChange={e => s('monthly_fee', e.target.value)} min={0} />
        <Inp label="To'lov sanasi (1-28)" type="number" value={f.payment_day} onChange={e => s('payment_day', e.target.value)} min={1} max={28} />
        <Inp label="Boshlanish sanasi" type="date" value={f.start_date} onChange={e => s('start_date', e.target.value)} />
        <Inp label="Max o'quvchilar" type="number" value={f.max_students} onChange={e => s('max_students', e.target.value)} min={1} />
        <Inp label="Xona" placeholder="101-xona" value={f.room} onChange={e => s('room', e.target.value)} />
>>>>>>> recovery-work
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',paddingTop:'8px',borderTop:'1px solid #f0f0f0'}}>
        <Btn type="submit" primary disabled={loading}>{loading?'Yaratilmoqda...':'Guruh yaratish'}</Btn>
      </div>
    </form>
  )
}

function SMSModal({ group, onClose }) {
  const [msg,setMsg]=useState('')
  const [sending,setSending]=useState(false)
  const send=async()=>{
    if(!msg.trim()||msg.length>160){toast.error("Xabar kiriting (maks 160)");return}
    setSending(true)
    try{await groupsAPI.sendSMS(group.id,{message:msg});toast.success(`${group.student_count} ta o'quvchiga yuborildi`);onClose()}
    catch{toast.error("Xato")}finally{setSending(false)}
  }
  return (
    <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div style={{background:'#eff6ff',borderRadius:'10px',padding:'12px',fontSize:'13px',color:'#1d4ed8'}}>
        <b>{group.name}</b> guruhidagi <b>{group.student_count}</b> ta o'quvchiga SMS yuboriladi
      </div>
      <div>
        <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563',display:'block',marginBottom:'4px'}}>Xabar matni</label>
        <textarea value={msg} onChange={e=>setMsg(e.target.value)} maxLength={160} rows={4}
          style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',resize:'none',fontFamily:'inherit'}}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
          <span style={{fontSize:'11px',color:'#9ca3af'}}>Maks 160 belgi</span>
          <span style={{fontSize:'11px',color:msg.length>140?'#ef4444':'#9ca3af'}}>{msg.length}/160</span>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
        <Btn onClick={onClose}>Bekor</Btn>
        <Btn primary onClick={send} disabled={sending}><MessageSquare size={14}/>{sending?'Yuborilmoqda...':'Yuborish'}</Btn>
      </div>
    </div>
  )
}

export default function GroupsPage() {
  const navigate = useNavigate()
  const [groups,setGroups]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [showCreate,setShowCreate]=useState(false)
  const [showSMS,setShowSMS]=useState(null)
  const [creating,setCreating]=useState(false)
  const [showEdit,setShowEdit]=useState(null)

  const fetch=useCallback(async()=>{
    setLoading(true)
    try{const p={page_size:50};if(search)p.search=search;const r=await groupsAPI.list(p);setGroups(r.data.results||r.data)}
    catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  },[search])

  useEffect(()=>{const t=setTimeout(fetch,search?400:0);return()=>clearTimeout(t)},[fetch])

  const create=async data=>{
    setCreating(true)
    try{await groupsAPI.create(data);toast.success("Guruh yaratildi");setShowCreate(false);fetch()}
    catch(e){toast.error(e.response?.data?.name?.[0]||"Xato")}finally{setCreating(false)}
  }

  const update=async data=>{
    setCreating(true)
    try{await groupsAPI.update(showEdit.id,data);toast.success("Yangilandi");setShowEdit(null);fetch()}
    catch(e){toast.error(e.response?.data?.name?.[0]||"Xato")}finally{setCreating(false)}
  }

  const deleteGroup=async(id,name)=>{
    if(!confirm(`"${name}" guruhini o'chirishni tasdiqlaysizmi?`))return
    try{await groupsAPI.delete(id);toast.success("O'chirildi");fetch()}
    catch(e){toast.error(e.response?.data?.detail||"O'chirishda xato")}
  }

  const dayLabels={odd:'Du,Cho,Ju',even:'Se,Pa,Sha',daily:'Har kuni',weekend:'Dam olish'}

  return (
    <div>
      <PageHeader title="Guruhlar" sub={`${groups.length} ta aktiv guruh`} action={<Btn primary onClick={()=>setShowCreate(true)}><Plus size={14}/>Yangi guruh</Btn>}/>

      <div style={{...card,padding:'12px',marginBottom:'16px',display:'flex',gap:'12px'}}>
        <div style={{position:'relative',maxWidth:'300px',flex:1}}>
          <Search size={14} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
          <input placeholder="Guruh nomi..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none'}}/>
        </div>
      </div>

      {loading?<Spinner/>:(
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
          {groups.map(g=>(
            <div key={g.id} style={{...card,padding:'20px',transition:'box-shadow .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
                <div>
                  <div style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{g.name}</div>
                  <div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>{g.course_name}</div>
                </div>
                <Badge color={g.is_full?'red':g.student_count>=g.max_students*0.8?'amber':'green'}>{g.student_count}/{g.max_students}</Badge>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#4b5563'}}>
                  <Users size={12} color="#9ca3af"/>{g.teacher_name||"O'qituvchi belgilanmagan"}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#4b5563'}}>
                  <Clock size={12} color="#9ca3af"/>{dayLabels[g.day_type]||g.day_type}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#4b5563'}}>
                  <CreditCard size={12} color="#9ca3af"/>{fmt(g.monthly_fee)} UZS/oy
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'#4b5563'}}>
                  <Calendar size={12} color="#9ca3af"/>To'lov: har oyning {g.payment_day}-sanasi
                </div>
              </div>
              <div style={{height:'4px',background:'#f0f0f0',borderRadius:'2px',marginBottom:'14px',overflow:'hidden'}}>
                <div style={{height:'4px',borderRadius:'2px',background:g.is_full?'#ef4444':'#1D9E75',width:`${Math.min(100,(g.student_count/g.max_students)*100)}%`,transition:'width .3s'}}/>
              </div>
              <div style={{display:'flex',gap:'6px'}}>
                <button onClick={()=>navigate(`/groups/${g.id}`)} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',padding:'8px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'12px',color:'#374151'}}>
                  <Eye size={13}/>Ko'rish
                </button>
                <button onClick={()=>setShowEdit(g)} title="Tahrirlash" style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',color:'#6b7280'}}>
                  <Pencil size={14}/>
                </button>
                <button onClick={()=>setShowSMS(g)} title="SMS yuborish" style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',color:'#6b7280'}}>
                  <MessageSquare size={14}/>
                </button>
                <button onClick={()=>deleteGroup(g.id,g.name)} title="O'chirish" style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid #fca5a5',background:'#fee2e2',cursor:'pointer',color:'#dc2626'}}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
          {!groups.length&&(
            <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',padding:'64px',color:'#9ca3af'}}>
              <BookOpen size={40} style={{opacity:0.2,marginBottom:'12px'}}/>
              <p style={{fontSize:'14px'}}>Guruhlar topilmadi</p>
            </div>
          )}
        </div>
      )}

      <Modal open={showCreate} onClose={()=>setShowCreate(false)} title="Yangi guruh" size="lg">
        <GroupForm onSubmit={create} loading={creating}/>
      </Modal>
      <Modal open={!!showSMS} onClose={()=>setShowSMS(null)} title="Guruhdagi o'quvchilarga SMS" size="sm">
        {showSMS&&<SMSModal group={showSMS} onClose={()=>setShowSMS(null)}/>}
      </Modal>
      <Modal open={!!showEdit} onClose={()=>setShowEdit(null)} title={`Guruhni tahrirlash: ${showEdit?.name||''}`} size="lg">
        {showEdit&&<GroupForm onSubmit={update} loading={creating} initial={showEdit}/>}
      </Modal>
    </div>
  )
}