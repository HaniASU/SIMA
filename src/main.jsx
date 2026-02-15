import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/app.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Reveal app only after CSS is painted -prevents unstyled flash
setTimeout(() => {
  const root = document.getElementById('root')
  const loader = document.getElementById('sima-loader')
  if (root) root.classList.add('ready')
  if (loader) {
    loader.classList.add('fade-out')
    loader.addEventListener('transitionend', () => loader.remove(), { once: true })
  }
}, 150)
