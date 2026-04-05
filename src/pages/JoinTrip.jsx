import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ToastContainer, showToast } from '../components/Toast.jsx'

export default function JoinTrip() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    const fetchTrip = async () => {
      const { data } = await supabase.from('trips').select('*').eq('invite_code', code).single()
      if (!data) showToast('Invalid invite link', 'error')
      else setTrip(data)
      setLoading(false)
    }
    fetchTrip()
  }, [code])

  const handleJoin = async () => {
    if (!name.trim()) { showToast('Enter your name!', 'error'); return }
    setJoining(true)
    try {
      const { data: { user } } = await supabase.auth.signInAnonymously()

      // Avoid duplicate members
      const { data: existing } = await supabase.from('trip_members').select('id').eq('trip_id', trip.id).eq('user_id', user.id).single()

      if (!existing) {
        await supabase.from('trip_members').insert({ trip_id: trip.id, user_id: user.id, name: name.trim(), role: 'member' })
      }

      localStorage.setItem(`trip_${trip.id}_user_id`, user.id)
      localStorage.setItem(`trip_${trip.id}_member_name`, name.trim())

      showToast(`Welcome, ${name}! 🎉`, 'success')
      navigate(`/trip/${trip.id}`)
    } catch (err) {
      showToast(err.message || 'Failed to join', 'error')
    } finally {
      setJoining(false)
    }
  }

  if (loading) return <div className="page row-center"><div className="spinner" /></div>

  if (!trip) return (
    <div className="page row-center" style={{ textAlign: 'center', padding: '2rem' }}>
      <div>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h3>Invalid invite link</h3>
        <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Ask your organizer for the correct link.</p>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }} onClick={() => navigate('/')}>← Home</button>
      </div>
    </div>
  )

  return (
    <div className="page">
      <ToastContainer />

      <div style={{
        position: 'relative', overflow: 'hidden', padding: '3rem 1.5rem 2rem',
        background: 'linear-gradient(160deg, rgba(91,142,255,0.1) 0%, transparent 60%)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="animate-fade-up">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✈️</div>
          <p className="text-secondary text-sm" style={{ marginBottom: '0.25rem' }}>You're invited to join</p>
          <h2 style={{ marginBottom: '0.75rem' }}>{trip.name}</h2>
          {trip.approximate_month && <span className="badge badge-blue">📅 {trip.approximate_month}</span>}
          {trip.note && <p className="text-sm text-secondary" style={{ marginTop: '0.875rem', lineHeight: 1.5 }}>{trip.note}</p>}
        </div>
      </div>

      <div className="container page-content animate-fade-up">
        <div>
          <h3>Join this trip</h3>
          <p className="text-secondary text-sm">Your budget input stays private — no one will see it.</p>
        </div>

        <div className="input-group">
          <label className="input-label">Your Name *</label>
          <input className="input" placeholder="How should we call you?" value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleJoin()} />
        </div>

        <div className="card" style={{ background: 'var(--accent-teal-dim)', borderColor: 'rgba(0,212,170,0.2)' }}>
          <p className="text-sm" style={{ color: 'var(--accent-teal)', lineHeight: 1.5 }}>
            🤫 Budget is anonymous. Only a group range is shown — your number stays private.
          </p>
        </div>

        <button className="btn btn-teal btn-lg btn-full" onClick={handleJoin} disabled={joining}>
          {joining ? <><span className="spinner" /> Joining...</> : '👋 Join Trip'}
        </button>
      </div>
    </div>
  )
}
