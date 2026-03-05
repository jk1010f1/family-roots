import { useState } from 'react'

const REL_TYPES = [
  { value: 'parent', label: 'Parent → Child', icon: '👨‍👧' },
  { value: 'spouse', label: 'Spouse / Partner', icon: '💑' },
  { value: 'sibling', label: 'Sibling', icon: '👫' },
  { value: 'grandparent', label: 'Grandparent → Grandchild', icon: '👴' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle → Niece/Nephew', icon: '🤝' },
  { value: 'cousin', label: 'Cousin', icon: '👯' },
  { value: 'other', label: 'Other / Extended', icon: '🌿' },
]

export default function RelationshipModal({ members, onSave, onClose }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('parent')

  const valid = from && to && from !== to

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connect Family Members</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>First Person</label>
              <select value={from} onChange={e => setFrom(e.target.value)}>
                <option value="">Select member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Second Person</label>
              <select value={to} onChange={e => setTo(e.target.value)}>
                <option value="">Select member…</option>
                {members.filter(m => m.id !== from).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Relationship Type</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginTop:'0.25rem' }}>
              {REL_TYPES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setType(r.value)}
                  style={{
                    padding:'0.6rem 0.8rem',
                    borderRadius:'8px',
                    border: `2px solid ${type === r.value ? 'var(--forest)' : 'var(--parchment)'}`,
                    background: type === r.value ? 'var(--forest)' : '#fff',
                    color: type === r.value ? '#fff' : 'var(--ink-lt)',
                    fontSize:'0.82rem',
                    fontFamily:'var(--font-body)',
                    fontWeight: type === r.value ? 600 : 400,
                    cursor:'pointer',
                    display:'flex', alignItems:'center', gap:'0.4rem',
                    transition:'all 0.15s',
                    textAlign:'left',
                  }}
                >
                  <span>{r.icon}</span> {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {valid && (
            <div style={{
              background:'var(--cream-dk)', borderRadius:'10px', padding:'0.9rem 1.1rem',
              display:'flex', alignItems:'center', gap:'0.75rem',
              border:'1.5px solid var(--parchment)'
            }}>
              <span style={{ fontSize:'1.3rem' }}>{REL_TYPES.find(r=>r.value===type)?.icon}</span>
              <span style={{ fontSize:'0.88rem', color:'var(--bark)', fontWeight:500 }}>
                {members.find(m=>m.id===from)?.name}
                <span style={{ color:'var(--mist)', margin:'0 0.4rem' }}>—</span>
                {REL_TYPES.find(r=>r.value===type)?.label}
                <span style={{ color:'var(--mist)', margin:'0 0.4rem' }}>—</span>
                {members.find(m=>m.id===to)?.name}
              </span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary" disabled={!valid}
            onClick={() => { onSave({ from, to, type }); onClose() }}
          >
            Connect Members
          </button>
        </div>
      </div>
    </div>
  )
}
