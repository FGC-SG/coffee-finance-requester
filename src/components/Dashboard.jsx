import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRequests, getAllRequests } from '../services/apiService.js'

const SM = {
  Pending:   { cls: 'badge-pending',  icon: '⏳', label: 'Pending' },
  Approved:  { cls: 'badge-approved', icon: '✅', label: 'Approved' },
  Rejected:  { cls: 'badge-rejected', icon: '❌', label: 'Rejected' },
  Cancelled: { cls: 'badge-pending',  icon: '⊘',  label: 'Cancelled' },
}

export default function Dashboard({ user }) {
  const navigate = useNavigate()
  const [tab,     setTab]     = useState('mine')
  const [myReqs,  setMyReqs]  = useState([])
  const [allReqs, setAllReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [mine, all] = await Promise.all([getRequests(), getAllRequests()])
      setMyReqs(mine)
      setAllReqs(all)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const requests = tab === 'mine' ? myReqs : allReqs
  const filtered = requests.filter(r => {
    const q = search.toLowerCase()
    if (!q) return true
    return r.title.toLowerCase().includes(q) ||
           r.requesterName?.toLowerCase().includes(q) ||
           r.requesterEmail?.toLowerCase().includes(q)
  })

  const myPending  = myReqs.filter(r => r.status === 'Pending').length
  const allPending = allReqs.filter(r => r.status === 'Pending').length

  return (
    <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 24px', display:'flex', flexDirection:'column', gap:24 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          [myReqs.length, 'My Requests',  'var(--primary)'],
          [myPending,     'My Pending',   'var(--pending)'],
          [allPending,    'All Pending',  'var(--accent)'],
        ].map(([v,l,c]) => (
          <div key={l} className="card" style={{ padding:'20px 24px', textAlign:'center' }}>
            <div style={{ fontSize:38, fontWeight:800, color:c, lineHeight:1, marginBottom:6 }}>{v}</div>
            <div style={{ fontSize:13, color:'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
          <div style={{ display:'flex' }}>
            {[
              ['mine', `My Requests${myReqs.length ? ` (${myReqs.length})` : ''}`],
              ['all',  `All Requests${allReqs.length ? ` (${allReqs.length})` : ''}`],
            ].map(([t,l]) => (
              <button key={t} onClick={() => { setTab(t); setSearch('') }}
                style={{ padding:'14px 18px', border:'none', borderBottom:`3px solid ${tab===t?'var(--primary)':'transparent'}`, background:'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:tab===t?'var(--primary)':'var(--muted)', cursor:'pointer', whiteSpace:'nowrap' }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px' }}>
            <input type="search" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ padding:'6px 12px', border:'1.5px solid var(--border)', borderRadius:6, fontFamily:'var(--font)', fontSize:13, width:180 }} />
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px', color:'var(--muted)' }}>
            <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>📋</div>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8, color:'var(--text)' }}>
              {tab === 'mine' ? 'No requests yet' : 'No requests found'}
            </div>
            <div style={{ fontSize:14, marginBottom:20 }}>
              {tab === 'mine' ? 'Submit your first approval request to get started.' : 'No requests match your search.'}
            </div>
            {tab === 'mine' && <button className="btn btn-primary" onClick={() => navigate('/new')}>+ New Request</button>}
          </div>
        ) : (
          filtered.map(r => {
            const sm   = SM[r.status] || SM.Pending
            const date = r.createdDate ? new Date(r.createdDate).toLocaleDateString('en-SG', { day:'numeric', month:'short', year:'numeric' }) : ''
            const isOwn = r.requesterEmail?.toLowerCase() === user.email?.toLowerCase()
            return (
              <div key={r.id} onClick={() => navigate(`/request/${r.id}`)}
                style={{ display:'flex', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid var(--border)', cursor:'pointer', gap:12 }} role="button">
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:5 }}>
                    <span style={{ fontWeight:700, fontSize:14, color:'var(--primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'55%' }}>{r.title}</span>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                      {isOwn && tab === 'all' && (
                        <span style={{ background:'var(--pale)', color:'var(--primary)', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:99, textTransform:'uppercase' }}>Mine</span>
                      )}
                      <span className={`badge ${sm.cls}`}>{sm.icon} {sm.label}</span>
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--muted)', display:'flex', gap:8, flexWrap:'wrap' }}>
                    {tab === 'all' && <><span>From: <strong>{r.requesterName || r.requesterEmail}</strong></span><span>·</span></>}
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
