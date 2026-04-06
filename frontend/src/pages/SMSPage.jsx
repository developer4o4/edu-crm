import { useState, useEffect } from 'react'
import { Send, CheckCircle, XCircle, Clock } from 'lucide-react'
import { smsAPI } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, C } from '../components/ui/UI'
import toast from 'react-hot-toast'

const STATUS={sent:{l:'Yuborildi',c:'green'},delivered:{l:'Yetkazildi',c:'green'},failed:{l:'Xato',c:'red'},pending:{l:'Kutilmoqda',c:'amber'}}
const TYPES={payment_reminder:{l:"To'lov eslatma",c:'amber'},debt_reminder:{l:'Qarz eslatma',c:'red'},manual:{l:"Qo'lda",c:'blue'},welcome:{l:'Xush kelibsiz',c:'green'},custom:{l:'Boshqa',c:'gray'}}

export default function SMSPage() {
  const [logs,setLogs]=useState([])
  const [loading,setLoading]=useState(true)
  const [phone,setPhone]=useState('+998')
  const [message,setMessage]=useState('')
  const [sending,setSending]=useState(false)
  const [typeFilter,setTypeFilter]=useState('')

  const fetch=async()=>{
    setLoading(true)
    try{const p={page_size:50};if(typeFilter)p.sms_type=typeFilter;const r=await smsAPI.logs(p);setLogs(r.data.results||r.data)}
    catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  }

  useEffect(()=>{fetch()},[typeFilter])

  const send=async e=>{
    e.preventDefault()
    if(!phone||!message.trim()){toast.error("Telefon va xabar kiriting");return}
    if(message.length>160){toast.error("160 belgidan oshmasligi kerak");return}
    setSending(true)
    try{await smsAPI.send({phone,message});toast.success("SMS yuborildi");setMessage('');setTimeout(fetch,1500)}
    catch{toast.error("Xato")}finally{setSending(false)}
  }

  const stats={total:logs.length,sent:logs.filter(l=>['sent','delivered'].includes(l.status)).length,failed:logs.filter(l=>l.status==='failed').length}

  const inp=(label,props)=>(
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>{label}</label>
      <input {...props} style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',fontFamily:'inherit',...props.style}}
        onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
    </div>
  )

  return (
    <div>
      <PageHeader title="SMS Boshqaruv" sub="Avtomatik va qo'lda SMS yuborish"/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'20px'}}>
        {[{label:'Jami yuborilgan',val:stats.total,c:'#111827'},{label:'Muvaffaqiyatli',val:stats.sent,c:'#1D9E75'},{label:'Xato',val:stats.failed,c:'#ef4444'}].map(s=>(
          <div key={s.label} style={{...C.card,padding:'20px',textAlign:'center'}}>
            <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>{s.label}</div>
            <div style={{fontSize:'28px',fontWeight:'600',color:s.c}}>{s.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 3fr',gap:'16px'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <Card p="20px">
            <div style={{fontSize:'14px',fontWeight:'500',color:'#111827',marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
              <Send size={16} color="#1D9E75"/>Qo'lda SMS yuborish
            </div>
            <form onSubmit={send} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              {inp("Telefon raqam",{placeholder:"+998901234567",value:phone,onChange:e=>setPhone(e.target.value)})}
              <div>
                <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563',display:'block',marginBottom:'4px'}}>Xabar</label>
                <textarea value={message} onChange={e=>setMessage(e.target.value)} maxLength={160} rows={5}
                  style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',resize:'none',fontFamily:'inherit'}}/>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
                  <span style={{fontSize:'11px',color:'#9ca3af'}}>Maks 160 belgi</span>
                  <span style={{fontSize:'11px',color:message.length>140?'#ef4444':'#9ca3af'}}>{message.length}/160</span>
                </div>
              </div>
              <div>
                <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'6px'}}>Tezkor shablonlar:</p>
                {["Hurmatli o'quvchi, bugun to'lov sanangiz. Iltimos to'lovni amalga oshiring.","Kurs jadvaliga o'zgartirish kiritildi. Batafsil ma'lumot uchun markaz bilan bog'laning."].map((t,i)=>(
                  <div key={i} onClick={()=>setMessage(t)} style={{padding:'8px 10px',borderRadius:'8px',border:'1px solid #f0f0f0',cursor:'pointer',fontSize:'12px',color:'#4b5563',marginBottom:'4px',lineHeight:'1.4'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    {t.slice(0,60)}...
                  </div>
                ))}
              </div>
              <Btn type="submit" primary disabled={sending} style={{justifyContent:'center'}}>
                <Send size={14}/>{sending?'Yuborilmoqda...':'Yuborish'}
              </Btn>
            </form>
          </Card>

          <Card p="16px" style={{background:'#f0fdf8',border:'1px solid #9FE1CB'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#0f6e56',marginBottom:'10px'}}>Avtomatik SMS jadval</div>
            {[['09:00',"To'lov sanasi bo'lgan guruhlarga eslatma"],['10:00','Qarzdorlarga eslatma SMS'],['Doimiy',"Yangi o'quvchiga xush kelibsiz"]].map(([t,l])=>(
              <div key={t} style={{display:'flex',alignItems:'flex-start',gap:'8px',marginBottom:'8px'}}>
                <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#1D9E75',flexShrink:0,marginTop:'5px'}}/>
                <span style={{fontSize:'12px',color:'#0f6e56'}}><b>{t}</b> — {l}</span>
              </div>
            ))}
          </Card>
        </div>

        <Card p="0" style={{overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontSize:'14px',fontWeight:'500',color:'#111827',flex:1}}>SMS tarixi</span>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              style={{padding:'6px 10px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px',background:'#fff',cursor:'pointer',outline:'none'}}>
              <option value="">Barcha turlar</option>
              {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
            </select>
          </div>
          {loading?<Spinner/>:(
            <div style={{maxHeight:'520px',overflowY:'auto'}}>
              {logs.map(log=>{
                const sc=STATUS[log.status]||STATUS.pending
                const tc=TYPES[log.sms_type]||TYPES.custom
                return (
                  <div key={log.id} style={{padding:'12px 16px',borderBottom:'1px solid #f9fafb'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px',flexWrap:'wrap'}}>
                          <span style={{fontSize:'13px',fontWeight:'500',color:'#111827'}}>{log.phone}</span>
                          {log.student_name&&<span style={{fontSize:'12px',color:'#6b7280'}}>({log.student_name})</span>}
                          <Badge color={tc.c}>{tc.l}</Badge>
                        </div>
                        <p style={{fontSize:'12px',color:'#4b5563',lineHeight:'1.4',margin:'0 0 4px',overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{log.message}</p>
                        <p style={{fontSize:'11px',color:'#9ca3af',margin:0}}>{log.sent_at?new Date(log.sent_at).toLocaleString('uz-UZ'):new Date(log.created_at).toLocaleString('uz-UZ')}</p>
                      </div>
                      <Badge color={sc.c}>{sc.l}</Badge>
                    </div>
                  </div>
                )
              })}
              {!logs.length&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'64px',color:'#9ca3af'}}>
                <Send size={32} style={{opacity:0.15,marginBottom:'12px'}}/>
                <p style={{fontSize:'13px'}}>SMS tarixi yo'q</p>
              </div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
