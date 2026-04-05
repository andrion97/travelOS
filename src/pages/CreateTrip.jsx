import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { ToastContainer, showToast } from '../components/Toast.jsx'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CreateTrip() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ tripName: '', month: '', note: '', yourName: '' })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.tripName.trim() || !form.yourName.trim()) {
      showToast('Trip name and your name are required', 'error'); return
    }
    setLoading(true)
    try {
      // Get or create user (no real auth needed)
      const { data: { user } } = await supabase.auth.signInAnonymously()

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({ name: form.tripName, approximate_month: form.month, note: form.note, organizer_id: user.id })
        .select()
        .single()
      if (tripError) throw tripError

      await supabase.from('trip_members').insert({
        trip_id: trip.id, user_id: user.id, name: form.yourName, role: 'organizer'
      })

      localStorage.setItem(`trip_${trip.id}_user_id`, user.id)
      localStorage.setItem(`trip_${trip.id}_member_name`, form.yourName)

      showToast('Trip created! 🎉', 'success')
      navigate(`/trip/${trip.id}`)
    } catch (err) {
      showToast(err.message || 'Failed to create trip', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <ToastContainer />
      <div className="page-header">
        <div className="container">
          <div className="row-between">
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/')}>←</button>
            <span className="text-secondary text-sm">Step {step} of 2</span>
          </div>
        </div>
      </div>

      <div className="container page-content" style={{ paddingTop: '2rem' }}>
        {step === 1 ? (
          <>
            <div className="animate-fade-up">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
              <h2 style={{ marginBottom: '0.5rem' }}>Name your adventure</h2>
              <p className="text-secondary text-sm">Give it a name that'll get everyone excited.</p>
            </div>

            <div className="animate-fade-up anim-delay-1 stack stack-md" style={{ marginTop: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Trip Name *</label>
                <input className="input" placeholder="e.g. Goa Squad 2026, Himachal Road Trip..." value={form.tripName} onChange={e => update('tripName', e.target.value)} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Approximate Month</label>
                <select className="input" value={form.month} onChange={e => update('month', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Not sure yet</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m} 2026</option>)}
                  {MONTHS.map(m => <option key={m+'27'} value={`${m} 2027`}>{m} 2027</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Note for the group <span className="text-muted">(optional)</span></label>
                <textarea className="input" placeholder="e.g. Budget around ₹10k/person, long weekend..." value={form.note} onChange={e => update('note', e.target.value)} rows={3} />
              </div>
            </div>

            <div className="mt-auto" style={{ paddingTop: '2rem' }}>
              <button className="btn btn-primary btn-lg btn-full" onClick={() => form.tripName.trim() ? setStep(2) : showToast('Enter a trip name!', 'error')}>
                Continue →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="animate-fade-up">
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👋</div>
              <h2 style={{ marginBottom: '0.5rem' }}>What's your name?</h2>
              <p className="text-secondary text-sm">You'll be the organizer of this trip.</p>
            </div>

            <div className="animate-fade-up anim-delay-1 stack stack-md" style={{ marginTop: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Your Name *</label>
                <input className="input" placeholder="e.g. Rahul, Priya..." value={form.yourName} onChange={e => update('yourName', e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              </div>

              <div className="card" style={{ background: 'var(--accent-blue-dim)', borderColor: 'rgba(91,142,255,0.2)' }}>
                <p className="text-sm" style={{ color: 'var(--accent-blue)', lineHeight: 1.5 }}>
                  📋 <strong>{form.tripName}</strong>{form.month ? ` · ${form.month}` : ''}<br/>
                  After creating, you'll get a link to share with your group.
                </p>
              </div>
            </div>

            <div className="stack stack-sm mt-auto" style={{ paddingTop: '2rem' }}>
              <button className="btn btn-teal btn-lg btn-full" onClick={handleCreate} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : '🚀 Create Trip & Get Link'}
              </button>
              <button className="btn btn-ghost btn-sm btn-full" onClick={() => setStep(1)}>← Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
