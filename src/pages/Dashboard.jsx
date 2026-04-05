import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import { generatePreferenceSummary } from '../lib/ai.js'
import Icon from '../components/Icon.jsx'

const PHASE_LABELS = ['Prefs', 'Destination', 'Dates', 'Itinerary', 'On trip']
const PHASE_KEYS   = ['onboarding', 'destination', 'dates_budget', 'itinerary', 'on_trip']

const AV_CLASS = ['av-0','av-1','av-2','av-3','av-4']

const QUICK_NAV = [
  { icon: 'mapPin',  label: 'Destination', path: 'destinations' },
  { icon: 'calendar',label: 'Dates',       path: 'dates' },
  { icon: 'map',     label: 'Itinerary',   path: 'itinerary' },
  { icon: 'receipt', label: 'Expenses',    path: 'expenses' },
]

export default function Dashboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, setTrip, member, setMember, allMembers, setAllMembers, preferences, setPreferences, destinations, setDestinations, votes, setVotes } = useTripStore()
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const load = useCallback(async () => {
    const { data: t } = await supabase.from('trips').select('*').eq('id', id).single()
    if (!t) { navigate('/'); return }
    setTrip(t)
    const userId = localStorage.getItem(`trip_${id}_user_id`)
    const { data: mems } = await supabase.from('trip_members').select('*').eq('trip_id', id).order('joined_at')
    setAllMembers(mems || [])
    if (userId) {
      const me = (mems || []).find(m => m.user_id === userId)
      if (me) setMember(me)
    }
    const { data: prefs } = await supabase.from('preferences').select('*').eq('trip_id', id)
    setPreferences(prefs || [])
    const { data: dests } = await supabase.from('destination_options').select('*').eq('trip_id', id)
    setDestinations(dests || [])
    const { data: vs } = await supabase.from('votes').select('*').eq('trip_id', id)
    setVotes(vs || [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const switchMember = (m) => {
    localStorage.setItem(`trip_${id}_user_id`, m.user_id)
    showToast(`Viewing as ${m.name}`, 'success')
    load()
  }

  const advancePhase = async () => {
    const map = { onboarding:'destination', destination:'dates_budget', dates_budget:'itinerary', itinerary:'on_trip', on_trip:'completed' }
    const next = map[trip?.phase]; if (!next) return
    await supabase.from('trips').update({ phase: next }).eq('id', id)
    showToast('Phase advanced', 'success'); load()
  }

  const handleSummary = async () => {
    if (!preferences.length) { showToast('No preferences yet', 'error'); return }
    setSummaryLoading(true)
    const s = await generatePreferenceSummary(preferences)
    setAiSummary(s); setSummaryLoading(false)
  }

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100svh', background: 'var(--bg)' }}>
      <span className="spinner spinner-accent" />
    </div>
  )
  if (!trip) return null

  const isOrg   = member?.role === 'organizer'
  const myPrefs = preferences.find(p => p.member_id === member?.id)
  const myVote  = votes.find(v => v.member_id === member?.id)
  const phaseIdx = PHASE_KEYS.indexOf(trip.phase)
  const prefsPct = allMembers.length ? Math.round((preferences.length / allMembers.length) * 100) : 0

  // One pending action at a time — the most urgent
  const action = !myPrefs
    ? { label: 'Fill your preferences', sub: 'Takes about 2 minutes', path: `/trip/${id}/preferences` }
    : trip.phase === 'destination' && !myVote
    ? { label: 'Vote on destination', sub: `${destinations.length} options to pick from`, path: `/trip/${id}/destinations` }
    : null

  return (
    <div className="screen">
      <ToastContainer />

      {/* ── Sticky navbar ── */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">{trip.name}</span>
        <div className="flex-row gap-8">
          <button className="icon-btn-surface" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/join/${trip.invite_code}`)
            showToast('Invite link copied', 'success')
          }}><Icon name="link" size={16} color="var(--label-2)" strokeWidth={1.75} /></button>
        </div>
      </div>

      <div className="scroll-area">

        {/* ── Trip hero card ── */}
        <div className="hero-card anim-pop">
          <div>
            <div className="flex-row gap-8" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
              {trip.destination && <span className="badge badge-white"><Icon name="mapPin" size={10} color="white" strokeWidth={2} /> {trip.destination}</span>}
              {trip.date_start  && <span className="badge badge-white"><Icon name="calendar" size={10} color="white" strokeWidth={2} /> {trip.date_start.slice(5)} → {trip.date_end?.slice(5)}</span>}
            </div>
            <p style={{ color: 'white', fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>{trip.name}</p>
          </div>

          {/* Phase strip */}
          <div style={{ marginTop: 20 }}>
            <div className="flex-row gap-6" style={{ marginBottom: 8 }}>
              {PHASE_LABELS.map((l, i) => (
                <div key={l} className="flex-row gap-6" style={{ flexShrink: 0 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700,
                    background: i < phaseIdx ? 'rgba(255,255,255,0.9)' : i === phaseIdx ? 'white' : 'rgba(255,255,255,0.18)',
                    color: i <= phaseIdx ? '#5856D6' : 'rgba(255,255,255,0.45)',
                    border: i === phaseIdx ? '2px solid white' : 'none',
                    transition: 'all 0.3s',
                  }}>{i < phaseIdx ? '✓' : i + 1}</div>
                  {i < PHASE_LABELS.length - 1 && (
                    <div style={{ width: 14, height: 1.5, background: i < phaseIdx ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', alignSelf: 'center', flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500 }}>
              Step {phaseIdx + 1} of {PHASE_LABELS.length} · {PHASE_LABELS[phaseIdx]}
            </p>
          </div>
        </div>

        {/* ── Priority action (single) ── */}
        {action && (
          <div style={{ margin: '12px 16px 0' }} className="anim-up">
            <button
              onClick={() => navigate(action.path)}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'white', border: '1.5px solid var(--accent)',
                borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 12px rgba(88,86,214,0.1)',
              }}
            >
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-1)' }}>{action.label}</p>
                <p style={{ fontSize: 13, color: 'var(--label-3)', marginTop: 2 }}>{action.sub}</p>
              </div>
              <Icon name="chevronRight" size={18} color="var(--accent)" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* ── Quick nav grid ── */}
        <div className="section">
          <p className="section-title">Navigate</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 0, background: 'white', borderRadius: 16, overflow: 'hidden', margin: '0 16px', boxShadow: 'var(--shadow-card)' }}>
            {QUICK_NAV.map((q, i) => (
              <button
                key={q.label}
                onClick={() => navigate(`/trip/${id}/${q.path}`)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '18px 6px 14px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderRight: i < 3 ? '0.5px solid var(--sep)' : 'none',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={q.icon} size={18} color="var(--label-2)" strokeWidth={1.75} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--label-3)' }}>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Members ── */}
        <div className="section anim-up d2">
          <div className="flex-between" style={{ padding: '0 20px', marginBottom: 10 }}>
            <p className="section-title" style={{ padding: 0, margin: 0 }}>Members</p>
            <span style={{ fontSize: 12, color: 'var(--label-3)' }}>{preferences.length}/{allMembers.length} ready</span>
          </div>
          <div className="card">
            {allMembers.map((m, i) => {
              const hasPref = preferences.some(p => p.member_id === m.id)
              const isMe = m.id === member?.id
              return (
                <div key={m.id} className="row-item">
                  <div className={`avatar avatar-sm ${AV_CLASS[i % 5]}`}>{m.name[0]}</div>
                  <div className="flex-1">
                    <p style={{ fontSize: 15, fontWeight: isMe ? 600 : 400, color: 'var(--label-1)' }}>
                      {m.name}{isMe && ' · you'}
                    </p>
                    {m.role === 'organizer' && <p style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 600, marginTop: 1 }}>Organizer</p>}
                  </div>
                  {hasPref
                    ? <Icon name="checkCircle" size={18} color="var(--green)" strokeWidth={1.75} />
                    : <Icon name="circle" size={18} color="var(--label-3)" strokeWidth={1.5} />
                  }
                </div>
              )
            })}
          </div>
        </div>

        {/* ── AI Group Summary (collapsed by default) ── */}
        {preferences.length > 0 && (
          <div className="section anim-up d3">
            <p className="section-title">Group insights</p>
            <div className="card" style={{ padding: '16px' }}>
              <div className="flex-between">
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--label-1)' }}>AI preference summary</p>
                  <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{preferences.length} of {allMembers.length} submitted</p>
                </div>
                <button className="btn btn-secondary btn-xs" onClick={handleSummary} disabled={summaryLoading}>
                  {summaryLoading ? <span className="spinner spinner-accent" style={{ width: 13, height: 13 }} /> : <><Icon name="sparkles" size={12} color="var(--accent-text)" strokeWidth={1.75} /> {aiSummary ? 'Refresh' : 'Generate'}</>}
                </button>
              </div>

              {aiSummary && (
                <div className="anim-in" style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid var(--sep)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '11px 12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Vibe</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--label-1)', textTransform: 'capitalize' }}>{aiSummary.vibe_consensus}</p>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '11px 12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Budget / day</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--label-1)' }}>₹{aiSummary.budget_band_min?.toLocaleString()}–{aiSummary.budget_band_max?.toLocaleString()}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--label-2)', lineHeight: 1.55 }}>{aiSummary.dietary_summary}</p>
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: 'var(--label-2)' }}>Alignment: <strong style={{ color: 'var(--label-1)' }}>{aiSummary.alignment_score}/10</strong> — {aiSummary.alignment_note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Organizer controls ── */}
        {isOrg && trip.phase !== 'completed' && (
          <div className="section anim-up d3">
            <p className="section-title">Organizer</p>
            <div style={{ padding: '0 16px' }}>
              <button className="btn btn-outline btn-w-full" style={{ height: 46, borderRadius: 12 }} onClick={advancePhase}>
                Advance to next phase
              </button>
            </div>
          </div>
        )}

        {/* ── Demo POV switcher ── */}
        <div className="section anim-up d4">
          <p className="section-title">Demo — switch member view</p>
          <div style={{ padding: '0 16px' }}>
            <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 12, color: 'var(--label-3)', marginBottom: 10 }}>See how the app looks for each member</p>
              <div className="chips">
                {allMembers.map((m, i) => (
                  <button key={m.id} className={`chip ${m.id === member?.id ? 'active' : ''}`} onClick={() => switchMember(m)} style={{ fontSize: 13 }}>
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 20 }} />
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}
