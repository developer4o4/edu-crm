import { useState, useEffect } from 'react'
import { Plus, ClipboardCheck } from 'lucide-react'
import { attendanceAPI, groupsAPI } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, Sel, Inp, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

function NewSessionForm({ onSubmit, loading }) {
  const [groups,setGroups]=useState([])
  const [f,setF]=useState({group:'',date:new Date().toISOString().slice(0,10),topic:''})
  useEffect(()=>{groupsAPI.list({is_active:true,page_size:100}).then(r=>setGroups(r.data.results||r.data))},[])
  const submit=e=>{e.preventDefault();if(!f.group){toast.error("Guruhni tanlang");return};onSubmit(f)}
  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      <Sel label="Guruh *" value={f.group} onChange={e=>setF(p=>({...p,group:e.target.value}))}>
        <option value="">Guruhni tanlang...</option>
        {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
      </Sel>
      <Inp label="Sana *" type="date" value={f.date} onChange={e=>setF(p=>({...p,date:e.target.value}))}/>
      <Inp label="Dars mavzusi" placeholder="Ixtiyoriy..." value={f.topic} onChange={e=>setF(p=>({...p,topic:e.target.value}))}/>
      <div style={{display:'flex',justifyContent:'flex-end',paddingTop:'8px',borderTop:'1px solid #f0f0f0'}}>
        <Btn type="submit" primary disabled={loading}>{loading?'Ochilmoqda...':'Sessiya ochish'}</Btn>
      </div>
    </form>
  )
}

function AttendanceMarker({ session, onClose, onSave }) {
  const [members,setMembers]=useState([])
  const [records,setRecords]=useState({})
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)

  useEffect(()=>{
    Promise.all([groupsAPI.detail(session.group),attendanceAPI.sessionStats(session.id)])
      .then(([gr,st])=>{
        const existing={}
        st.data.records?.forEach(r=>{existing[r.student]=r.status})
        const mems=gr.data.students||[]
        setMembers(mems)
        const init={}
        mems.forEach(m=>{init[m.id]=existing[m.id]||'present'})
        setRecords(init)
      }).finally(()=>setLoading(false))
  },[session])

  const setS=(id,s)=>setRecords(p=>({...p,[id]:s}))
  const save=async()=>{
    setSaving(true)
    const arr=Object.entries(records).map(([student_id,status])=>({student_id:Number(student_id),status}))
    try{await attendanceAPI.bulkMark(session.id,{records:arr});toast.success("Saqlandi");onSave();onClose()}
    catch{toast.error("Xato")}finally{setSaving(false)}
  }

  const present=Object.values(records).filter(s=>s==='present').length
  const statusCfg={present:{l:'K',bg:'#e1f5ee',c:'#0f6e56',ac:'#1D9E75'},absent:{l:'Y',bg:'#fee2e2',c:'#dc2626',ac:'#ef4444'},late:{l:'~',bg:'#fffbeb',c:'#b45309',ac:'#f59e0b'},excused:{l:'U',bg:'#eff6ff',c:'#1d4ed8',ac:'#3b82f6'}}

  return (
    <div>
      <div style={{display:'flex',gap:'16px',padding:'12px',background:'#f9fafb',borderRadius:'10px',marginBottom:'16px',fontSize:'13px'}}>
        <span style={{color:'#0f6e56',fontWeight:'500'}}>✓ {present} keldi</span>
        <span style={{color:'#ef4444'}}>✗ {Object.values(records).filter(s=>s==='absent').length} kelmadi</span>
        <span style={{color:'#6b7280'}}>Jami: {members.length}</span>
      </div>
      {loading?<Spinner/>:(
        <div style={{maxHeight:'380px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'4px'}}>
          {members.map(m=>{
            const cur=records[m.id]||'present'
            return (
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',border:'1px solid #f0f0f0'}}>
                <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'#e1f5ee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'600',color:'#0f6e56',flexShrink:0}}>
                  {m.full_name?.[0]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#111827'}}>{m.full_name}</div>
                  {m.phone&&<a href={`tel:${m.phone}`} style={{fontSize:'11px',color:'#1D9E75',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'3px',marginTop:'1px'}}>📞 {m.phone}</a>}
                </div>
                <div style={{display:'flex',gap:'4px'}}>
                  {Object.entries(statusCfg).map(([st,cfg])=>(
                    <button key={st} onClick={()=>setS(m.id,st)} style={{
                      width:'32px',height:'32px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'600',
                      background:cur===st?cfg.ac:cfg.bg, color:cur===st?'#fff':cfg.c, transition:'all .15s'
                    }}>{cfg.l}</button>
                  ))}
                </div>
              </div>
            )
          })}
          {!members.length&&<p style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>Guruhda o'quvchilar yo'q</p>}
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',paddingTop:'16px',borderTop:'1px solid #f0f0f0',marginTop:'16px'}}>
        <Btn onClick={onClose}>Bekor</Btn>
        <Btn primary onClick={save} disabled={saving}>{saving?'Saqlanmoqda...':'Saqlash'}</Btn>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  const [sessions,setSessions]=useState([])
  const [loading,setLoading]=useState(true)
  const [showNew,setShowNew]=useState(false)
  const [showMark,setShowMark]=useState(null)
  const [creating,setCreating]=useState(false)
  const [groupFilter,setGroupFilter]=useState('')
  const [groups,setGroups]=useState([])

  useEffect(()=>{groupsAPI.list({is_active:true,page_size:100}).then(r=>{const groupsData=r.data.results||r.data;setGroups(Array.isArray(groupsData)?groupsData:[])})},[])

  const fetch=async()=>{
    setLoading(true)
    try{const p={page_size:30};if(groupFilter)p.group=groupFilter;const r=await attendanceAPI.sessions(p);const sessionsData=r.data.results||r.data;setSessions(Array.isArray(sessionsData)?sessionsData:[])}
    catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  }

  useEffect(()=>{fetch()},[groupFilter])

  const createSession=async data=>{
    setCreating(true)
    try{const r=await attendanceAPI.createSession(data);toast.success("Sessiya ochildi");setShowNew(false);setShowMark(r.data);fetch()}
    catch(e){toast.error(e.response?.data?.non_field_errors?.[0]||"Xato")}finally{setCreating(false)}
  }

  const getRate=s=>s.records_count?Math.round((s.present_count/s.records_count)*100):null

  return (
    <div>
      <PageHeader title="Davomat" sub="Dars sessiyalari" action={<Btn primary onClick={()=>setShowNew(true)}><Plus size={14}/>Yangi sessiya</Btn>}/>

      <div style={{...C.card,padding:'12px',marginBottom:'16px'}}>
        <select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}
          style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',background:'#fff',cursor:'pointer',outline:'none',minWidth:'250px'}}>
          <option value="">Barcha guruhlar</option>
          {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <Card p="0" style={{overflow:'hidden'}}>
        {loading?<Spinner/>:(
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#fafafa'}}>
              {["Sana","Guruh","Mavzu","Keldi","Kelmadi","Davomat %",""].map(h=><Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {sessions.map(s=>{
                const rate=getRate(s)
                return (
                  <tr key={s.id} style={{borderBottom:'1px solid #f9fafb'}} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <Td style={{fontWeight:'500'}}>{new Date(s.date).toLocaleDateString('uz-UZ')}</Td>
                    <Td><Badge color="blue">{s.group_name}</Badge></Td>
                    <Td style={{color:'#6b7280',fontSize:'12px'}}>{s.topic||'—'}</Td>
                    <Td><span style={{color:'#0f6e56',fontWeight:'600'}}>{s.present_count}</span></Td>
                    <Td><span style={{color:'#ef4444',fontWeight:'600'}}>{s.absent_count}</span></Td>
                    <Td>
                      {rate!==null?(
                        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                          <div style={{flex:1,height:'6px',background:'#f0f0f0',borderRadius:'3px',overflow:'hidden'}}>
                            <div style={{height:'6px',borderRadius:'3px',width:`${rate}%`,background:rate>=80?'#1D9E75':rate>=60?'#f59e0b':'#ef4444',transition:'width .3s'}}/>
                          </div>
                          <span style={{fontSize:'12px',color:'#374151',minWidth:'32px'}}>{rate}%</span>
                        </div>
                      ):<span style={{fontSize:'12px',color:'#9ca3af'}}>Belgilanmagan</span>}
                    </Td>
                    <Td>
                      <Btn sm onClick={()=>setShowMark(s)}><ClipboardCheck size={13}/>Belgilash</Btn>
                    </Td>
                  </tr>
                )
              })}
              {!sessions.length&&<tr><td colSpan={7} style={{padding:'48px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Sessiyalar yo'q</td></tr>}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={showNew} onClose={()=>setShowNew(false)} title="Yangi dars sessiyasi" size="sm">
        <NewSessionForm onSubmit={createSession} loading={creating}/>
      </Modal>
      <Modal open={!!showMark} onClose={()=>setShowMark(null)} title={`Davomat — ${showMark?.group_name} (${showMark?.date})`} size="lg">
        {showMark&&<AttendanceMarker session={showMark} onClose={()=>setShowMark(null)} onSave={fetch}/>}
      </Modal>
    </div>
  )
}