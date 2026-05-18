import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequest } from '../services/apiService.js'

const SM = {
  Pending:   { cls:'badge-pending',  icon:'⏳', label:'Pending Review', color:'var(--pending)' },
  Approved:  { cls:'badge-approved', icon:'✅', label:'Approved',       color:'var(--approved)' },
  Rejected:  { cls:'badge-rejected', icon:'❌', label:'Rejected',       color:'var(--rejected)' },
  Cancelled: { cls:'badge-pending',  icon:'⊘',  label:'Cancelled',      color:'var(--muted)' },
}
const ASM = {
  Pending:  { icon:'⏳', color:'var(--muted)' },
  Approved: { icon:'✅', color:'var(--approved)' },
  Rejected: { icon:'❌', color:'var(--rejected)' },
}

export default function RequestStatus({ token }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await getRequest(id)) }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [token, id])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:16 }}><div className="spinner spinner-lg" /><p style={{ color:'var(--muted)', fontSize:14 }}>Loading…</p></div>
  if (error)   return <div style={{ maxWidth:500, margin:'80px auto', textAlign:'center', padding:'0 24px' }}><div style={{ fontSize:48 }}>⚠️</div><h2 style={{ color:'var(--rejected)', margin:'12px 0' }}>Error</h2><p style={{ color:'var(--muted)', marginBottom:20 }}>{error}</p><button className="btn btn-primary" onClick={()=>navigate('/')}>Back</button></div>
  if (!data)   return null

  const sm   = SM[data.status] || SM.Pending
  const date = data.createdDate ? new Date(data.createdDate).toLocaleString('en-SG', { dateStyle:'long', timeStyle:'short' } ) : ''

  return (
    <div style={{ maxWidth:760, margin:'0 auto', padding:'32px 24px' }}>
      <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/')} style={{ marginBottom:16 }}>← Back</button>

      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', marginBottom:8 }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:'var(--primary)', flex:1 }}>{data.title}</h1>
        <span className={`badge ${sm.cls}`} style={{ fontSize:13, padding:'5px 14px' }}>{sm.icon} {sm.label}</span>
      </div>
      <div style={{ fontSize:13, color:'var(--muted)', marginBottom:28 }}>Submitted {date}</div>

      {/* Message */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><span>📄</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Your Request</span></div>
        <div className="card-body">
          <div style={{ fontSize:15, lineHeight:1.7, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{data.bodyMessage}</div>
        </div>
      </div>

      {/* Approval chain */}
      <div className="card" style={{ marginBottom:20 }}>
        <div className="card-header"><span>🔄</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Approval Status</span></div>
        <div style={{ padding:'16px 24px' }}>
          {(data.actions || []).map((a, i) => {
            const as = ASM[a.action] || ASM.Pending
            return (
              <div key={a.id} style={{ marginBottom:8 }}>
                {i > 0 && data.approvalType === 'sequential' && <div style={{ textAlign:'center', color:'var(--accent)', fontSize:16, margin:'-2px 0 6px' }}>↓</div>}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafbff', borderRadius:10, padding:'12px 14px', border:'1.5px solid var(--border)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ width:24, height:24, background:'var(--primary)', color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:11, flexShrink:0 }}>{a.approverOrder}</span>
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{a.approverName || a.approverEmail}</div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{a.approverEmail}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:as.color }}>{as.icon} {a.action}</span>
                </div>
                {a.comment && (
                  <div style={{ background:'var(--pale)', borderRadius:'0 0 8px 8px', padding:'10px 14px', marginLeft:34, fontSize:13 }}>
                    <strong>Comment:</strong> {a.comment}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="card-header"><span>ℹ️</span><span style={{ fontWeight:700, color:'var(--primary)' }}>Request Details</span></div>
        <div className="card-body" style={{ padding:'16px 20px' }}>
          {[['Request ID',`#${data.id?.slice(0,8)}…`],['Submitted On',date],['Approval Type',data.approvalType==='sequential'?'🔗 Sequential':'⚡ Parallel'],['Approvers',`${(data.actions||[]).length} reviewer(s)`]].map(([l,v])=>(
            <div key={l} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--muted)', marginBottom:3 }}>{l}</div>
              <div style={{ fontSize:14, color:'var(--text)', fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
