import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import CollaborativeStoryApp from './CollaborativeStoryApp.jsx'

// Storage shim using Firestore (replaces localStorage version)
window.storage = {
  async get(key) {
    try {
      const snap = await getDoc(doc(db, "storage", key))
      return snap.exists() ? { value: snap.data().value } : null
    } catch (e) {
      console.error("[storage.get] failed for key:", key, e)
      return null
    }
  },
  async set(key, value) {
    try {
      await setDoc(doc(db, "storage", key), { value })
    } catch (e) {
      console.error("[storage.set] failed for key:", key, e)
    }
  },
  async delete(key) {
    try {
      await deleteDoc(doc(db, "storage", key))
    } catch (e) {
      console.error("[storage.delete] failed for key:", key, e)
    }
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CollaborativeStoryApp />
  </StrictMode>,
)
