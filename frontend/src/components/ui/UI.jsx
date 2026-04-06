// Shared inline-style components — no Tailwind dependency

export const C = {
  card: { background:'#fff', borderRadius:'12px', border:'1px solid #f0f0f0', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' },
  badge: { green:{bg:'#e1f5ee',text:'#0f6e56'}, red:{bg:'#fee2e2',text:'#dc2626'}, blue:{bg:'#eff6ff',text:'#1d4ed8'}, amber:{bg:'#fffbeb',text:'#b45309'}, gray:{bg:'#f3f4f6',text:'#4b5563'} },
}

export function Card({ children, style={}, p='20px' }) {
  return <div style={{ ...C.card, padding:p, ...style }}>{children}</div>
}

export function Badge({ children, color='gray' }) {
  const c = C.badge[color] || C.badge.gray
  return <span style={{ background:c.bg, color:c.text, padding:'2px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:'500', display:'inline-flex', alignItems:'center' }}>{children}</span>
}

export function Btn({ children, onClick, primary, danger, sm, disabled, style={}, type='button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display:'inline-flex', alignItems:'center', gap:'6px',
      padding: sm ? '5px 10px' : '8px 16px',
      borderRadius:'8px', fontSize: sm ? '12px' : '13px', fontWeight:'500',
      cursor: disabled ? 'not-allowed' : 'pointer', border:'1px solid',
      opacity: disabled ? 0.5 : 1, transition:'all .15s', fontFamily:'inherit',
      background: primary ? '#1D9E75' : danger ? '#ef4444' : '#fff',
      color: primary ? '#fff' : danger ? '#fff' : '#374151',
      borderColor: primary ? '#1D9E75' : danger ? '#ef4444' : '#e5e7eb',
      ...style
    }}>{children}</button>
  )
}

export function Inp({ label, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      {label && <label style={{ fontSize:'12px', fontWeight:'500', color:'#4b5563' }}>{label}</label>}
      <input {...props} style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'13px', outline:'none', fontFamily:'inherit', ...props.style }}
        onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
    </div>
  )
}

export function Sel({ label, children, ...props }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      {label && <label style={{ fontSize:'12px', fontWeight:'500', color:'#4b5563' }}>{label}</label>}
      <select {...props} style={{ width:'100%', padding:'8px 12px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'13px', background:'#fff', cursor:'pointer', outline:'none', fontFamily:'inherit', ...props.style }}>{children}</select>
    </div>
  )
}

export function Th({ children }) {
  return <th style={{ padding:'10px 16px', textAlign:'left', fontSize:'11px', fontWeight:'500', color:'#6b7280', textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{children}</th>
}

export function Td({ children, style={} }) {
  return <td style={{ padding:'12px 16px', fontSize:'13px', color:'#374151', borderBottom:'1px solid #f9fafb', ...style }}>{children}</td>
}

export function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'60px' }}>
      <div style={{ width:'28px', height:'28px', border:'3px solid #1D9E75', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function PageHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px' }}>
      <div>
        <h1 style={{ fontSize:'20px', fontWeight:'600', color:'#111827', margin:0 }}>{title}</h1>
        {sub && <p style={{ fontSize:'13px', color:'#9ca3af', margin:'4px 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ icon:Icon, label, value, badge, badgeColor='green', sub }) {
  const bc = C.badge[badgeColor] || C.badge.green
  return (
    <div style={{ ...C.card, padding:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
        <div style={{ width:'36px', height:'36px', background:'#f9fafb', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {Icon && <Icon size={18} color="#6b7280" />}
        </div>
        {badge && <span style={{ background:bc.bg, color:bc.text, padding:'2px 10px', borderRadius:'999px', fontSize:'11px', fontWeight:'500' }}>{badge}</span>}
      </div>
      <div style={{ fontSize:'22px', fontWeight:'600', color:'#111827' }}>{value}</div>
      <div style={{ fontSize:'12px', color:'#6b7280', marginTop:'4px' }}>{label}</div>
      {sub && <div style={{ fontSize:'11px', color:'#9ca3af', marginTop:'2px' }}>{sub}</div>}
    </div>
  )
}
