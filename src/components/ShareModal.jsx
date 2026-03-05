import { useState, useRef } from 'react'

export default function ShareModal({ getShareUrl, exportJSON, importJSON, onClose }) {
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()
  const url = getShareUrl()

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(()=>setCopied(false),2000) }
    catch { /* fallback */ }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:480 }} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share & Backup</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* Share URL */}
          <div style={{ background:'var(--cream-dk)', borderRadius:'12px', padding:'1.1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.6rem' }}>
              <span style={{ fontSize:'1.2rem' }}>🔗</span>
              <div>
                <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--forest)' }}>Share via Link</div>
                <div style={{ fontSize:'0.78rem', color:'var(--mist)' }}>Anyone with this link can view your family tree</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <input readOnly value={url} style={{ fontSize:'0.75rem', color:'var(--mist)', background:'#fff' }}/>
              <button className="btn btn-primary btn-sm" style={{ whiteSpace:'nowrap' }} onClick={copyUrl}>
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>
            <p style={{ fontSize:'0.72rem', color:'var(--mist)', marginTop:'0.5rem' }}>
              ⚠️ Note: All family data is encoded in the URL. Share only with trusted family members.
            </p>
          </div>

          {/* Export */}
          <div style={{ background:'var(--cream-dk)', borderRadius:'12px', padding:'1.1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <span style={{ fontSize:'1.2rem' }}>💾</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--forest)' }}>Export to File</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--mist)' }}>Download a JSON backup of your family data</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={exportJSON}>Export</button>
            </div>
          </div>

          {/* Import */}
          <div style={{ background:'var(--cream-dk)', borderRadius:'12px', padding:'1.1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                <span style={{ fontSize:'1.2rem' }}>📂</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.9rem', color:'var(--forest)' }}>Import from File</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--mist)' }}>Restore from a previously exported backup</div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>Import</button>
            </div>
            <input ref={fileRef} type="file" accept=".json" style={{ display:'none' }}
              onChange={e => { if(e.target.files[0]) { importJSON(e.target.files[0]); onClose() } }}/>
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
