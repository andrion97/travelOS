import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedDemoData, clearDemoData } from '../lib/demoData.js'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'

const FEATURES = [
  { icon: 'vote',     label: 'Destination vote',  sub: 'Group consensus, not chaos' },
  { icon: 'wallet',   label: 'Anonymous budget',   sub: 'Private inputs, shared result' },
  { icon: 'sparkles', label: 'AI itinerary',       sub: 'Day-by-day plan from prefs' },
  { icon: 'receipt',  label: 'Hinglish expenses',  sub: '"Maine 800 diye for everyone"' },
  { icon: 'check',    label: 'Task board',          sub: 'Delegate pre-trip tasks' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleDemo = () => {
    setLoading(true)
    clearDemoData()
    const tripId = seedDemoData()
    showToast("Loaded — you're Rahul, the organizer", 'success')
    setTimeout(() => navigate(`/trip/${tripId}`), 500)
  }

  return (
    <div className="screen" style={{ background: '#fff' }}>
      <ToastContainer />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #3730A3 0%, #5856D6 55%, #7B61FF 100%)',
        padding: '52px 24px 40px',
        position: 'relative', overflow: 'hidden',
        minHeight: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Ambient circle */}
        <div style={{ position: 'absolute', top: -60, right: -50, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div className="flex-row gap-10" style={{ position: 'absolute', top: 20, left: 24 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plane" size={16} color="white" strokeWidth={1.6} />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 16, letterSpacing: -0.2 }}>TripSync</span>
        </div>

        <div className="anim-pop">
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.13)', borderRadius: 20, padding: '4px 11px', fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginBottom: 14, backdropFilter: 'blur(6px)' }}>
            Built for Indian group travel
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 10 }}>
            Group trips,<br />decided together.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6 }}>
            From "let's go somewhere" to a full plan — no more WhatsApp chaos.
          </p>
        </div>
      </div>

      {/* Panel */}
      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '22px 22px 0 0', marginTop: -18, padding: '28px 20px 40px', position: 'relative', zIndex: 2 }}>

        {/* CTAs */}
        <div className="flex-col gap-12 anim-up" style={{ marginBottom: 32 }}>
          <button
            className="btn btn-primary btn-w-full"
            style={{ height: 54, fontSize: 16, borderRadius: 14 }}
            onClick={handleDemo}
            disabled={loading}
            id="demo-btn"
          >
            {loading
              ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Loading…</>
              : <>Explore demo &nbsp;→</>
            }
          </button>

          <button
            className="btn btn-surface btn-w-full"
            style={{ height: 50, borderRadius: 14, fontSize: 15 }}
            onClick={() => navigate('/create')}
          >
            Create a new trip
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--label-3)' }}>
            Demo loads a Goa trip with 5 members · No sign-up · Works offline
          </p>
        </div>

        {/* Features */}
        <p className="section-title" style={{ padding: 0, marginBottom: 12 }}>What's inside</p>
        <div className="card anim-up d2">
          {FEATURES.map((f, i) => (
            <div key={f.label} className="row-item">
              <div className="row-icon" style={{ background: 'var(--accent-dim)' }}>
                <Icon name={f.icon} size={16} color="var(--accent-text)" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--label-1)' }}>{f.label}</p>
                <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
