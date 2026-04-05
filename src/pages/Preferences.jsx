import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import { ToastContainer, showToast } from '../components/Toast.jsx'

const VIBES = [
  { key: 'adventure', icon: '🧗', label: 'Adventure', sub: 'Trekking, camping, thrills' },
  { key: 'chill',     icon: '🏖️', label: 'Chill', sub: 'Beach, relax, good vibes' },
  { key: 'cultural',  icon: '🏛️', label: 'Cultural', sub: 'History, food, art' },
  { key: 'mix',       icon: '🎭', label: 'Mix it all', sub: 'Best of everything' },
]
const DIETARY = [
  { key: 'veg',           label: '🌿 Pure Veg',    sub: 'No meat, no eggs' },
  { key: 'non-veg',       label: '🍗 Non-Veg',     sub: 'All good!' },
  { key: 'vegan',         label: '🥦 Vegan',       sub: 'No animal products' },
  { key: 'no-preference', label: '🍽️ No preference', sub: 'Anything works' },
]
const BUDGETS = [
  { label: '₹3k–5k',   sub: 'Budget travel', min: 3000,  max: 5000  },
  { label: '₹5k–8k',   sub: 'Comfortable',   min: 5000,  max: 8000  },
  { label: '₹8k–12k',  sub: 'Mid-range',     min: 8000,  max: 12000 },
  { label: '₹12k–20k', sub: 'Premium',       min: 12000, max: 20000 },
  { label: '₹20k+',    sub: 'Luxury',        min: 20000, max: 40000 },
]

export default function Preferences() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { member } = useTripStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ vibe: '', budgetMin: null, budgetMax: null, dietary: '', mustHave: '', dealbreaker: '' })
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const TOTAL = 5

  const save = async () => {
    if (!form.vibe || !form.dietary) { showToast('Please complete all questions', 'error'); return }
    if (!member) { showToast('Join the trip first', 'error'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('preferences').upsert({
        trip_id: id, member_id: member.id, vibe: form.vibe,
        budget_min: form.budgetMin, budget_max: form.budgetMax,
        dietary: form.dietary, must_have: form.mustHave, dealbreaker: form.dealbreaker,
      }, { onConflict: 'trip_id,member_id' })
      if (error) throw error
      showToast('Preferences saved! ✅', 'success')
      setTimeout(() => navigate(`/trip/${id}`), 600)
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const S = {
    page: { minHeight: '100svh', display: 'flex', flexDirection: 'column', background: '#fafafa' },
    header: { position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #e5e7eb', padding: '0.875rem 1rem' },
    content: { flex: 1, padding: '1.5rem 1rem 6rem', maxWidth: 480, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  }

  return (
    <div style={S.page}>
      <ToastContainer />
      <div style={S.header}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="row-between" style={{ marginBottom: '0.625rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => step > 1 ? setStep(s => s - 1) : navigate(`/trip/${id}`)}>← Back</button>
            <span style={{ fontSize: '0.8125rem', color: '#9ca3af', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Step {step} of {TOTAL}</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(step / TOTAL) * 100}%` }} />
          </div>
        </div>
      </div>

      <div style={S.content}>
        {/* Step 1: Vibe */}
        {step === 1 && (
          <div className="animate-up stack stack-lg">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Your travel style</p>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>What's your vibe?</h2>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem' }}>Kya chahiye? Beach, adventure, ya relax?</p>
            </div>
            <div className="stack stack-sm">
              {VIBES.map(v => (
                <button key={v.key} className={`vote-option ${form.vibe === v.key ? 'selected' : ''}`}
                  onClick={() => { update('vibe', v.key); setTimeout(() => setStep(2), 220) }}>
                  <span style={{ fontSize: '1.875rem' }}>{v.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{v.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{v.sub}</div>
                  </div>
                  {form.vibe === v.key && <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: '1.25rem' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Budget (anonymous) */}
        {step === 2 && (
          <div className="animate-up stack stack-lg">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Private budget</p>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>What's your comfort level?</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Per person, per day. This is completely private — only a group range is shown, never your number.</p>
            </div>
            <div className="info-box info-box-green" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <span>🔒</span><span>Your budget is <strong>anonymous</strong>. No one sees what you enter — not even the organizer.</span>
            </div>
            <div className="stack stack-sm">
              {BUDGETS.map(b => (
                <button key={b.label} className={`vote-option ${form.budgetMin === b.min ? 'selected-green' : ''}`}
                  onClick={() => { update('budgetMin', b.min); update('budgetMax', b.max) }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem' }}>{b.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>{b.sub} · per person/day</div>
                  </div>
                  {form.budgetMin === b.min && <span style={{ marginLeft: 'auto', color: '#059669', fontSize: '1.25rem' }}>✓</span>}
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(3)} disabled={!form.budgetMin}>Continue →</button>
          </div>
        )}

        {/* Step 3: Placeholder for dates (done later) */}
        {step === 3 && (
          <div className="animate-up stack stack-lg">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Availability</p>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>When can you travel?</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Exact dates are collected after the destination is locked. Mark your availability there.</p>
            </div>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '2rem 1.25rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.875rem' }}>📅</div>
              <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>Calendar coming next</h4>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>You'll pick exact dates in the Dates & Budget section after the group locks a destination.</p>
            </div>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => setStep(4)}>Continue →</button>
          </div>
        )}

        {/* Step 4: Dietary */}
        {step === 4 && (
          <div className="animate-up stack stack-lg">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Food preferences</p>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>Dietary preference?</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Helps us recommend the right restaurants in your itinerary.</p>
            </div>
            <div className="stack stack-sm">
              {DIETARY.map(d => (
                <button key={d.key} className={`vote-option ${form.dietary === d.key ? 'selected' : ''}`}
                  onClick={() => { update('dietary', d.key); setTimeout(() => setStep(5), 220) }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.125rem' }}>{d.sub}</div>
                  </div>
                  {form.dietary === d.key && <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: '1.25rem' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Must-have & dealbreaker */}
        {step === 5 && (
          <div className="animate-up stack stack-lg">
            <div>
              <p style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Final touches</p>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.5rem' }}>Any non-negotiables?</h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Optional — but helps the AI build a trip that works for everyone.</p>
            </div>
            <div className="stack stack-md">
              <div className="input-group">
                <label className="input-label">Your must-have ✅</label>
                <input className="input" placeholder="e.g. Beach access, good wifi, swimming pool…" value={form.mustHave} onChange={e => update('mustHave', e.target.value)} maxLength={80} />
              </div>
              <div className="input-group">
                <label className="input-label">Your dealbreaker ❌</label>
                <input className="input" placeholder="e.g. No sleeper buses, no shared dorms…" value={form.dealbreaker} onChange={e => update('dealbreaker', e.target.value)} maxLength={80} />
              </div>
            </div>
            <div className="info-box info-box-purple">
              🤖 <strong>AI reads these</strong> when building your itinerary — it'll avoid your dealbreakers and include must-haves where possible.
            </div>
            <button className="btn btn-primary btn-xl btn-full" onClick={save} disabled={saving}>
              {saving ? <><span className="spinner spinner-white" /> Saving…</> : '✅ Submit my preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
