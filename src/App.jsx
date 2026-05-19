import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useMsal, MsalProvider } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { loginRequest } from './authConfig.js'
import { supabase } from './supabaseClient.js'
import Dashboard     from './components/Dashboard.jsx'
import NewRequest    from './components/NewRequest.jsx'
import RequestStatus from './components/RequestStatus.jsx'
import apiLogo from './assets/APILogo.avif'
import fgcLogo from './assets/logo_color.svg'

// Dual-auth: supports both MSAL (FGC M365) and Supabase (email/password)
export default function App() {
  const [supaSession, setSupaSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSupaSession(data.session ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSupaSession(s ?? null))
    return () => subscription.unsubscribe()
  }, [])

  return <AppInner supaSession={supaSession} setSupaSession={setSupaSession} />
}

function AppInner({ supaSession, setSupaSession }) {
  const { instance, accounts, inProgress } = useMsal()

  // MSAL user (FGC M365)
  const msalUser = accounts.length > 0 ? {
    id:    accounts[0].homeAccountId,
    email: accounts[0].username,
    name:  accounts[0].name || accounts[0].username,
    via:   'msal',
  } : null

  // Supabase user (email/password)
  const supaUser = supaSession ? {
    id:    supaSession.user.id,
    email: supaSession.user.email,
    name:  supaSession.user.user_metadata?.full_name || supaSession.user.email,
    via:   'supabase',
  } : null

  const user = msalUser || supaUser

  // Still loading
  if (supaSession === undefined || (inProgress !== InteractionStatus.None && !user)) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
        <div className="spinner spinner-lg" />
        <p style={{ fontSize:13, color:'var(--muted)' }}>Loading…</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    if (msalUser) {
      await instance.logoutPopup()
    } else {
      await supabase.auth.signOut()
    }
  }

  if (!user) return (
    <BrowserRouter>
      <LoginPage onSupaSession={setSupaSession} />
    </BrowserRouter>
  )

  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Header user={user} onSignOut={handleSignOut} />
        <main style={{ flex:1 }}>
          <Routes>
            <Route path="/"            element={<Dashboard     user={user} />} />
            <Route path="/new"         element={<NewRequest    user={user} />} />
            <Route path="/request/:id" element={<RequestStatus user={user} />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer style={{ background:'var(--primary)', color:'rgba(255,255,255,.45)', textAlign:'center', padding:'12px 24px', fontSize:11 }}>
          Coffee Finance Approval Management &nbsp;|&nbsp; Powered by Felicity Global Capital Pte. Ltd.
        </footer>
      </div>
    </BrowserRouter>
  )
}

function Header({ user, onSignOut }) {
  const navigate = useNavigate()
  const location = useLocation()
  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?'
  const isActive = p => location.pathname === p
  return (
    <header style={{ background:'var(--primary)', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(46,45,156,.3)' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px', height:60, display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, cursor:'pointer' }} onClick={() => navigate('/')}>
          <img src={apiLogo} alt="Coffee Finance" style={{ height:36, width:36, objectFit:'contain', borderRadius:8, background:'rgba(255,255,255,.1)' }} />
          <div style={{ width:1, height:28, background:'rgba(255,255,255,.2)' }} />
          <img src={fgcLogo} alt="Felicity Global Capital" style={{ height:18, objectFit:'contain', filter:'brightness(0) invert(1)', opacity:.9 }} />
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
          {user.via === 'msal' && (
            <span style={{ fontSize:10, background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.8)', padding:'2px 8px', borderRadius:99, fontWeight:600 }}>FGC</span>
          )}
          <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(110,141,224,.35)', color:'#fff', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', textTransform:'uppercase' }}>{initials}</div>
          <div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{user.name}</div>
            <div style={{ color:'var(--accent)', fontSize:10 }}>{user.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm"
            style={{ color:'rgba(255,255,255,.7)', borderColor:'rgba(255,255,255,.2)', marginLeft:8 }}
            onClick={onSignOut}>Sign Out</button>
        </div>
      </div>
    </header>
  )
}

function LoginPage({ onSupaSession }) {
  const { instance, inProgress } = useMsal()
  const [mode,      setMode]      = useState('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [msLoading, setMsLoading] = useState(false)
  const [message,   setMessage]   = useState(null)
  const [error,     setError]     = useState(null)

  const busy = msLoading || inProgress !== InteractionStatus.None

  const handleMicrosoftLogin = async () => {
    setMsLoading(true); setError(null)
    try {
      await instance.loginPopup(loginRequest)
      // MSAL handles session — App re-renders automatically via useMsal()
    } catch(e) {
      if (e.errorCode !== 'user_cancelled') setError(e.message || 'Microsoft login failed')
    } finally { setMsLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setMessage(null)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onSupaSession(data.session)
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
      <div style={{ background:'#fff', borderRadius:20, padding:'44px 40px', maxWidth:420, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,.3)' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:24 }}>
          <img src={apiLogo} alt="Coffee Finance" style={{ height:52, width:52, objectFit:'contain', borderRadius:12, boxShadow:'0 2px 8px rgba(46,45,156,.15)' }} />
          <div style={{ width:1, height:40, background:'#D1D5F0' }} />
          <img src={fgcLogo} alt="Felicity Global Capital" style={{ height:20, objectFit:'contain' }} />
        </div>
        <div style={{ height:2, background:'linear-gradient(90deg,transparent,#6E8DE0 30%,#2E2D9C 50%,#6E8DE0 70%,transparent)', marginBottom:24 }} />

        <h2 style={{ fontSize:18, fontWeight:800, color:'#1F2937', marginBottom:4, textAlign:'center' }}>Requester Portal</h2>
        <p style={{ fontSize:12, color:'#6B7280', textAlign:'center', marginBottom:20 }}>Submit and track approval requests with FGC</p>

        {error   && <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:8, padding:'10px 14px', fontSize:12, marginBottom:14, wordBreak:'break-word' }}>⚠️ {error}</div>}
        {message && <div style={{ background:'#D1FAE5', color:'#059669', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>✅ {message}</div>}

        {mode === 'login' && (
          <>
            <button onClick={handleMicrosoftLogin} disabled={busy}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:'11px 16px', border:'1.5px solid #D1D5DB', borderRadius:8, background:'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'#1F2937', cursor: busy ? 'not-allowed' : 'pointer', marginBottom:16, opacity: busy ? 0.7 : 1 }}
              onMouseOver={e => { if (!busy) e.currentTarget.style.background='#F9FAFB' }}
              onMouseOut={e  => { e.currentTarget.style.background='#fff' }}>
              {busy
                ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2, borderTopColor:'#2E2D9C' }} /> Signing in…</>
                : <>
                    <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
                      <rect x="11" y="1"  width="9" height="9" fill="#7fba00"/>
                      <rect x="1"  y="11" width="9" height="9" fill="#00a4ef"/>
                      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    Sign in with Microsoft 365
                  </>}
            </button>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
              <span style={{ fontSize:12, color:'#9CA3AF', fontWeight:500 }}>or sign in with email</span>
              <div style={{ flex:1, height:1, background:'#E5E7EB' }} />
            </div>
          </>
        )}

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
            {loading ? <><div className="spinner" style={{ width:14, height:14, borderWidth:2 }}/> Loading…</> : 'Sign In with Email →'}
          </button>
        </form>

        <div style={{ marginTop:14, textAlign:'center', fontSize:12 }}>
          {mode === 'login'
            ? <button onClick={()=>{setMode('forgot');setError(null)}} style={{ background:'none', border:'none', color:'#2E2D9C', fontWeight:700, cursor:'pointer' }}>Forgot password?</button>
            : <button onClick={()=>{setMode('login');setError(null)}} style={{ background:'none', border:'none', color:'#2E2D9C', fontWeight:700, cursor:'pointer' }}>← Back to Sign In</button>}
        </div>

        <div style={{ marginTop:20, padding:'12px 14px', background:'#F5F6FC', borderRadius:8, borderLeft:'3px solid #6E8DE0', fontSize:12, color:'#6B7280', lineHeight:1.6 }}>
          🔒 <strong>FGC staff</strong> — use Microsoft 365 above.<br/>
          <strong>Coffee Finance staff</strong> — use email/password.
        </div>
      </div>
    </div>
  )
}
