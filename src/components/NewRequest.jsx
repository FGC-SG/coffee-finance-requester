import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRequest } from '../services/apiService.js'

const DEFAULT_APPROVERS = [
  { email: '', displayName: '', order: 1 },
]

export default function NewRequest({ token, user }) {
  const navigate = useNavigate()
  const [title,        setTitle]        = useState('')
  const [bodyMessage,  setBodyMessage]  = useState('')
  const [approvalType, setApprovalType] = useState('parallel')
  const [approvers,    setApprovers]    = useState(DEFAULT_APPROVERS)
  const [submitting,   setSubmitting]   = useState(false)
  const [errors,       setErrors]       = useState({})
  const [toast,        setToast]        = useState(null)

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),4000) }

  const validate = () => {
    const e = {}
    if (!title.trim())       e.title = 'Required'
    if (!bodyMessage.trim()) e.body  = 'Required'
    const validApprovers = approvers.filter(a => a.email.trim())
    if (!validApprovers.length) e.approvers = 'Add at least one approver email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const addApprover    = () => setApprovers(p => [...p, { email:'', displayName:'', order: p.length+1 }])
  const removeApprover = i  => setApprovers(p => p.filter((_,idx) => idx !== i).map((a,idx) => ({...a,order:idx+1})))
  const updateApprover = (i, field, val) => setApprovers(p => p.map((a,idx) => idx === i ? {...a,[field]:val} : a))

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const validApprovers = approvers.filter(a => a.email.trim()).map((a,i) => ({
        email:       a.email.trim(),
        displayName: a.displayName.trim() || a.email.trim(),
        order:       i+1,
      }))
      const created = await createRequest({
        title: title.trim(), bodyMessage: bodyMessage.trim(),
        approvalType, approvers: validApprovers,
      })
      showToast('Request submitted! FGC team has been notified.')
      setTimeout(() => navigate(`/request/${created.id}`), 1200)
    } catch(e) { showToast(`Error: ${e.message}`, 'error') }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 24px' }}>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom:16 }}>← Back</button>
      <h1 style={{ fontSize:26, fontWeight:800, color:'var(--primary)', marginBottom:6 }}>New Approval Request</h1>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:28 }}>Submit a request to the Felicity Global Capital team for approval.</p>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Sender info */}
        <div className="card">
          <div className="card-header"><span>👤</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Your Details</span></div>
          <div className="card-body">
            <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--pale)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, textTransform:'uppercase', flexShrink:0 }}>
                {user.name?.charAt(0) || '?'}
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{user.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>{user.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Request details */}
        <div className="card">
          <div className="card-header"><span>📋</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Request Details</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Title <span style={{ color:'var(--rejected)' }}>*</span></label>
              <input type="text" className="form-input" placeholder="e.g. Contract Approval — Q3 Project" value={title} onChange={e=>{setTitle(e.target.value);setErrors(p=>({...p,title:''}))}} maxLength={200} />
              {errors.title && <span style={{ color:'var(--rejected)', fontSize:12 }}>{errors.title}</span>}
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">Message <span style={{ color:'var(--rejected)' }}>*</span></label>
              <textarea className="form-textarea" placeholder="Describe what you need approved and provide all relevant details…" value={bodyMessage} onChange={e=>{setBodyMessage(e.target.value);setErrors(p=>({...p,body:''}))}} rows={6} />
              {errors.body && <span style={{ color:'var(--rejected)', fontSize:12 }}>{errors.body}</span>}
            </div>
          </div>
        </div>

        {/* Approvers */}
        <div className="card">
          <div className="card-header"><span>⚙️</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Approval Settings</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Approval Type</label>
              <div style={{ display:'flex', gap:10 }}>
                {[{k:'parallel',i:'⚡',t:'Parallel',d:'All approvers notified at once'},{k:'sequential',i:'🔗',t:'Sequential',d:'Approvers notified one by one in order'}].map(o => (
                  <div key={o.k} onClick={()=>setApprovalType(o.k)} style={{ flex:1, border:`2px solid ${approvalType===o.k?'var(--primary)':'var(--border)'}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', background:approvalType===o.k?'var(--pale)':'#fafbff' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span>{o.i}</span><span style={{ fontWeight:700, fontSize:13, flex:1 }}>{o.t}</span>
                      {approvalType===o.k && <span style={{ color:'var(--primary)', fontWeight:700 }}>✓</span>}
                    </div>
                    <p style={{ fontSize:11, color:'var(--muted)', margin:0 }}>{o.d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom:0 }}>
              <label className="form-label">FGC Approvers <span style={{ color:'var(--rejected)' }}>*</span></label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {approvers.map((a,i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ width:22, height:22, background:'var(--primary)', color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                    <input type="email" className="form-input" placeholder="approver@fgcsg.com" value={a.email} onChange={e=>updateApprover(i,'email',e.target.value)} style={{ flex:2 }} />
                    <input type="text"  className="form-input" placeholder="Name (optional)" value={a.displayName} onChange={e=>updateApprover(i,'displayName',e.target.value)} style={{ flex:1 }} />
                    {approvers.length > 1 && (
                      <button type="button" onClick={()=>removeApprover(i)} style={{ background:'none', border:'none', color:'var(--rejected)', cursor:'pointer', fontSize:16, fontWeight:700, padding:'4px 8px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start', marginTop:4 }} onClick={addApprover}>
                  + Add Approver
                </button>
              </div>
              {errors.approvers && <span style={{ color:'var(--rejected)', fontSize:12, marginTop:6, display:'block' }}>{errors.approvers}</span>}
              <p style={{ fontSize:12, color:'var(--muted)', marginTop:8 }}>Enter the email address of the FGC member who will review this request.</p>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:12 }}>
          <button type="button" className="btn btn-ghost" onClick={()=>navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }} /> Submitting…</> : 'Submit Request →'}
          </button>
        </div>
      </form>
    </div>
  )
}
