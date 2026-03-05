import { useState, useEffect } from 'react'

const EMPTY = { name: '', birthdate: '', photo: '', bio: '', gender: '' }

export default function MemberModal({ member, onSave, onClose }) {
  const [form, setForm] = useState(member ? { ...EMPTY, ...member } : EMPTY)
  const [preview, setPreview] = useState(member?.photo || '')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setPreview(ev.target.result); set('photo', ev.target.result) }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return
    onSave(form)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{member ? 'Edit Member' : 'Add Family Member'}</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          {/* Photo upload */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.5rem' }}>
            <label style={{ cursor:'pointer', textAlign:'center', textTransform:'none', letterSpacing:0 }}>
              <div style={{
                width:100, height:100, borderRadius:'50%',
                background: preview ? `url(${preview}) center/cover` : 'var(--cream-dk)',
                border:'3px solid var(--parchment)',
                display:'flex', alignItems:'center', justifyContent:'center',
                margin:'0 auto 0.5rem',
                overflow:'hidden',
                transition:'border-color 0.2s',
              }}>
                {!preview && (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--mist)" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                )}
              </div>
              <span style={{ fontSize:'0.78rem', color:'var(--forest)', fontWeight:500 }}>
                {preview ? 'Change photo' : 'Add photo'}
              </span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }}/>
            </label>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sarah Johnson" autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" value={form.birthdate} onChange={e => set('birthdate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Bio / Notes</label>
            <textarea
              rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
              placeholder="A little about this person..."
              style={{ resize:'vertical' }}
            />
          </div>

          <div className="form-group">
            <label>Photo URL (alternative)</label>
            <input
              value={preview && preview.startsWith('data:') ? '' : form.photo}
              onChange={e => { set('photo', e.target.value); setPreview(e.target.value) }}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name.trim()}>
            {member ? 'Save Changes' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  )
}
