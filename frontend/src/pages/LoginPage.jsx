import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore(s => s.login)
  const [form, setForm] = useState({ username:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const f = (k,v) => setForm(p=>({...p,[k]:v}))

  const submit = async e => {
    e.preventDefault()

    if (!form.username || !form.password) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }

    setLoading(true)

    try {
      const res = await login(form)

      const user = res.user

      toast.success("Xush kelibsiz!")

      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }

    } catch (err) {
      toast.error(err.response?.data?.error || "Login yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  const inp = (type, placeholder, val, onChange, extra={}) => (
    <input type={type} placeholder={placeholder} value={val} onChange={onChange}
      style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #e5e7eb', fontSize:'14px', outline:'none', fontFamily:'inherit', ...extra }}
      onFocus={e=>e.target.style.borderColor='#1D9E75'} onBlur={e=>e.target.style.borderColor='#e5e7eb'} />
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Left panel */}
      <div style={{ width:'45%', background:'#1D9E75', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'40px', background:'rgba(255,255,255,0.2)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <GraduationCap size={22} color="white" />
          </div>
          <span style={{ color:'white', fontWeight:'600', fontSize:'18px' }}>EduCRM Pro</span>
        </div>
        <div>
          <h1 style={{ fontSize:'36px', fontWeight:'600', color:'white', lineHeight:'1.3', margin:'0 0 16px' }}>
            O'quv markazingizni<br/>to'liq boshqaring
          </h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'15px', lineHeight:'1.7', margin:'0 0 40px' }}>
            O'quvchilar, guruhlar, to'lovlar, davomat — hammasi bir joyda.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {[['100%',"Avtomatlashtirilgan"],['SMS','Avtomatik eslatma'],['Payme',"Online to'lov"],['Excel','Hisobot export']].map(([v,l])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.15)', borderRadius:'12px', padding:'16px' }}>
                <div style={{ fontSize:'22px', fontWeight:'600', color:'white' }}>{v}</div>
                <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.7)', marginTop:'4px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>© 2026 EduCRM Pro</div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'#f9fafb' }}>
        <div style={{ width:'100%', maxWidth:'360px' }}>
          <h2 style={{ fontSize:'26px', fontWeight:'600', color:'#111827', margin:'0 0 6px' }}>Kirish</h2>
          <p style={{ fontSize:'14px', color:'#6b7280', margin:'0 0 32px' }}>Hisobingizga kiring</p>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ fontSize:'12px', fontWeight:'500', color:'#4b5563', display:'block', marginBottom:'6px' }}>Foydalanuvchi nomi</label>
              {inp('text','username',form.username,e=>f('username',e.target.value),{autoFocus:true})}
            </div>
            <div>
              <label style={{ fontSize:'12px', fontWeight:'500', color:'#4b5563', display:'block', marginBottom:'6px' }}>Parol</label>
              <div style={{ position:'relative' }}>
                {inp(showPass?'text':'password','••••••••',form.password,e=>f('password',e.target.value),{paddingRight:'40px'})}
                <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', border:'none', background:'none', cursor:'pointer', color:'#9ca3af' }}>
                  {showPass?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ padding:'11px', borderRadius:'8px', background:'#1D9E75', color:'white', border:'none', fontSize:'14px', fontWeight:'500', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, marginTop:'4px', fontFamily:'inherit' }}>
              {loading?'Kirilmoqda...':'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
