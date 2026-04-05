import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import { generateItinerary } from '../lib/ai.js'
import Icon from '../components/Icon.jsx'

const TYPE_ICON = { activity: 'zap', food: 'receipt', travel: 'plane', stay: 'flag', shopping: 'activity' }
const TYPE_COLOR = { activity: '#5856D6', food: '#FF6B00', travel: '#0A7EA4', stay: '#34C759', shopping: '#FF9500' }

export default function ItineraryBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, member, allMembers, preferences, itinerary, setItinerary } = useTripStore()
  const [generating, setGenerating] = useState(false)
  const [activeDay, setActiveDay] = useState(0)
  const [editingItem, setEditingItem] = useState(null)
  const isOrg = member?.role === 'organizer'

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('itinerary').select('*').eq('trip_id', id).order('day_number')
      setItinerary(data || [])
    }
    load()
  }, [id])

  const handleGenerate = async () => {
    if (!trip?.destination) { showToast('Lock a destination first', 'error'); return }
    setGenerating(true)
    try {
      const vibes = preferences.map(p => p.vibe).filter(Boolean)
      const dominant = vibes.sort((a, b) => vibes.filter(v => v === a).length - vibes.filter(v => v === b).length).pop() || 'mix'
      const vegCount = preferences.filter(p => p.dietary === 'veg' || p.dietary === 'vegan').length
      const days = await generateItinerary({
        destination: trip.destination,
        dateStart: trip.date_start || new Date().toISOString().split('T')[0],
        dateEnd: trip.date_end || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        budgetMin: trip.budget_min || 5000,
        budgetMax: trip.budget_max || 12000,
        groupSize: allMembers.length || 5,
        vibe: dominant,
        dietary: vegCount > 0 ? `veg (${vegCount} vegetarians)` : 'mixed',
        mustHaves: preferences.map(p => p.must_have).filter(Boolean).join(', '),
        dealbreakers: preferences.map(p => p.dealbreaker).filter(Boolean).join(', '),
      })
      for (const day of days) {
        await supabase.from('itinerary').upsert({ trip_id: id, day_number: day.day_number, date: day.date, title: day.title, items: day.items }, { onConflict: 'trip_id,day_number' })
      }
      const { data } = await supabase.from('itinerary').select('*').eq('trip_id', id).order('day_number')
      setItinerary(data || [])
      showToast('Itinerary generated', 'success')
    } catch { showToast('Generation failed. Try again', 'error') }
    finally { setGenerating(false) }
  }

  const updateItem = async (dayIdx, itemIdx, updated) => {
    const day = itinerary[dayIdx]
    const items = [...day.items]; items[itemIdx] = updated
    await supabase.from('itinerary').update({ items }).eq('id', day.id)
    setItinerary(prev => prev.map((d, i) => i === dayIdx ? { ...d, items } : d))
    setEditingItem(null); showToast('Saved', 'success')
  }

  const toggleDone = async (dayIdx, itemIdx) => {
    const day = itinerary[dayIdx]
    const items = day.items.map((item, i) => i === itemIdx ? { ...item, done: !item.done } : item)
    await supabase.from('itinerary').update({ items }).eq('id', day.id)
    setItinerary(prev => prev.map((d, i) => i === dayIdx ? { ...d, items } : d))
  }

  if (!trip) return <div className="flex-center" style={{ minHeight: '100svh' }}><span className="spinner spinner-accent" /></div>

  const currentDay = itinerary[activeDay]

  return (
    <div className="screen">
      <ToastContainer />

      {/* Navbar */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate(`/trip/${id}`)}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">Itinerary</span>
        {isOrg && (
          <button className="nav-btn" onClick={handleGenerate} disabled={generating} style={{ fontSize: 13, fontWeight: 600 }}>
            {generating ? <span className="spinner spinner-accent" style={{ width: 16, height: 16 }} /> : itinerary.length ? '↺ Rebuild' : 'Build AI'}
          </button>
        )}
      </div>

      <div className="scroll-area">
        {/* Empty state */}
        {itinerary.length === 0 && !generating && (
          <div className="empty">
            <div className="empty-icon"><Icon name="map" size={44} strokeWidth={1.25} /></div>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-1)' }}>No itinerary yet</p>
            <p style={{ fontSize: 14, color: 'var(--label-3)', lineHeight: 1.5 }}>
              {isOrg
                ? `Tap "Build AI" above to generate a day-by-day plan for ${trip.destination || 'your destination'}.`
                : 'The organizer will build this soon.'}
            </p>
            {isOrg && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={handleGenerate} disabled={generating}>
                <Icon name="sparkles" size={14} color="white" strokeWidth={1.75} /> Build with AI
              </button>
            )}
          </div>
        )}

        {generating && (
          <div className="empty">
            <span className="spinner spinner-accent" style={{ width: 32, height: 32 }} />
            <p style={{ fontWeight: 500, fontSize: 14, color: 'var(--label-2)', marginTop: 16 }}>Building your itinerary…</p>
          </div>
        )}

        {itinerary.length > 0 && (
          <>
            {/* AI note */}
            <div className="alert alert-info" style={{ margin: '16px 16px 0' }}>
              <Icon name="sparkles" size={14} color="currentColor" strokeWidth={1.75} />
              <span><strong>AI draft</strong> — tap any item to edit times, costs, and details.</span>
            </div>

            {/* Day selector */}
            <div style={{ padding: '14px 16px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
              {itinerary.map((day, i) => (
                <button
                  key={day.id}
                  onClick={() => setActiveDay(i)}
                  style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 20,
                    border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    fontSize: 13, fontWeight: 600,
                    background: activeDay === i ? 'var(--accent)' : 'white',
                    color: activeDay === i ? 'white' : 'var(--label-2)',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.15s',
                  }}
                >
                  Day {day.day_number}
                  {day.date && <span style={{ opacity: 0.7, marginLeft: 4, fontSize: 11 }}>{day.date.slice(5)}</span>}
                </button>
              ))}
            </div>

            {/* Day content */}
            {currentDay && (
              <div style={{ padding: '16px' }}>
                {/* Day title */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--label-1)', letterSpacing: -0.3 }}>{currentDay.title}</p>
                  {currentDay.date && <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{currentDay.date}</p>}
                </div>

                {/* Timeline items */}
                <div>
                  {(currentDay.items || []).map((item, itemIdx) => {
                    const isEditing = editingItem?.dayIdx === activeDay && editingItem?.itemIdx === itemIdx
                    const dotColor = TYPE_COLOR[item.type] || TYPE_COLOR.activity
                    const iconName = TYPE_ICON[item.type] || 'zap'
                    return (
                      <div key={itemIdx} className="timeline-row" style={{ opacity: item.done ? 0.4 : 1 }}>
                        <div className="tl-time">{item.time}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${dotColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                            <Icon name={iconName} size={13} color={dotColor} strokeWidth={2} />
                          </div>
                          {itemIdx < (currentDay.items?.length ?? 1) - 1 && (
                            <div style={{ width: 1.5, flex: 1, background: 'var(--border)', marginTop: 4, minHeight: 20 }} />
                          )}
                        </div>
                        <div className="tl-body">
                          {isEditing ? (
                            <EditForm item={item} onSave={u => updateItem(activeDay, itemIdx, u)} onCancel={() => setEditingItem(null)} />
                          ) : (
                            <div style={{ background: 'white', borderRadius: 12, padding: '12px 14px', boxShadow: 'var(--shadow-card)' }}>
                              <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, marginRight: 8 }}>
                                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--label-1)', textDecoration: item.done ? 'line-through' : 'none', marginBottom: 2 }}>{item.activity}</p>
                                  {item.location && (
                                    <div className="flex-row gap-4" style={{ marginBottom: 4 }}>
                                      <Icon name="mapPin" size={11} color="var(--label-3)" strokeWidth={2} />
                                      <span style={{ fontSize: 12, color: 'var(--label-3)' }}>{item.location}</span>
                                    </div>
                                  )}
                                  {item.description && <p style={{ fontSize: 12, color: 'var(--label-2)', lineHeight: 1.5 }}>{item.description}</p>}
                                  {(item.estimated_cost > 0 || item.tags?.length > 0) && (
                                    <div className="flex-row gap-6" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                                      {item.estimated_cost > 0 && <span className="badge badge-accent">₹{item.estimated_cost.toLocaleString()}/person</span>}
                                      {item.tags?.slice(0, 2).map(t => <span key={t} className="badge badge-gray">{t}</span>)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-row gap-4">
                                  <button
                                    className="icon-btn-surface"
                                    onClick={() => toggleDone(activeDay, itemIdx)}
                                    style={{ width: 30, height: 30 }}
                                  >
                                    <Icon name={item.done ? 'x' : 'check'} size={13} color={item.done ? 'var(--red)' : 'var(--green)'} strokeWidth={2.5} />
                                  </button>
                                  {isOrg && (
                                    <button
                                      className="icon-btn-surface"
                                      onClick={() => setEditingItem({ dayIdx: activeDay, itemIdx })}
                                      style={{ width: 30, height: 30 }}
                                    >
                                      <Icon name="edit" size={13} color="var(--label-2)" strokeWidth={2} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}

function EditForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState({ ...item })
  const u = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div style={{ background: 'var(--bg)', padding: 14, borderRadius: 12, border: '1.5px solid var(--accent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input className="input" placeholder="Activity name" value={form.activity || ''} onChange={e => u('activity', e.target.value)} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 14 }} />
      <div className="flex-row gap-8">
        <input className="input" placeholder="Time" value={form.time || ''} onChange={e => u('time', e.target.value)} style={{ flex: 1, borderRadius: 10, padding: '11px 13px', fontSize: 14 }} />
        <input className="input" type="number" placeholder="₹/person" value={form.estimated_cost || ''} onChange={e => u('estimated_cost', Number(e.target.value))} style={{ flex: 1, borderRadius: 10, padding: '11px 13px', fontSize: 14 }} />
      </div>
      <input className="input" placeholder="Location" value={form.location || ''} onChange={e => u('location', e.target.value)} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 14 }} />
      <textarea className="input" rows={2} placeholder="Description" value={form.description || ''} onChange={e => u('description', e.target.value)} style={{ borderRadius: 10, padding: '11px 13px', fontSize: 14 }} />
      <div className="flex-row gap-8">
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onSave(form)}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ color: 'var(--label-2)' }}>Cancel</button>
      </div>
    </div>
  )
}
