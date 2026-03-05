import { useState } from 'react'
import { useFamilyData } from './hooks/useFamilyData'
import MemberCard from './components/MemberCard'
import MemberModal from './components/MemberModal'
import RelationshipModal from './components/RelationshipModal'
import FamilyTree from './components/FamilyTree'
import ShareModal from './components/ShareModal'
import Toast from './components/Toast'
import styles from './App.module.css'

const REL_LABELS = {
  parent:'Parent/Child', spouse:'Spouse', sibling:'Sibling',
  grandparent:'Grandparent', aunt_uncle:'Aunt/Uncle', cousin:'Cousin', other:'Other'
}
const REL_ICONS = {
  parent:'👨‍👧', spouse:'💑', sibling:'👫', grandparent:'👴',
  aunt_uncle:'🤝', cousin:'👯', other:'🌿'
}

export default function App() {
  const {
    members, relationships, treeName,
    addMember, updateMember, deleteMember,
    addRelationship, deleteRelationship,
    getShareUrl, exportJSON, importJSON,
    updateTreeName, toasts
  } = useFamilyData()

  const [activeTab, setActiveTab] = useState('tree')
  const [showAddMember, setShowAddMember] = useState(false)
  const [editMember, setEditMember] = useState(null)
  const [showRelModal, setShowRelModal] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(treeName)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveMember = (form) => {
    if (editMember) { updateMember(editMember.id, form); setEditMember(null) }
    else addMember(form)
  }

  const handleDeleteMember = (id) => {
    if (window.confirm('Remove this member and all their relationships?')) deleteMember(id)
  }

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown'

  return (
    <div className={styles.app}>
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🌳</span>
          <div>
            {editingName ? (
              <input
                autoFocus value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onBlur={() => { updateTreeName(nameInput); setEditingName(false) }}
                onKeyDown={e => { if(e.key==='Enter'){ updateTreeName(nameInput); setEditingName(false) } }}
                style={{ fontFamily:'var(--font-head)', fontSize:'1rem', fontWeight:700, padding:'0.15rem 0.4rem', width:'140px', color:'var(--forest)' }}
              />
            ) : (
              <h1 className={styles.logoTitle} onClick={() => { setEditingName(true); setNameInput(treeName) }}
                title="Click to rename">{treeName}</h1>
            )}
            <p className={styles.logoSub}>{members.length} members · {relationships.length} connections</p>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {[
            { id:'tree', icon:'🗺️', label:'Family Tree' },
            { id:'members', icon:'👥', label:'Members' },
            { id:'connections', icon:'🔗', label:'Connections' },
          ].map(tab => (
            <button key={tab.id}
              className={`${styles.navItem} ${activeTab===tab.id ? styles.navActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span> {tab.label}
              {tab.id==='members' && members.length > 0 && (
                <span className={styles.badge}>{members.length}</span>
              )}
              {tab.id==='connections' && relationships.length > 0 && (
                <span className={styles.badge}>{relationships.length}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Quick actions */}
        <div className={styles.sideActions}>
          <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => setShowAddMember(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </button>
          {members.length >= 2 && (
            <button className="btn btn-secondary" style={{ width:'100%' }} onClick={() => setShowRelModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Connect
            </button>
          )}
        </div>

        {/* Share */}
        <div className={styles.sideBottom}>
          <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'center', fontSize:'0.82rem' }}
            onClick={() => setShowShare(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Share & Backup
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────── */}
      <main className={styles.main}>

        {/* Tree Tab */}
        {activeTab === 'tree' && (
          <div className={styles.treePane}>
            <div className={styles.paneHeader}>
              <div>
                <h2>Family Tree</h2>
                <p>Scroll to zoom · Drag to pan · Click a member to edit</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}>
                + Add Member
              </button>
            </div>
            <div style={{ flex:1, minHeight:0 }}>
              <FamilyTree
                members={members}
                relationships={relationships}
                onMemberClick={(m) => setEditMember(m)}
              />
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className={styles.contentPane}>
            <div className={styles.paneHeader}>
              <div>
                <h2>Family Members</h2>
                <p>{members.length} people in your tree</p>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <input
                  placeholder="Search members…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width:180 }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  + Add Member
                </button>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className={styles.emptyState}>
                <span style={{ fontSize:'2.5rem' }}>👤</span>
                <h3>{searchQuery ? 'No members found' : 'No members yet'}</h3>
                <p>{searchQuery ? 'Try a different search' : 'Add your first family member to get started'}</p>
                {!searchQuery && (
                  <button className="btn btn-primary" onClick={() => setShowAddMember(true)}>Add First Member</button>
                )}
              </div>
            ) : (
              <div className={styles.memberGrid}>
                {filteredMembers.map(m => (
                  <MemberCard key={m.id} member={m}
                    onEdit={setEditMember}
                    onDelete={handleDeleteMember}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className={styles.contentPane}>
            <div className={styles.paneHeader}>
              <div>
                <h2>Connections</h2>
                <p>{relationships.length} relationships defined</p>
              </div>
              {members.length >= 2 && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowRelModal(true)}>
                  + Connect Members
                </button>
              )}
            </div>

            {relationships.length === 0 ? (
              <div className={styles.emptyState}>
                <span style={{ fontSize:'2.5rem' }}>🔗</span>
                <h3>No connections yet</h3>
                <p>Connect your family members to build relationships</p>
                {members.length >= 2 && (
                  <button className="btn btn-primary" onClick={() => setShowRelModal(true)}>Connect Members</button>
                )}
                {members.length < 2 && <p style={{ color:'var(--mist)', fontSize:'0.82rem' }}>Add at least 2 members first</p>}
              </div>
            ) : (
              <div className={styles.relList}>
                {relationships.map(r => (
                  <div key={r.id} className={styles.relItem}>
                    <div className={styles.relBadge} style={{ background: `var(--forest)` }}>
                      {REL_ICONS[r.type] || '🌿'}
                    </div>
                    <div className={styles.relInfo}>
                      <span className={styles.relName}>{getMemberName(r.from)}</span>
                      <span className={styles.relType}>{REL_LABELS[r.type] || r.type}</span>
                      <span className={styles.relName}>{getMemberName(r.to)}</span>
                    </div>
                    <button
                      className="btn-icon" title="Remove"
                      onClick={() => deleteRelationship(r.id)}
                      style={{ color:'#ef4444', marginLeft:'auto' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modals ─────────────────────────────── */}
      {(showAddMember || editMember) && (
        <MemberModal
          member={editMember}
          onSave={handleSaveMember}
          onClose={() => { setShowAddMember(false); setEditMember(null) }}
        />
      )}
      {showRelModal && (
        <RelationshipModal
          members={members}
          onSave={addRelationship}
          onClose={() => setShowRelModal(false)}
        />
      )}
      {showShare && (
        <ShareModal
          getShareUrl={getShareUrl}
          exportJSON={exportJSON}
          importJSON={importJSON}
          onClose={() => setShowShare(false)}
        />
      )}
      <Toast toasts={toasts} />
    </div>
  )
}
