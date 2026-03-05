import styles from './MemberCard.module.css'

const GENDER_COLOR = { male: '#3b82f6', female: '#ec4899', other: '#8b5cf6', '': '#8fa89a' }

function getAge(birthdate) {
  if (!birthdate) return null
  const diff = Date.now() - new Date(birthdate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function MemberCard({ member, onEdit, onDelete, compact }) {
  const age = getAge(member.birthdate)
  const initials = member.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const genderColor = GENDER_COLOR[member.gender || '']

  if (compact) {
    return (
      <div className={styles.compact}>
        <div className={styles.avatarSm} style={{ borderColor: genderColor }}>
          {member.photo
            ? <img src={member.photo} alt={member.name} />
            : <span>{initials}</span>}
        </div>
        <div className={styles.compactInfo}>
          <span className={styles.compactName}>{member.name}</span>
          {age !== null && <span className={styles.compactAge}>{age}y</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardTop} style={{ '--accent': genderColor }}>
        <div className={styles.avatar} style={{ borderColor: genderColor }}>
          {member.photo
            ? <img src={member.photo} alt={member.name} />
            : <span className={styles.initials}>{initials}</span>}
        </div>
        <div className={styles.actions}>
          <button className="btn-icon" title="Edit" onClick={() => onEdit(member)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="btn-icon" title="Delete" onClick={() => onDelete(member.id)} style={{ color:'#ef4444' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.name}>{member.name}</h3>
        {age !== null && (
          <div className={styles.meta}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {new Date(member.birthdate).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })} · {age} yrs
          </div>
        )}
        {member.bio && <p className={styles.bio}>{member.bio}</p>}
      </div>
    </div>
  )
}
