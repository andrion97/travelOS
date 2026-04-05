import { useState } from 'react'

let _id = 0
let _add = null

export function showToast(msg, type = 'success') {
  if (_add) _add(msg, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _add = (msg, type) => {
    const id = ++_id
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }
  return (
    <div className="toast-shelf">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'error' ? '✕' : '✓'}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
