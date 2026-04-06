import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxW = { sm:'400px', md:'560px', lg:'720px', xl:'900px' }[size] || '560px'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)' }} />
      <div style={{ position:'relative', background:'#fff', borderRadius:'16px', width:'100%', maxWidth:maxW, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f0f0f0', flexShrink:0 }}>
          <h3 style={{ margin:0, fontSize:'15px', fontWeight:'600', color:'#111827' }}>{title}</h3>
          <button onClick={onClose} style={{ padding:'6px', border:'none', background:'none', cursor:'pointer', color:'#9ca3af', borderRadius:'6px' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding:'20px', overflowY:'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
