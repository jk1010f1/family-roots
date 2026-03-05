import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'family-roots-data'

const DEFAULT_DATA = {
  members: [],
  relationships: [],
  meta: { created: new Date().toISOString(), name: 'My Family Tree' }
}

export function useFamilyData() {
  const [data, setData] = useState(() => {
    // Check URL for shared data first
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('share')
    if (shared) {
      try {
        const decoded = JSON.parse(atob(shared))
        window.history.replaceState({}, '', window.location.pathname)
        return decoded
      } catch (e) { /* ignore */ }
    }
    // Then localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_DATA
    } catch (e) { return DEFAULT_DATA }
  })

  const [toasts, setToasts] = useState([])

  // Persist to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }
    catch (e) { console.warn('Storage full', e) }
  }, [data])

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  // ── Members ──────────────────────────────────
  const addMember = useCallback((member) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`
    setData(d => ({ ...d, members: [...d.members, { ...member, id, createdAt: new Date().toISOString() }] }))
    addToast(`${member.name} added to your family tree 🌿`)
    return id
  }, [addToast])

  const updateMember = useCallback((id, updates) => {
    setData(d => ({ ...d, members: d.members.map(m => m.id === id ? { ...m, ...updates } : m) }))
    addToast('Member updated ✓')
  }, [addToast])

  const deleteMember = useCallback((id) => {
    setData(d => ({
      ...d,
      members: d.members.filter(m => m.id !== id),
      relationships: d.relationships.filter(r => r.from !== id && r.to !== id)
    }))
    addToast('Member removed', 'info')
  }, [addToast])

  // ── Relationships ─────────────────────────────
  const addRelationship = useCallback((rel) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`
    // prevent duplicates
    const exists = data.relationships.some(r =>
      (r.from === rel.from && r.to === rel.to) ||
      (r.from === rel.to && r.to === rel.from)
    )
    if (exists) { addToast('This relationship already exists', 'error'); return }
    setData(d => ({ ...d, relationships: [...d.relationships, { ...rel, id }] }))
    addToast('Relationship added 🤝')
  }, [data.relationships, addToast])

  const deleteRelationship = useCallback((id) => {
    setData(d => ({ ...d, relationships: d.relationships.filter(r => r.id !== id) }))
    addToast('Relationship removed', 'info')
  }, [addToast])

  // ── Share / Export / Import ───────────────────
  const getShareUrl = useCallback(() => {
    const encoded = btoa(JSON.stringify(data))
    return `${window.location.origin}${window.location.pathname}?share=${encoded}`
  }, [data])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `family-roots-${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
    addToast('Family data exported 📁')
  }, [data, addToast])

  const importJSON = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result)
        if (!imported.members || !imported.relationships) throw new Error('Invalid file')
        setData(imported)
        addToast(`Imported ${imported.members.length} members successfully 🌳`)
      } catch (err) { addToast('Invalid family data file', 'error') }
    }
    reader.readAsText(file)
  }, [addToast])

  const updateTreeName = useCallback((name) => {
    setData(d => ({ ...d, meta: { ...d.meta, name } }))
  }, [])

  return {
    members: data.members,
    relationships: data.relationships,
    treeName: data.meta?.name || 'My Family Tree',
    addMember, updateMember, deleteMember,
    addRelationship, deleteRelationship,
    getShareUrl, exportJSON, importJSON,
    updateTreeName, toasts
  }
}
