import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, AlertCircle, CreditCard, TrendingUp, BookOpen } from 'lucide-react'
import { dashboardAPI } from '../utils/api'
import { StatCard, C } from '../components/ui/UI'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))
const card = C.card

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([dashboardAPI.stats(), dashboardAPI.activity()])
      .then(([s,a]) => { setData(s.data); setActivity(a.data.activities||[]) })
      .catch(() => toast.error("Ma'lumot yuklanmadi"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
      <div style={{ width:'32px', height:'32px', border:'3px solid #1D9E75', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const s = data?.summary || {}
  const dotC = { green:'#1D9E75', blue:'#3b82f6', amber:'#f59e0b', red:'#ef4444' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div>
        <h1 style={{ fontSize:'20px', fontWeight:'600', color:'#111827', margin:0 }}>Dashboard</h1>
        <p style={{ fontSize:'13px', color:'#9ca3af', margin:'4px 0 0' }}>{new Date().toLocaleDateString('uz-UZ',{year:'numeric',month:'long',day:'numeric'})}</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
        <StatCard icon={Users} label="Jami o'quvchilar" value={s.total_students??0} badge="+0 bu oy" badgeColor="green"/>
        <StatCard icon={UserCheck} label="Aktiv o'quvchilar" value={s.active_students??0} badge={`${s.total_students?Math.round((s.active_students/s.total_students)*100):0}%`} badgeColor="blue"/>
        <StatCard icon={AlertCircle} label="Qarzdorlar" value={s.debtors_count??0} badge={s.debtors_count>0?'Diqqat':'Yaxshi'} badgeColor={s.debtors_count>0?'red':'green'}/>
        <StatCard icon={CreditCard} label="Bugungi to'lov" value={fmt(s.today_payments_amount)} sub={`${s.today_payments_count||0} ta tranzaksiya`} badge="Bugun" badgeColor="amber"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        <StatCard icon={TrendingUp} label="Oylik tushum" value={`${fmt(s.monthly_income)} UZS`} badgeColor="green"/>
        <StatCard icon={TrendingUp} label="Yillik tushum" value={`${fmt(s.yearly_income)} UZS`} badgeColor="blue"/>
        <StatCard icon={BookOpen} label="Aktiv guruhlar" value={s.total_groups??0} badgeColor="green"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'16px' }}>
        <div style={{ ...card, padding:'20px' }}>
          <div style={{ fontSize:'14px', fontWeight:'500', color:'#111827', marginBottom:'16px' }}>Oylik daromad (UZS)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthly_chart||[]}>
              <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1D9E75" stopOpacity={0.15}/><stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000000).toFixed(0)}M`}/>
              <Tooltip formatter={v=>[`${fmt(v)} UZS`]} contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #f0f0f0'}}/>
              <Area type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} fill="url(#g1)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...card, padding:'20px' }}>
          <div style={{ fontSize:'14px', fontWeight:'500', color:'#111827', marginBottom:'16px' }}>Yangi o'quvchilar</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.new_students_chart||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #f0f0f0'}}/>
              <Bar dataKey="count" fill="#378ADD" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:'16px' }}>
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #f0f0f0', fontSize:'14px', fontWeight:'500', color:'#111827' }}>So'nggi to'lovlar</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{background:'#fafafa'}}>
              {["O'quvchi","Guruh","Summa","Tur","Status"].map(h=><th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:'11px',fontWeight:'500',color:'#6b7280',textTransform:'uppercase',borderBottom:'1px solid #f0f0f0'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {(data?.recent_payments||[]).slice(0,6).map(p=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f9fafb'}}>
                  <td style={{padding:'11px 16px',fontSize:'13px',fontWeight:'500',color:'#111827'}}>{p.student_name}</td>
                  <td style={{padding:'11px 16px',fontSize:'12px',color:'#6b7280'}}>{p.group_name}</td>
                  <td style={{padding:'11px 16px',fontSize:'13px',fontWeight:'600'}}>{fmt(p.amount)}</td>
                  <td style={{padding:'11px 16px'}}><span style={{background:'#eff6ff',color:'#1d4ed8',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:'500'}}>{p.payment_type_display}</span></td>
                  <td style={{padding:'11px 16px'}}><span style={{background:p.status==='paid'?'#e1f5ee':'#fffbeb',color:p.status==='paid'?'#0f6e56':'#b45309',padding:'2px 8px',borderRadius:'999px',fontSize:'11px',fontWeight:'500'}}>{p.status_display}</span></td>
                </tr>
              ))}
              {!data?.recent_payments?.length&&<tr><td colSpan={5} style={{padding:'32px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>To'lovlar yo'q</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ ...card, padding:'20px' }}>
          <div style={{ fontSize:'14px', fontWeight:'500', color:'#111827', marginBottom:'16px' }}>So'nggi faoliyat</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {activity.slice(0,7).map((item,i)=>(
              <div key={i} style={{display:'flex',gap:'12px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:dotC[item.icon]||'#9ca3af',flexShrink:0,marginTop:'5px'}}/>
                <div>
                  <p style={{fontSize:'12px',color:'#374151',lineHeight:'1.5',margin:0}}>{item.text}</p>
                  <p style={{fontSize:'11px',color:'#9ca3af',margin:'2px 0 0'}}>{item.time_display}</p>
                </div>
              </div>
            ))}
            {!activity.length&&<p style={{fontSize:'13px',color:'#9ca3af',textAlign:'center',padding:'16px 0'}}>Faoliyat yo'q</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
