import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import Dashboard     from './components/Dashboard.jsx'
import NewRequest    from './components/NewRequest.jsx'
import RequestStatus from './components/RequestStatus.jsx'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
      <div className="spinner spinner-lg" />
    </div>
  )

  if (!session) return <BrowserRouter><LoginPage /></BrowserRouter>

  const user = {
    id:    session.user.id,
    email: session.user.email,
    name:  session.user.user_metadata?.full_name || session.user.email,
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Header user={user} />
        <main style={{ flex:1 }}>
          <Routes>
            <Route path="/"            element={<Dashboard     user={user} />} />
            <Route path="/new"         element={<NewRequest    user={user} />} />
            <Route path="/request/:id" element={<RequestStatus user={user} />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer style={{ background:'var(--primary)', color:'rgba(255,255,255,.5)', textAlign:'center', padding:'12px 24px', fontSize:11 }}>
          Coffee Finance Approval Management &nbsp;|&nbsp; Powered by Felicity Global Capital Pte. Ltd.
        </footer>
      </div>
    </BrowserRouter>
  )
}

function Header({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'
  const isActive = p => location.pathname === p

  return (
    <header style={{ background:'var(--primary)', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(46,45,156,.3)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width:32, height:32, background:'rgba(255,255,255,.15)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontWeight:900, fontSize:18 }}>CF</span>
          </div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:14, letterSpacing:'.06em' }}>COFFEE FINANCE</div>
            <div style={{ color:'var(--accent)', fontSize:10, letterSpacing:'.06em', textTransform:'uppercase' }}>Approval Management</div>
          </div>
        </div>
        <nav style={{ display:'flex', gap:4, flex:1, marginLeft:12 }}>
          {[['/', 'My Requests'], ['/new', '+ New Request']].map(([path, label]) => (
            <button key={path} onClick={() => navigate(path)}
              style={{ background: isActive(path) ? 'rgba(255,255,255,.15)' : 'transparent', border:'none', color: isActive(path) ? '#fff' : 'rgba(255,255,255,.75)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, padding:'6px 12px', borderRadius:6, cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(110,141,224,.35)', color:'#fff', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', textTransform:'uppercase' }}>{initials}</div>
          <div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{user.name}</div>
            <div style={{ color:'var(--accent)', fontSize:10 }}>{user.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color:'rgba(255,255,255,.7)', borderColor:'rgba(255,255,255,.2)', marginLeft:8 }}
            onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </div>
    </header>
  )
}

function LoginPage() {
  const [mode,     setMode]     = useState('login')  // 'login' | 'forgot'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState(null)
  const [error,    setError]    = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
        setMessage('Password reset email sent. Please check your inbox.')
      }
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#2E2D9C 0%,#1a1960 40%,#0d0c4a 100%)', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:20, padding:'44px 40px', maxWidth:400, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.3)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginBottom:24 }}>
          <div style={{ width:46, height:46, background:'#2E2D9C', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#fff', fontWeight:900, fontSize:22 }}>CF</span>
          </div>
          <div>
            <div style={{ color:'#2E2D9C', fontWeight:900, fontSize:17, letterSpacing:'.08em' }}>COFFEE FINANCE</div>
            <div style={{ color:'#6E8DE0', fontSize:10, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>Approval Management</div>
          </div>
        </div>
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,#6E8DE0 30%,#2E2D9C 50%,#6E8DE0 70%,transparent)', marginBottom:24 }} />

        <h2 style={{ fontSize:18, fontWeight:800, color:'#1F2937', marginBottom:4, textAlign:'center' }}>
          {mode === 'login' ? 'Sign In' : 'Reset Password'}
        </h2>
        <p style={{ fontSize:12, color:'#6B7280', textAlign:'center', marginBottom:20 }}>
          {mode === 'login' ? 'Submit and track approval requests with FGC' : 'Enter your email to reset your password'}
        </p>

        {error   && <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
        {message && <div style={{ background:'#D1FAE5', color:'#059669', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>✅ {message}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, marginBottom:5, color:'#1F2937' }}>Email</label>
            <input type="email" className="form-input" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          {mode === 'login' && (
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, marginBottom:5, color:'#1F2937' }}>Password</label>
              <input type="password" className="form-input" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width:14, height:14, borderWidth:2 }}/> Loading…</> :
              mode === 'login' ? 'Sign In →' : 'Send Reset Email →'}
          </button>
        </form>

        <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'#6B7280' }}>
          {mode === 'login' ? (
            <button onClick={()=>{setMode('forgot');setError(null);setMessage(null)}} style={{ background:'none', border:'none', color:'#2E2D9C', fontWeight:700, cursor:'pointer' }}>
              Forgot password?
            </button>
          ) : (
            <button onClick={()=>{setMode('login');setError(null);setMessage(null)}} style={{ background:'none', border:'none', color:'#2E2D9C', fontWeight:700, cursor:'pointer' }}>
              ← Back to Sign In
            </button>
          )}
        </div>

        {/* Invite-only notice */}
        <div style={{ marginTop:20, padding:'12px 14px', background:'#F5F6FC', borderRadius:8, borderLeft:'3px solid #6E8DE0', fontSize:12, color:'#6B7280', lineHeight:1.6 }}>
          🔒 <strong>Invitation only.</strong> Access is granted by Felicity Global Capital. Contact your FGC representative if you need an account.
        </div>

        <p style={{ marginTop:16, fontSize:11, color:'#9CA3AF', textAlign:'center', lineHeight:1.5 }}>
          Powered by Felicity Global Capital Pte. Ltd.
        </p>
      </div>
    </div>
  )
}
