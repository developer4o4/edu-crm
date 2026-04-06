import { useState } from 'react'
import { BarChart3, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportsAPI, downloadBlob } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, C } from '../components/ui/UI'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))

export default function ReportsPage() {
  const [activeReport,setActiveReport]=useState('income')
  const [year,setYear]=useState(new Date().getFullYear())
  const [dateFrom,setDateFrom]=useState('')
  const [dateTo,setDateTo]=useState('')
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(false)
  const [exporting,setExporting]=useState(false)

  const REPORTS=[
    {key:'income',label:'Oylik daromad'},
    {key:'payments',label:"To'lovlar"},
    {key:'attendance',label:'Davomat'},
  ]

  const fetch=async()=>{
    setLoading(true)
    try{
      let r
      if(activeReport==='income')r=await reportsAPI.income({year})
      else if(activeReport==='payments')r=await reportsAPI.payments({date_from:dateFrom,date_to:dateTo})
      else r=await reportsAPI.attendance({date_from:dateFrom,date_to:dateTo})
      setData(r.data)
    }catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  }

  const exportExcel=async()=>{
    setExporting(true)
    try{
      let r
      const name=`${activeReport}_${new Date().toISOString().slice(0,10)}.xlsx`
      if(activeReport==='income')r=await reportsAPI.incomeExcel({year})
      else if(activeReport==='payments')r=await reportsAPI.paymentsExcel({date_from:dateFrom,date_to:dateTo})
      else r=await reportsAPI.attendanceExcel({date_from:dateFrom,date_to:dateTo})
      downloadBlob(r.data,name);toast.success("Excel yuklab olindi")
    }catch{toast.error("Xato")}finally{setExporting(false)}
  }

  const inp=(label,props)=>(
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>{label}</label>
      <input {...props} style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',fontFamily:'inherit'}}/>
    </div>
  )

  return (
    <div>
      <PageHeader title="Hisobotlar" sub="Excel export va tahlil" action={data&&<Btn primary onClick={exportExcel} disabled={exporting}><Download size={14}/>{exporting?'...':'Excel yuklab olish'}</Btn>}/>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
        {REPORTS.map(r=>(
          <button key={r.key} onClick={()=>{setActiveReport(r.key);setData(null)}} style={{
            ...C.card, padding:'16px', display:'flex',alignItems:'center',gap:'12px',cursor:'pointer',border:'none',fontFamily:'inherit',
            outline: activeReport===r.key?'2px solid #1D9E75':'none',background:activeReport===r.key?'#f0fdf8':'#fff'
          }}>
            <BarChart3 size={20} color={activeReport===r.key?'#1D9E75':'#9ca3af'}/>
            <span style={{fontSize:'14px',fontWeight:'500',color:activeReport===r.key?'#0f6e56':'#374151'}}>{r.label}</span>
          </button>
        ))}
      </div>

      <div style={{...C.card,padding:'16px',marginBottom:'20px',display:'flex',flexWrap:'wrap',gap:'16px',alignItems:'flex-end'}}>
        {activeReport==='income'?(
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>Yil</label>
            <select value={year} onChange={e=>setYear(e.target.value)} style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',background:'#fff',outline:'none',minWidth:'120px'}}>
              {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ):(
          <>
            {inp("Boshlang'ich sana",{type:'date',value:dateFrom,onChange:e=>setDateFrom(e.target.value)})}
            {inp("Yakuniy sana",{type:'date',value:dateTo,onChange:e=>setDateTo(e.target.value)})}
          </>
        )}
        <Btn primary onClick={fetch} disabled={loading}><BarChart3 size={14}/>{loading?'Yuklanmoqda...':'Hisobotni olish'}</Btn>
      </div>

      {loading&&<Spinner/>}

      {!loading&&data&&activeReport==='income'&&(
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
            {[
              {label:"Yillik jami",val:`${fmt(data.yearly_total)} UZS`,green:true},
              {label:"O'rtacha oylik",val:`${fmt((data.yearly_total||0)/Math.max(data.monthly?.length||1,1))} UZS`},
              {label:"Eng yuqori oy",val:`${fmt(Math.max(...(data.monthly||[]).map(m=>m.total),0))} UZS`},
            ].map(item=>(
              <div key={item.label} style={{...C.card,padding:'20px'}}>
                <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>{item.label}</div>
                <div style={{fontSize:'20px',fontWeight:'600',color:item.green?'#1D9E75':'#111827'}}>{item.val}</div>
              </div>
            ))}
          </div>
          <div style={{...C.card,padding:'20px'}}>
            <div style={{fontSize:'14px',fontWeight:'500',color:'#111827',marginBottom:'16px'}}>{year} yil oylik daromad</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthly||[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#9ca3af'}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000000).toFixed(0)}M`}/>
                <Tooltip formatter={v=>[`${fmt(v)} UZS`,'Daromad']} contentStyle={{fontSize:12,borderRadius:8,border:'1px solid #f0f0f0'}}/>
                <Bar dataKey="total" fill="#1D9E75" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Card p="0" style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#fafafa'}}>{["Oy","Daromad (UZS)","Tranzaksiyalar","O'rtacha (UZS)"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {data.monthly?.map(m=>(
                  <tr key={m.month_num} style={{borderBottom:'1px solid #f9fafb'}}>
                    <Td style={{fontWeight:'500'}}>{m.month}</Td>
                    <Td style={{fontWeight:'600',color:'#1D9E75'}}>{fmt(m.total)}</Td>
                    <Td style={{color:'#6b7280'}}>{m.count}</Td>
                    <Td style={{color:'#6b7280'}}>{m.count?fmt(m.total/m.count):'—'}</Td>
                  </tr>
                ))}
                <tr style={{background:'#f0fdf8'}}>
                  <Td style={{fontWeight:'700',color:'#0f6e56'}}>JAMI</Td>
                  <Td style={{fontWeight:'700',color:'#0f6e56'}}>{fmt(data.yearly_total)}</Td>
                  <Td style={{fontWeight:'600'}}>{data.monthly?.reduce((s,m)=>s+m.count,0)}</Td>
                  <Td/>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {!loading&&data&&activeReport==='payments'&&(
        <Card p="0" style={{overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',gap:'16px',alignItems:'center'}}>
            <span style={{fontSize:'13px',fontWeight:'500'}}>{data.count} ta to'lov</span>
            <span style={{fontSize:'13px',fontWeight:'600',color:'#1D9E75'}}>Jami: {fmt(data.total_amount)} UZS</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#fafafa'}}>{["O'quvchi","Guruh","Summa","Tur","Sana"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {data.payments?.map(p=>(
                <tr key={p.id} style={{borderBottom:'1px solid #f9fafb'}}>
                  <Td style={{fontWeight:'500'}}>{p.student}</Td>
                  <Td style={{color:'#6b7280',fontSize:'12px'}}>{p.group}</Td>
                  <Td style={{fontWeight:'600'}}>{fmt(p.amount)}</Td>
                  <Td><Badge color="blue">{p.payment_type}</Badge></Td>
                  <Td style={{fontSize:'12px',color:'#9ca3af'}}>{p.paid_at}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading&&data&&activeReport==='attendance'&&(
        <Card p="0" style={{overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#fafafa'}}>{["Sana","Guruh","Mavzu","Jami","Keldi","Kelmadi","%"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {data.sessions?.map((s,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f9fafb'}}>
                  <Td style={{fontSize:'12px'}}>{s.date}</Td>
                  <Td><Badge color="blue">{s.group}</Badge></Td>
                  <Td style={{color:'#6b7280',fontSize:'12px'}}>{s.topic||'—'}</Td>
                  <Td>{s.total}</Td>
                  <Td style={{color:'#0f6e56',fontWeight:'600'}}>{s.present}</Td>
                  <Td style={{color:'#ef4444',fontWeight:'600'}}>{s.absent}</Td>
                  <Td><Badge color={s.total&&s.present/s.total>=0.8?'green':s.total&&s.present/s.total>=0.6?'amber':'red'}>{s.total?Math.round(s.present/s.total*100):0}%</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading&&!data&&(
        <div style={{...C.card,display:'flex',flexDirection:'column',alignItems:'center',padding:'80px',color:'#9ca3af'}}>
          <BarChart3 size={48} style={{opacity:0.15,marginBottom:'12px'}}/>
          <p style={{fontSize:'14px'}}>Parametrlarni tanlang va "Hisobotni olish" ni bosing</p>
        </div>
      )}
    </div>
  )
}
