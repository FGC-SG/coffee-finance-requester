import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRequests } from '../services/apiService.js'

const SM = {
  Pending:   { cls: 'badge-pending',  icon: '⏳', label: 'Pending' },
  Approved:  { cls: 'badge-approved', icon: '✅', label: 'Approved' },
  Rejected:  { cls: 'badge-rejected', icon: '❌', label: 'Rejected' },
  Cancelled: { cls: 'badge-pending',  icon: '⊘',  label: 'Cancelled' },
}

export default function Dashboard({ token, user }) {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setRequests(await getRequests()) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const pending  = requests.filter(r => r.status === 'Pending').length
  const approved = requests.filter(r => r.status === 'Approved').length

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px', display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[[requests.length,'Total Requests','var(--primary)'],[pending,'Pending Review','var(--pending)'],[approved,'Approved','var(--approved)']].map(([v,l,c]) => (
          <div key={l} className="card" style={{ padding:'20px 24px', textAlign:'center' }}>
            <div style={{ fontSize:38, fontWeight:800, color:c, lineHeight:1, marginBottom:6 }}>{v}</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Requests list */}
      <div className="card">
        <div className="card-header" style={{ justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:15, color:'var(--primary)' }}>My Requests</span>
          <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/new')}>+ New Request</button>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'48px 24px', gap:16 }}>
            <div className="spinner spinner-lg" /><p style={{ color:'var(--muted)', fontSize:14 }}>Loading…</p>
          </div>
        ) : error ? (
          <div style={{ textAlign:'center', padding:'48px 24px' }}>
            <p style={{ color:'var(--rejected)', marginBottom:12 }}>{error}</p>
            <button className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px', color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8, color:'var(--text)' }}>No requests yet</div>
            <div style={{ fontSize:14, marginBottom:20 }}>Submit your first approval request to get started.</div>
            <button className="btn btn-primary" onClick={() => navigate('/new')}>+ New Request</button>
          </div>
        ) : (
          requests.map(r => {
            const sm = SM[r.status] || SM.Pending
            const date = r.createdDate ? new Date(r.createdDate).toLocaleDateString('en-SG', { day:'numeric', month:'short', year:'numeric' }) : ''
            return (
              <div key={r.id} onClick={() => navigate(`/request/${r.id}`)}
                style={{ display:'flex', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid var(--border)', cursor:'pointer', gap:12 }} role="button">
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:5 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'var(--primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</span>
                    <span className={`badge ${sm.cls}`}>{sm.icon} {sm.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', display:'flex', gap:8 }}>
                    <span>{r.approvalType === 'sequential' ? '🔗 Sequential' : '⚡ Parallel'}</span>
                    <span>·</span><span>{r.approvers?.length || 0} approver(s)</span>
                    <span>·</span><span>{date}</span>
                  </div>
                </div>
                <span style={{ color:'var(--accent)', fontSize:18 }}>›</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
