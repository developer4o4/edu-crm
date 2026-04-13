import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Download, Link } from 'lucide-react'
import { paymentsAPI, studentsAPI, groupsAPI, reportsAPI, downloadBlob } from '../utils/api'
import { Card, Btn, Badge, Spinner, PageHeader, Th, Td, C } from '../components/ui/UI'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const fmt = n => new Intl.NumberFormat('uz-UZ').format(Math.round(n||0))

function PaymentForm({ onSubmit, loading }) {
  const [students,setStudents]=useState([])
  const [groups,setGroups]=useState([])
  const [q,setQ]=useState('')
  const [f,setF]=useState({student:'',group:'',amount:'',payment_type:'cash',month:new Date().toISOString().slice(0,7),description:''})
  const s=(k,v)=>setF(p=>({...p,[k]:v}))
  useEffect(()=>{if(q.length>=2)studentsAPI.list({search:q,page_size:8}).then(r=>{const studentsData=r.data.results||r.data;setStudents(Array.isArray(studentsData)?studentsData:[])})},[q])
  useEffect(()=>{if(f.student)groupsAPI.list({page_size:100}).then(r=>{const groupsData=r.data.results||r.data;setGroups(Array.isArray(groupsData)?groupsData:[])})},[f.student])
  const submit=e=>{e.preventDefault();if(!f.student||!f.amount){toast.error("Majburiy maydonlar");return};onSubmit({...f,amount:Number(f.amount),month:f.month+'-01'})}
  const inp=(label,props)=>(
    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
      <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>{label}</label>
      <input {...props} style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',fontFamily:'inherit',...props.style}}
        onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'}/>
    </div>
  )
  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
      <div>
        <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563',display:'block',marginBottom:'4px'}}>O'quvchi *</label>
        <input placeholder="Ism yoki telefon bilan qidiring..." value={q} onChange={e=>setQ(e.target.value)}
          style={{width:'100%',padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none',marginBottom:'4px',fontFamily:'inherit'}}/>
        {students.length>0&&q&&(
          <div style={{border:'1px solid #e5e7eb',borderRadius:'8px',overflow:'hidden'}}>
            {students.map(st=>(
              <div key={st.id} onClick={()=>{s('student',st.id);setQ(st.full_name);setStudents([])}}
                style={{padding:'10px 12px',cursor:'pointer',fontSize:'13px',display:'flex',justifyContent:'space-between',borderBottom:'1px solid #f9fafb',background:f.student===st.id?'#e1f5ee':'#fff'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'} onMouseLeave={e=>e.currentTarget.style.background=f.student===st.id?'#e1f5ee':'#fff'}>
                <span>{st.full_name}</span><span style={{color:'#9ca3af',fontSize:'12px'}}>{st.phone}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
        <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563'}}>Guruh</label>
        <select value={f.group} onChange={e=>s('group',e.target.value)} style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',background:'#fff',fontFamily:'inherit',outline:'none'}}>
          <option value="">Guruhni tanlang (ixtiyoriy)</option>
          {groups.map(g=><option key={g.id} value={g.id}>{g.name} — {fmt(g.monthly_fee)} UZS/oy</option>)}
        </select>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        {inp("Summa (UZS) *",{type:'number',placeholder:'500000',value:f.amount,onChange:e=>s('amount',e.target.value),min:1})}
        {inp("Oy *",{type:'month',value:f.month,onChange:e=>s('month',e.target.value)})}
      </div>
      <div>
        <label style={{fontSize:'12px',fontWeight:'500',color:'#4b5563',display:'block',marginBottom:'6px'}}>To'lov turi *</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px'}}>
          {[['cash','Naqd'],['card','Karta'],['payme','Payme']].map(([val,lbl])=>(
            <button key={val} type="button" onClick={()=>s('payment_type',val)} style={{padding:'10px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',border:f.payment_type===val?'2px solid #1D9E75':'1px solid #e5e7eb',background:f.payment_type===val?'#e1f5ee':'#fff',color:f.payment_type===val?'#0f6e56':'#374151',fontWeight:f.payment_type===val?'500':'400'}}>{lbl}</button>
          ))}
        </div>
      </div>
      {inp("Izoh",{placeholder:"Ixtiyoriy...",value:f.description,onChange:e=>s('description',e.target.value)})}
      <div style={{display:'flex',justifyContent:'flex-end',paddingTop:'8px',borderTop:'1px solid #f0f0f0'}}>
        <Btn type="submit" primary disabled={loading}>{loading?'Saqlanmoqda...':"To'lovni saqlash"}</Btn>
      </div>
    </form>
  )
}

export default function PaymentsPage() {
  const [payments,setPayments]=useState([])
  const [summary,setSummary]=useState(null)
  const [debtors,setDebtors]=useState([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [typeFilter,setTypeFilter]=useState('')
  const [tab,setTab]=useState('all')
  const [modal,setModal]=useState(false)
  const [saving,setSaving]=useState(false)
  const [exporting,setExporting]=useState(false)

  const fetch=useCallback(async()=>{
    setLoading(true)
    try{
      const p={page_size:30};if(search)p.search=search;if(typeFilter)p.payment_type=typeFilter
      const[pm,sm]=await Promise.all([paymentsAPI.list(p),paymentsAPI.summary()])
      setPayments(pm.data.results||pm.data);setSummary(sm.data)
    }catch{toast.error("Yuklanmadi")}finally{setLoading(false)}
  },[search,typeFilter])

  useEffect(()=>{const t=setTimeout(fetch,search?400:0);return()=>clearTimeout(t)},[fetch])
  useEffect(()=>{if(tab==='debtors')paymentsAPI.debtors().then(r=>setDebtors(r.data.debtors||[]))},[tab])

  const create=async data=>{
    setSaving(true)
    try{await paymentsAPI.create(data);toast.success("Saqlandi");setModal(false);fetch()}
    catch(e){toast.error(e.response?.data?.non_field_errors?.[0]||"Xato")}finally{setSaving(false)}
  }

  const exportExcel=async()=>{
    setExporting(true)
    try{const r=await reportsAPI.paymentsExcel({});downloadBlob(r.data,`payments_${new Date().toISOString().slice(0,10)}.xlsx`);toast.success("Excel yuklab olindi")}
    catch{toast.error("Xato")}finally{setExporting(false)}
  }

  const tabSt=active=>({padding:'10px 16px',fontSize:'13px',cursor:'pointer',border:'none',background:'none',fontFamily:'inherit',fontWeight:active?'500':'400',color:active?'#1D9E75':'#6b7280',borderBottom:active?'2px solid #1D9E75':'2px solid transparent'})

  return (
    <div>
      <PageHeader title="To'lovlar" sub="Moliyaviy boshqaruv" action={
        <div style={{display:'flex',gap:'8px'}}>
          <Btn onClick={exportExcel} disabled={exporting}><Download size={14}/>{exporting?'...':'Excel'}</Btn>
          <Btn primary onClick={()=>setModal(true)}><Plus size={14}/>Yangi to'lov</Btn>
        </div>
      }/>

      {summary&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'20px'}}>
          {[
            {label:"Bugungi tushum",val:`${fmt(summary.today?.amount)} UZS`,sub:`${summary.today?.count||0} ta`},
            {label:"Oylik tushum",val:`${fmt(summary.monthly?.amount)} UZS`,sub:`${summary.monthly?.count||0} ta`,green:true},
            {label:"Yillik tushum",val:`${fmt(summary.yearly?.amount)} UZS`,sub:`${summary.yearly?.count||0} ta`},
            {label:"Payme ulushi",val:`${fmt(summary.by_type?.find(t=>t.type==='payme')?.amount||0)} UZS`,sub:'Online'},
          ].map(item=>(
            <div key={item.label} style={{...C.card,padding:'20px'}}>
              <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>{item.label}</div>
              <div style={{fontSize:'20px',fontWeight:'600',color:item.green?'#1D9E75':'#111827'}}>{item.val}</div>
              <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px'}}>{item.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',borderBottom:'1px solid #f0f0f0',marginBottom:'16px'}}>
        <button style={tabSt(tab==='all')} onClick={()=>setTab('all')}>Barcha to'lovlar</button>
        <button style={tabSt(tab==='debtors')} onClick={()=>setTab('debtors')}>Qarzdorlar</button>
      </div>

      {tab==='all'&&(
        <>
          <div style={{...C.card,padding:'12px',marginBottom:'16px',display:'flex',gap:'12px',flexWrap:'wrap'}}>
            <div style={{position:'relative',flex:1,minWidth:'200px'}}>
              <Search size={14} style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#9ca3af'}}/>
              <input placeholder="O'quvchi ismi..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{width:'100%',padding:'8px 12px 8px 32px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',outline:'none'}}/>
            </div>
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              style={{padding:'8px 12px',borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'13px',background:'#fff',cursor:'pointer',outline:'none'}}>
              <option value="">Barcha tur</option>
              <option value="cash">Naqd</option><option value="card">Karta</option><option value="payme">Payme</option>
            </select>
          </div>
          <Card p="0" style={{overflow:'hidden'}}>
            {loading?<Spinner/>:(
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#fafafa'}}>
                  {["O'quvchi","Guruh","Oy","Summa","Tur","Status","Sana",""].map(h=><Th key={h}>{h}</Th>)}
                </tr></thead>
                <tbody>
                  {payments.map(p=>(
                    <tr key={p.id} style={{borderBottom:'1px solid #f9fafb'}} onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                      <Td style={{fontWeight:'500'}}>{p.student_name}</Td>
                      <Td style={{color:'#6b7280',fontSize:'12px'}}>{p.group_name}</Td>
                      <Td style={{fontSize:'12px',color:'#6b7280'}}>{p.month?new Date(p.month).toLocaleDateString('uz-UZ',{year:'numeric',month:'long'}):'—'}</Td>
                      <Td style={{fontWeight:'600'}}>{fmt(p.amount)}</Td>
                      <Td><Badge color="blue">{p.payment_type_display}</Badge></Td>
                      <Td><Badge color={p.status==='paid'?'green':p.status==='pending'?'amber':'red'}>{p.status_display}</Badge></Td>
                      <Td style={{fontSize:'12px',color:'#9ca3af'}}>{p.paid_at?new Date(p.paid_at).toLocaleDateString('uz-UZ'):'—'}</Td>
                      <Td>{p.payment_type==='payme'&&p.status==='pending'&&<button onClick={async()=>{try{const r=await paymentsAPI.generatePaymeLink(p.id);navigator.clipboard.writeText(r.data.payme_link);toast.success("Nusxalandi")}catch{toast.error("Xato")}}} style={{padding:'5px',border:'none',background:'none',cursor:'pointer',color:'#3b82f6',borderRadius:'6px'}}><Link size={13}/></button>}</Td>
                    </tr>
                  ))}
                  {!payments.length&&<tr><td colSpan={8} style={{padding:'48px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>To'lovlar topilmadi</td></tr>}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {tab==='debtors'&&(
        <Card p="0" style={{overflow:'hidden'}}>
          <div style={{padding:'12px 16px',background:'#fee2e2',borderBottom:'1px solid #fca5a5'}}>
            <span style={{fontSize:'13px',color:'#dc2626',fontWeight:'500'}}>Jami {debtors.length} ta o'quvchi bu oy to'lov qilmagan</span>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#fafafa'}}>{["O'quvchi","Telefon","Guruhlar","Qarzdor oylar"].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {debtors.map(d=>(
                <tr key={d.id} style={{borderBottom:'1px solid #f9fafb'}}>
                  <Td style={{fontWeight:'500',color:'#dc2626'}}>{d.full_name}</Td>
                  <Td style={{color:'#6b7280'}}>{d.phone}</Td>
                  <Td><div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>{d.groups?.map((g,i)=><Badge key={i} color="red">{g}</Badge>)}</div></Td>
                  <Td><Badge color="red">{d.months_unpaid} oy</Badge></Td>
                </tr>
              ))}
              {!debtors.length&&<tr><td colSpan={4} style={{padding:'48px',textAlign:'center',color:'#9ca3af',fontSize:'13px'}}>Qarzdorlar yo'q 🎉</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Yangi to'lov">
        <PaymentForm onSubmit={create} loading={saving}/>
      </Modal>
    </div>
  )
}
