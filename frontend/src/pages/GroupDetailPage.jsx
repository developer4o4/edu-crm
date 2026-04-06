import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Clock, CreditCard, Calendar, UserPlus } from 'lucide-react'
import { groupsAPI } from '../utils/api'
import { Btn, Badge, Spinner, C } from '../components/ui/UI'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))

export default function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    groupsAPI.detail(id).then(r=>setGroup(r.data)).catch(()=>toast.error("Topilmadi")).finally(()=>setLoading(false))
  }, [id])

  if (loading) return <Spinner/>
  if (!group) return <div style={{textAlign:'center',padding:'80px',color:'#9ca3af'}}>Guruh topilmadi</div>

  const g = group
  const card = C.card

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <Btn sm onClick={()=>navigate(-1)}><ArrowLeft size={14}/></Btn>
        <div style={{flex:1}}>
          <h1 style={{fontSize:'20px',fontWeight:'600',color:'#111827',margin:0}}>{g.name}</h1>
          <p style={{fontSize:'13px',color:'#9ca3af',margin:'4px 0 0'}}>{g.course_name}</p>
        </div>
        <Badge color={g.is_active?'green':'gray'}>{g.is_active?'Aktiv':'Tugagan'}</Badge>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px'}}>
        {[
          {icon:Users,label:"O'quvchilar",val:`${g.student_count}/${g.max_students}`},
          {icon:CreditCard,label:"Oylik to'lov",val:`${fmt(g.monthly_fee)} UZS`},
          {icon:Clock,label:"Dars vaqti",val:`${g.start_time?.slice(0,5)}-${g.end_time?.slice(0,5)}`},
          {icon:Calendar,label:"To'lov sanasi",val:`Har oyning ${g.payment_day}-si`},
        ].map(item=>(
          <div key={item.label} style={{...card,padding:'20px'}}>
            <item.icon size={16} color="#9ca3af" style={{marginBottom:'10px'}}/>
            <div style={{fontSize:'11px',color:'#6b7280',marginBottom:'4px'}}>{item.label}</div>
            <div style={{fontSize:'16px',fontWeight:'600',color:'#111827'}}>{item.val}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'16px'}}>
        <div style={{...card,overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{fontSize:'14px',fontWeight:'500',color:'#111827'}}>O'quvchilar ro'yxati</div>
            <Badge color="blue">{g.students?.length||0} ta</Badge>
          </div>
          <div style={{padding:'8px',maxHeight:'400px',overflowY:'auto'}}>
            {g.students?.map(s=>(
              <div key={s.id} onClick={()=>navigate(`/students/${s.id}`)}
                style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'8px',cursor:'pointer',transition:'background .15s',marginBottom:'2px'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#e1f5ee',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'600',color:'#0f6e56',flexShrink:0}}>
                  {s.full_name?.[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#111827'}}>{s.full_name}</div>
                  <div style={{fontSize:'11px',color:'#9ca3af'}}>{s.phone}</div>
                </div>
                {s.discount_percent>0&&<Badge color="amber">{s.discount_percent}% chegirma</Badge>}
              </div>
            ))}
            {!g.students?.length&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'48px',color:'#9ca3af'}}>
                <UserPlus size={32} style={{opacity:0.2,marginBottom:'8px'}}/>
                <p style={{fontSize:'13px'}}>Guruhda o'quvchilar yo'q</p>
              </div>
            )}
          </div>
        </div>

        <div style={{...card,padding:'20px'}}>
          <div style={{fontSize:'14px',fontWeight:'500',color:'#111827',marginBottom:'16px'}}>Guruh ma'lumotlari</div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {[
              ["O'qituvchi",g.teacher_name||'—'],
              ["Kurs",g.course_name],
              ["Dars kunlari",g.day_type],
              ["Xona",g.room||'—'],
              ["Boshlanish",g.start_date?new Date(g.start_date).toLocaleDateString('uz-UZ'):'—'],
            ].map(([k,v])=>(
              <div key={k}>
                <div style={{fontSize:'11px',color:'#6b7280',marginBottom:'2px'}}>{k}</div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#111827'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
