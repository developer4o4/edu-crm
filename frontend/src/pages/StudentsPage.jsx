import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Trash2, Phone } from 'lucide-react'
import { studentsAPI } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, Inp, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const STATUS = { active:{l:'Aktiv',c:'green'}, inactive:{l:'Faol emas',c:'gray'}, graduated:{l:'Bitirgan',c:'blue'}, expelled:{l:'Chiqarilgan',c:'red'} }

function Form({ onSubmit, loading }) {
  const [f,setF] = useState({first_name:'',last_name:'',phone:'+998',parent_phone:'',date_of_birth:'',address:'',notes:''})
  const s=(k,v)=>setF(p=>({...p,[k]:v}))
  const submit=e=>{e.preventDefault();if(!f.first_name||!f.last_name||!f.phone){toast.error("Majburiy maydonlar");return};onSubmit(f)}
  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <Inp label="Familiya *" placeholder="Aliyev" value={f.last_name} onChange={e=>s('last_name',e.target.value)}/>
        <Inp label="Ism *" placeholder="Jasur" value={f.first_name} onChange={e=>s('first_name',e.target.value)}/>
        <Inp label="Telefon *" placeholder="+998901234567" value={f.phone} onChange={e=>s('phone',e.target.value)}/>
        <Inp label="Ota-ona tel" placeholder="+998901234567" value={f.parent_phone} onChange={e=>s('parent_phone',e.target.value)}/>
        <Inp label="Tug'ilgan sana" type="date" value={f.date_of_birth} onChange={e=>s('date_of_birth',e.target.value)}/>
        <Inp label="Manzil" placeholder="Toshkent..." value={f.address} onChange={e=>s('address',e.target.value)}/>
      </div>
      <Inp label="Izoh" placeholder="Qo'shimcha..." value={f.notes} onChange={e=>s('notes',e.target.value)}/>
      <div style={{display:'flex',justifyContent:'flex-end',paddingTop:'8px',borderTop:'1px solid #f0f0f0'}}>
        <Btn type="submit" primary disabled={loading}>{loading?'Saqlanmoqda...':'Saqlash'}</Btn>
      </div>
    </form>
  )
}

export default function StudentsPage() {
  const navigate = useNavigate()
  const [students,setStudents]=useState([])
  const [meta,setMeta]=useState({count:0,total_pages:1})
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [status,setStatus]=useState('')
  const [debtors,setDebtors]=useState(false)
  const [page,setPage]=useState(1)
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)

  const fetch=useCallback(async()=>{
    setLoading(true)
    try{
      const p={page,page_size:20}
      if(search)p.search=search; if(status)p.status=status; if(debtors)p.debtors_only='true'
      const{data}=await studentsAPI.list(p)
      setStudents(data.results||data)
      if(data.count!==undefined)setMeta({count:data.count,total_pages:data.total_pages||1})
    }catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  },[page,search,status,debtors])

  useEffect(()=>{const t=setTimeout(fetch,search?400:0);return()=>clearTimeout(t)},[fetch])

  const create=async form=>{
    setSaving(true)
    try{await studentsAPI.create(form);toast.success("Qo'shildi");setModal(false);fetch()}
    catch(e){toast.error(e.response?.data?.phone?.[0]||"Xato")}finally{setSaving(false)}
  }

  const del=async(id,name)=>{
    if(!confirm(`${name} o'chirilsinmi?`))return
    try{await studentsAPI.delete(id);toast.success("O'chirildi");fetch()}catch{toast.error("Xato")}
  }

  return (
    <div>
      <PageHeader title="O'quvchilar" sub={`Jami: ${meta.count} ta`} action={<Btn primary onClick={()=>setModal(true)}><Plus size={14}/>Yangi o'quvchi</Btn>}/>

      <Card p="12px" style={{marginBottom:'16px',display:'flex',gap:'12px',flexWrap:'wrap',alignItems:'center'}}>
        <div style={{position:'relative',flex:1,minWidth:'200px'}}>
          <Search size={14} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
          <input placeholder="Ism, familiya, telefon..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}
            style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none'}}/>
        </div>
        <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}
          style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',background:'#fff',cursor:'pointer'}}>
          <option value="">Barcha status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Faol emas</option>
          <option value="graduated">Bitirgan</option>
        </select>
        <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#4b5563',cursor:'pointer',userSelect:'none'}}>
          <input type="checkbox" checked={debtors} onChange={e=>{setDebtors(e.target.checked);setPage(1)}} style={{accentColor:'#1D9E75'}}/>
          Faqat qarzdorlar
        </label>
      </Card>

      <Card p="0" style={{overflow:'hidden'}}>
        {loading?<Spinner/>:(
          <>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#fafafa'}}>
                {["O'quvchi","Telefon","Guruhlar","Status","Sana",""].map(h=><Th key={h}>{h}</Th>)}
              </tr></thead>
              <tbody>
                {students.map(s=>(
                  <tr key={s.id} style={{borderBottom:'1px solid #f9fafb'}} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <Td>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#e1f5ee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'600',color:'#0f6e56',flexShrink:0}}>
                          {s.last_name?.[0]}{s.first_name?.[0]}
                        </div>
                        <span style={{fontWeight:'500',color:'#111827'}}>{s.full_name}</span>
                      </div>
                    </Td>
                    <Td style={{color:'#6b7280'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}><Phone size={12} color="#9ca3af"/>{s.phone}</div>
                    </Td>
                    <Td>
                      <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                        {s.active_groups?.slice(0,2).map(g=><Badge key={g.id} color="blue">{g.name}</Badge>)}
                        {!s.active_groups?.length&&<span style={{fontSize:'12px',color:'#9ca3af'}}>—</span>}
                      </div>
                    </Td>
                    <Td><Badge color={STATUS[s.status]?.c||'gray'}>{STATUS[s.status]?.l||s.status}</Badge></Td>
                    <Td style={{color:'#9ca3af',fontSize:'12px'}}>{new Date(s.created_at).toLocaleDateString('uz-UZ')}</Td>
                    <Td>
                      <div style={{display:'flex',gap:'4px'}}>
                        <button onClick={()=>navigate(`/students/${s.id}`)} style={{padding:'6px',border:'none',background:'none',cursor:'pointer',color:'#9ca3af',borderRadius:'6px'}}><Eye size={14}/></button>
                        <button onClick={()=>del(s.id,s.full_name)} style={{padding:'6px',border:'none',background:'none',cursor:'pointer',color:'#9ca3af',borderRadius:'6px'}}><Trash2 size={14}/></button>
                      </div>
                    </Td>
                  </tr>
                ))}
                {!students.length&&<tr><td colSpan={6} style={{padding:'48px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>O'quvchilar topilmadi</td></tr>}
              </tbody>
            </table>
            {meta.total_pages>1&&(
              <div style={{padding:'12px 16px',borderTop:'1px solid #f0f0f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'12px',color:'#9ca3af'}}>Sahifa {page}/{meta.total_pages} ({meta.count} ta)</span>
                <div style={{display:'flex',gap:'8px'}}>
                  <Btn sm disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</Btn>
                  <Btn sm disabled={page>=meta.total_pages} onClick={()=>setPage(p=>p+1)}>→</Btn>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title="Yangi o'quvchi">
        <Form onSubmit={create} loading={saving}/>
      </Modal>
    </div>
  )
}
