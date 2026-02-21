import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CollaborativeStoryApp from '../storytelling-app.jsx'

// Storage shim using localStorage (replaces window.storage API)
window.storage = {
  async get(key) {
    const value = localStorage.getItem(key)
    return value !== null ? { value } : null
  },
  async set(key, value) {
    localStorage.setItem(key, value)
  },
  async delete(key) {
    localStorage.removeItem(key)
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CollaborativeStoryApp />
  </StrictMode>,
)
