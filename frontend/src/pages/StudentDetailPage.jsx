import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, MapPin, Calendar, BookOpen, CreditCard, ClipboardCheck, Plus } from 'lucide-react'
import { studentsAPI, groupsAPI } from '../utils/api'
import { Btn, Badge, Spinner, Th, Td, Sel, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))
const card = C.card

export default function StudentDetailPage() {
  const {id}=useParams(); const navigate=useNavigate()
  const [student,setStudent]=useState(null)
  const [payments,setPayments]=useState({payments:[],total_paid:0})
  const [attendance,setAttendance]=useState(null)
  const [tab,setTab]=useState('info')
  const [loading,setLoading]=useState(true)
  const [groups,setGroups]=useState([])
  const [showAddGroup,setShowAddGroup]=useState(false)
  const [addingGroup,setAddingGroup]=useState(false)
  const [selGroup,setSelGroup]=useState('')
  const [discount,setDiscount]=useState(0)

  useEffect(()=>{studentsAPI.detail(id).then(r=>setStudent(r.data)).catch(()=>toast.error("Topilmadi")).finally(()=>setLoading(false))},[id])

  useEffect(()=>{
    if(tab==='payments')studentsAPI.payments(id).then(r=>setPayments(r.data))
    if(tab==='attendance')studentsAPI.attendance(id).then(r=>setAttendance(r.data))
    if(tab==='groups')groupsAPI.list({is_active:true,page_size:100}).then(r=>setGroups(r.data.results||r.data))
  },[tab,id])

  const addGroup=async()=>{
    if(!selGroup){toast.error("Guruh tanlang");return}
    setAddingGroup(true)
    try{await studentsAPI.addToGroup(id,{group_id:selGroup,discount_percent:discount});toast.success("Qo'shildi");setShowAddGroup(false);studentsAPI.detail(id).then(r=>setStudent(r.data))}
    catch(e){toast.error(e.response?.data?.error||"Xato")}finally{setAddingGroup(false)}
  }

  const removeFromGroup=async(groupId, groupName)=>{
    if(!confirm(`${groupName} guruhidan chiqarilsinmi?`))return
    try{
      await studentsAPI.removeFromGroup(id,{group_id:groupId})
      toast.success("Guruhdan chiqarildi")
      studentsAPI.detail(id).then(r=>setStudent(r.data))
    }catch(e){toast.error(e.response?.data?.error||"Xato")}
  }

  if(loading)return <Spinner/>
  if(!student)return <div style={{textAlign:'center',padding:'80px',color:'#9ca3af'}}>Topilmadi</div>
  const s=student

  const tabSt=active=>({padding:'10px 16px',fontSize:'13px',cursor:'pointer',border:'none',background:'none',fontFamily:'inherit',fontWeight:active?'500':'400',color:active?'#1D9E75':'#6b7280',borderBottom:active?'2px solid #1D9E75':'2px solid transparent'})
  const STATUS={active:'green',inactive:'gray',graduated:'blue',expelled:'red'}
  const STATUS_L={active:'Aktiv',inactive:'Faol emas',graduated:'Bitirgan',expelled:'Chiqarilgan'}

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <Btn sm onClick={()=>navigate(-1)}><ArrowLeft size={14}/></Btn>
        <div style={{flex:1}}>
          <h1 style={{fontSize:'20px',fontWeight:'600',color:'#111827',margin:0}}>{s.full_name}</h1>
          <p style={{fontSize:'13px',color:'#9ca3af',margin:'4px 0 0'}}>{s.phone}</p>
        </div>
        <Badge color={STATUS[s.status]||'gray'}>{STATUS_L[s.status]||s.status}</Badge>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
        {[
          {label:"Jami to'lagan",val:`${fmt(s.total_paid||0)} UZS`,c:'#111827'},
          {label:"Qarzi",val:`${fmt(s.total_debt||0)} UZS`,c:(s.total_debt||0)>0?'#ef4444':'#1D9E75'},
          {label:"Davomat",val:`${s.attendance_summary?.rate||0}%`,sub:`${s.attendance_summary?.present||0}/${s.attendance_summary?.total||0} dars`},
        ].map(item=>(
          <div key={item.label} style={{...card,padding:'20px'}}>
            <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>{item.label}</div>
            <div style={{fontSize:'22px',fontWeight:'600',color:item.c||'#111827'}}>{item.val}</div>
            {item.sub&&<div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>{item.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{...card,overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',overflowX:'auto'}}>
          {[['info',"Ma'lumotlar"],['groups','Guruhlar'],['payments',"To'lovlar"],['attendance','Davomat']].map(([k,l])=>(
            <button key={k} style={tabSt(tab===k)} onClick={()=>setTab(k)}>{l}</button>
          ))}
        </div>
        <div style={{padding:'20px'}}>
          {tab==='info'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                {[
                  ["To'liq ism",s.full_name],
                  ["Telefon",s.phone],
                  s.parent_phone&&["Ota-ona telefoni",s.parent_phone],
                  s.date_of_birth&&["Tug'ilgan sana",new Date(s.date_of_birth).toLocaleDateString('uz-UZ')],
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k}><p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>{k}</p><p style={{fontSize:'14px',fontWeight:'500',color:'#111827',margin:0}}>{v}</p></div>
                ))}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                {[
                  s.address&&["Manzil",s.address],
                  s.notes&&["Izoh",s.notes],
                  ["Qo'shilgan",new Date(s.created_at).toLocaleDateString('uz-UZ')],
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k}><p style={{fontSize:'11px',color:'#6b7280',margin:'0 0 2px'}}>{k}</p><p style={{fontSize:'14px',fontWeight:'500',color:'#111827',margin:0}}>{v}</p></div>
                ))}
              </div>
            </div>
          )}

          {tab==='groups'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <Btn primary sm onClick={()=>setShowAddGroup(true)}><Plus size={13}/>Guruhga qo'shish</Btn>
              </div>
              {s.memberships?.map(m=>(
                <div key={m.id} style={{border:'1px solid #f0f0f0',borderRadius:'12px',padding:'16px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div><div style={{fontWeight:'500',color:'#111827'}}>{m.group_name}</div><div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>{m.course_name}</div></div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <Badge color={m.is_active?'green':'gray'}>{m.is_active?'Aktiv':'Tugagan'}</Badge>
                      {m.is_active&&<button onClick={()=>removeFromGroup(m.group,m.group_name)} style={{padding:'4px 10px',borderRadius:'6px',border:'1px solid #fca5a5',background:'#fee2e2',color:'#dc2626',fontSize:'11px',fontWeight:'500',cursor:'pointer'}}>Chiqarish</button>}
                    </div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',fontSize:'12px',color:'#6b7280'}}>
                    <span>O'qituvchi: <b style={{color:'#111827'}}>{m.teacher_name||'—'}</b></span>
                    <span>Telefon: <b style={{color:'#111827'}}>{m.teacher_phone||'—'}</b></span>
                    <span>Jadval: <b style={{color:'#111827'}}>{m.schedule?.day_type}</b></span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px',fontSize:'12px',color:'#6b7280',marginTop:'10px'}}>
                    <span>Darslar: <b style={{color:'#111827'}}>{m.lessons_held || 0} ta</b></span>
                    <span>To'lov sanasi: <b style={{color:'#111827'}}>Har oyning {m.schedule?.payment_day || 1}-si</b></span>
                  </div>
                  {m.discount_percent>0&&<div style={{marginTop:'8px'}}><Badge color="amber">{m.discount_percent}% chegirma</Badge></div>}
                </div>
              ))}
              {!s.memberships?.length&&<p style={{textAlign:'center',color:'#9ca3af',padding:'32px',fontSize:'13px'}}>Hech qaysi guruhda emas</p>}
            </div>
          )}

          {tab==='payments'&&(
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div style={{background:'#e1f5ee',borderRadius:'10px',padding:'14px 16px'}}>
                <div style={{fontSize:'12px',color:'#0f6e56',marginBottom:'4px'}}>Jami to'langan</div>
                <div style={{fontSize:'20px',fontWeight:'600',color:'#0f6e56'}}>{fmt(payments.total_paid)} UZS</div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#fafafa'}}>{["Oy","Guruh","Summa","Tur","Sana","Status"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
                <tbody>
                  {payments.payments?.map(p=>(
                    <tr key={p.id} style={{borderBottom:'1px solid #f9fafb'}}>
                      <Td style={{fontSize:'12px'}}>{p.month?new Date(p.month).toLocaleDateString('uz-UZ',{year:'numeric',month:'long'}):'—'}</Td>
                      <Td style={{fontSize:'12px',color:'#6b7280'}}>{p.group_name}</Td>
                      <Td style={{fontWeight:'500'}}>{fmt(p.amount)}</Td>
                      <Td><Badge color="blue">{p.payment_type_display}</Badge></Td>
                      <Td style={{fontSize:'12px',color:'#9ca3af'}}>{p.paid_at?new Date(p.paid_at).toLocaleDateString('uz-UZ'):'—'}</Td>
                      <Td><Badge color={p.status==='paid'?'green':p.status==='pending'?'amber':'red'}>{p.status_display}</Badge></Td>
                    </tr>
                  ))}
                  {!payments.payments?.length&&<tr><td colSpan={6} style={{padding:'32px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>To'lovlar yo'q</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab==='attendance'&&attendance&&(
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px'}}>
                {[{l:'Jami',v:attendance.summary?.total},{l:'Keldi',v:attendance.summary?.present,c:'#1D9E75'},{l:'Kelmadi',v:attendance.summary?.absent,c:'#ef4444'},{l:'Davomat %',v:`${attendance.summary?.attendance_rate||0}%`,c:'#1d4ed8'}].map(item=>(
                  <div key={item.l} style={{...card,padding:'16px',textAlign:'center'}}>
                    <div style={{fontSize:'11px',color:'#6b7280',marginBottom:'6px'}}>{item.l}</div>
                    <div style={{fontSize:'20px',fontWeight:'600',color:item.c||'#111827'}}>{item.v}</div>
                  </div>
                ))}
              </div>
              {attendance.by_group?.map(g=>(
                <div key={g.group} style={{border:'1px solid #f0f0f0',borderRadius:'10px',padding:'14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontWeight:'500',fontSize:'14px'}}>{g.group}</span>
                  <div style={{display:'flex',gap:'12px',fontSize:'13px'}}>
                    <span style={{color:'#0f6e56'}}>✓ {g.present}</span>
                    <span style={{color:'#ef4444'}}>✗ {g.absent}</span>
                    <span style={{color:'#f59e0b'}}>~ {g.late}</span>
                    <span style={{color:'#6b7280'}}>Jami: {g.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showAddGroup} onClose={()=>setShowAddGroup(false)} title="Guruhga qo'shish" size="sm">
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <Sel label="Guruh" value={selGroup} onChange={e=>setSelGroup(e.target.value)}>
            <option value="">Guruhni tanlang...</option>
            {groups.map(g=><option key={g.id} value={g.id} disabled={g.is_full}>{g.name} — {g.course_name} ({g.student_count}/{g.max_students}){g.is_full?" [To'la]":""}</option>)}
          </Sel>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>Chegirma (%)</label>
            <input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} min={0} max={100} placeholder="0"
              style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none'}}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
            <Btn onClick={()=>setShowAddGroup(false)}>Bekor</Btn>
            <Btn primary onClick={addGroup} disabled={addingGroup}>{addingGroup?'...':'Qo\'shish'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}