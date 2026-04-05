import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'

const TABS = [
  { key: 'vote',    label: 'Vote',    icon: 'vote'    },
  { key: 'results', label: 'Results', icon: 'activity' },
]

const SUGGESTED = [
  { name: 'Goa',       sub: 'Beaches · Nightlife · 1.5h flight' },
  { name: 'Manali',    sub: 'Mountains · Snow · 13h drive' },
  { name: 'Coorg',     sub: 'Coffee estates · Waterfalls · 5h drive' },
  { name: 'Gokarna',   sub: 'Offbeat beaches · Budget-friendly' },
  { name: 'Pondicherry', sub: 'French Quarter · 3h from Chennai' },
  { name: 'Kasol',     sub: 'Trekking · Cafes · Himalayan vibes' },
]

export default function Destinations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, member, destinations, setDestinations, votes, setVotes } = useTripStore()
  const [tab, setTab]       = useState('vote')
  const [showAdd, setShowAdd] = useState(false)
  const [newDest, setNewDest] = useState({ name: '', note: '' })
  const [adding, setAdding]   = useState(false)
  const [locking, setLocking] = useState(null)

  const load = async () => {
    const { data: dests } = await supabase
      .from('destination_options').select('*').eq('trip_id', id)
      .order('vote_count', { ascending: false })
    setDestinations(dests || [])
    const { data: v } = await supabase.from('votes').select('*').eq('trip_id', id)
    setVotes(v || [])
  }

  useEffect(() => { load() }, [id])

  const isOrg  = member?.role === 'organizer'
  const myVote = votes.find(v => v.member_id === member?.id)
  const locked = trip?.destination
  const totalVotes = votes.length || 1

  const castVote = async (destId) => {
    if (myVote || locked) return
    const { error } = await supabase.from('votes').insert({
      trip_id: id, destination_id: destId, member_id: member?.id
    })
    if (!error) {
      const dest = destinations.find(d => d.id === destId)
      await supabase.from('destination_options')
        .update({ vote_count: (dest?.vote_count || 0) + 1 }).eq('id', destId)
      showToast('Vote cast', 'success')
      load()
    }
  }

  const handleAdd = async () => {
    if (!newDest.name.trim()) { showToast('Enter a destination name', 'error'); return }
    setAdding(true)
    await supabase.from('destination_options').insert({
      trip_id: id, name: newDest.name.trim(),
      note: newDest.note, vote_count: 0, added_by: member?.id
    })
    showToast(`${newDest.name} added`, 'success')
    setNewDest({ name: '', note: '' })
    setShowAdd(false)
    load()
    setAdding(false)
  }

  const lockDestination = async (dest) => {
    setLocking(dest.id)
    await supabase.from('trips')
      .update({ destination: dest.name, phase: 'dates_budget' }).eq('id', id)
    showToast(`${dest.name} locked — moving to dates`, 'success')
    setTimeout(() => navigate(`/trip/${id}`), 900)
    setLocking(null)
  }

  return (
    <div className="screen">
      <ToastContainer />

      {/* Navbar */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate(`/trip/${id}`)}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">
          {locked ? locked : 'Destination'}
        </span>
        {!locked && (
          <button className="nav-btn" onClick={() => setShowAdd(v => !v)}>
            {showAdd
              ? <Icon name="x" size={18} strokeWidth={2} />
              : <Icon name="plus" size={20} strokeWidth={2.5} />
            }
          </button>
        )}
        {locked && <div style={{ width: 40 }} />}
      </div>

      {/* Segmented tabs — only show when not locked */}
      {!locked && (
        <div style={{ background: 'white', padding: '10px 16px', borderBottom: '0.5px solid var(--sep)' }}>
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 3, display: 'flex', gap: 2 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, padding: '8px 6px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: tab === t.key ? 'white' : 'transparent',
                  color: tab === t.key ? 'var(--label-1)' : 'var(--label-3)',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.18s',
                }}
              >
                <Icon name={t.icon} size={13} color="currentColor" strokeWidth={tab === t.key ? 2 : 1.75} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scroll-area">

        {/* ── Locked state ── */}
        {locked && (
          <div className="anim-in">
            {/* Hero destination card */}
            <div style={{
              margin: '16px 16px 0',
              borderRadius: 20,
              padding: '28px 22px',
              background: 'linear-gradient(140deg, #4745B3 0%, #5856D6 50%, #7B61FF 100%)',
              boxShadow: '0 6px 28px rgba(88,86,214,0.32)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="mapPin" size={18} color="white" strokeWidth={2} />
                </div>
                <span className="badge badge-white" style={{ fontSize: 11 }}>Destination locked</span>
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: -0.6, lineHeight: 1.1 }}>{locked}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 8 }}>
                {votes.length} vote{votes.length !== 1 ? 's' : ''} · {destinations.length} options were considered
              </p>
            </div>

            <div className="alert alert-info" style={{ margin: '12px 16px 0' }}>
              <Icon name="info" size={14} color="currentColor" strokeWidth={1.75} />
              <span>Destination is set. Head to <strong>Dates</strong> to mark your availability next.</span>
            </div>

            {/* Final vote tally */}
            <div style={{ margin: '14px 16px 0' }}>
              <p className="section-title" style={{ padding: 0, marginBottom: 10 }}>Final tally</p>
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                {destinations.map((dest, i) => {
                  const vc  = votes.filter(v => v.destination_id === dest.id).length
                  const pct = Math.round((vc / totalVotes) * 100)
                  const isWinner = dest.name === locked
                  return (
                    <div key={dest.id} style={{ padding: '14px 16px', borderBottom: i < destinations.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <div className="flex-row gap-8">
                          <p style={{ fontSize: 15, fontWeight: isWinner ? 700 : 400, color: 'var(--label-1)' }}>{dest.name}</p>
                          {isWinner && <span className="badge badge-accent" style={{ fontSize: 11 }}>Winner</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? 'var(--accent)' : 'var(--label-3)' }}>{vc} vote{vc !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'var(--accent)' : 'var(--border)', borderRadius: 2, transition: 'width 0.6s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Vote tab ── */}
        {!locked && tab === 'vote' && (
          <div className="anim-in">

            {/* My vote status */}
            {myVote ? (
              <div className="alert alert-green" style={{ margin: '16px 16px 0' }}>
                <Icon name="checkCircle" size={14} color="currentColor" strokeWidth={1.75} />
                <span><strong>Your vote is in.</strong> Waiting for others and the organizer's call.</span>
              </div>
            ) : (
              <div className="alert alert-info" style={{ margin: '16px 16px 0' }}>
                <Icon name="vote" size={14} color="currentColor" strokeWidth={1.75} />
                <span>Tap a destination to cast your vote. You get <strong>one vote</strong>.</span>
              </div>
            )}

            {/* Add form */}
            {showAdd && (
              <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 16, padding: '18px', boxShadow: 'var(--shadow-card)', border: '1.5px solid var(--accent)' }} className="anim-pop">
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Add a destination</p>

                {/* Suggestion chips */}
                <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quick pick</p>
                <div className="chips" style={{ marginBottom: 14 }}>
                  {SUGGESTED.map(s => (
                    <button
                      key={s.name}
                      className="chip"
                      style={{ fontSize: 12 }}
                      onClick={() => setNewDest(n => ({ ...n, name: s.name }))}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    className="input"
                    placeholder="Destination name"
                    value={newDest.name}
                    onChange={e => setNewDest(n => ({ ...n, name: e.target.value }))}
                    autoFocus
                    style={{ borderRadius: 11, padding: '12px 14px', fontSize: 15 }}
                  />
                  <input
                    className="input"
                    placeholder="Why this place? (optional)"
                    value={newDest.note}
                    onChange={e => setNewDest(n => ({ ...n, note: e.target.value }))}
                    style={{ borderRadius: 11, padding: '12px 14px', fontSize: 15 }}
                  />
                  <div className="flex-row gap-8" style={{ marginTop: 4 }}>
                    <button className="btn btn-primary btn-sm" style={{ flex: 1, height: 44 }} onClick={handleAdd} disabled={adding}>
                      {adding ? <span className="spinner" style={{ width: 15, height: 15 }} /> : 'Add destination'}
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--label-2)' }} onClick={() => setShowAdd(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {destinations.length === 0 && !showAdd && (
              <div className="empty">
                <div className="empty-icon"><Icon name="mapPin" size={44} strokeWidth={1.25} /></div>
                <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-1)' }}>No destinations yet</p>
                <p style={{ fontSize: 14, color: 'var(--label-3)' }}>Add places the group is considering.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
                  <Icon name="plus" size={14} color="white" strokeWidth={2.5} /> Add first destination
                </button>
              </div>
            )}

            {/* Destination vote cards */}
            <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {destinations.map((dest, i) => {
                const vc      = votes.filter(v => v.destination_id === dest.id).length
                const pct     = Math.round((vc / totalVotes) * 100)
                const iVoted  = votes.some(v => v.destination_id === dest.id && v.member_id === member?.id)
                const isTop   = i === 0 && vc > 0

                return (
                  <div
                    key={dest.id}
                    className="anim-up"
                    style={{
                      background: 'white', borderRadius: 16,
                      border: iVoted ? '2px solid var(--accent)' : isTop ? '1.5px solid rgba(88,86,214,0.25)' : '1.5px solid var(--border)',
                      padding: '16px', boxShadow: 'var(--shadow-card)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {/* Title row */}
                    <div className="flex-between" style={{ marginBottom: dest.note ? 6 : 12 }}>
                      <div className="flex-row gap-8">
                        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--label-1)', letterSpacing: -0.2 }}>{dest.name}</p>
                        {isTop && !iVoted && <span className="badge badge-accent" style={{ fontSize: 11 }}>Leading</span>}
                        {iVoted && <span className="badge badge-accent" style={{ fontSize: 11, background: 'var(--accent)', color: 'white' }}>Your vote</span>}
                      </div>
                      <span style={{ fontSize: 20, fontWeight: 800, color: vc > 0 ? 'var(--accent)' : 'var(--label-3)' }}>
                        {vc}
                      </span>
                    </div>

                    {/* Note */}
                    {dest.note && (
                      <p style={{ fontSize: 13, color: 'var(--label-3)', marginBottom: 12, lineHeight: 1.5 }}>{dest.note}</p>
                    )}

                    {/* Vote bar */}
                    <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: iVoted ? 'var(--accent)' : 'var(--border)', borderRadius: 2, transition: 'width 0.6s' }} />
                    </div>

                    {/* Actions row */}
                    <div className="flex-between">
                      <span style={{ fontSize: 12, color: 'var(--label-3)' }}>{pct}% of votes</span>
                      <div className="flex-row gap-8">
                        {/* Vote button */}
                        {!myVote ? (
                          <button
                            onClick={() => castVote(dest.id)}
                            style={{
                              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                              fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                              background: 'var(--accent)', color: 'white',
                              transition: 'all 0.15s',
                            }}
                          >
                            Vote
                          </button>
                        ) : iVoted ? (
                          <div className="flex-row gap-4">
                            <Icon name="checkCircle" size={16} color="var(--accent)" strokeWidth={2} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Voted</span>
                          </div>
                        ) : null}

                        {/* Organizer lock */}
                        {isOrg && (
                          <button
                            onClick={() => lockDestination(dest)}
                            disabled={locking === dest.id}
                            style={{
                              padding: '7px 14px', borderRadius: 20, border: '1.5px solid var(--border)',
                              cursor: 'pointer', fontSize: 12, fontWeight: 600,
                              fontFamily: 'Inter, sans-serif', background: 'transparent',
                              color: 'var(--label-1)', display: 'flex', alignItems: 'center', gap: 5,
                              transition: 'all 0.15s',
                            }}
                          >
                            {locking === dest.id
                              ? <span className="spinner spinner-accent" style={{ width: 13, height: 13 }} />
                              : <><Icon name="flag" size={12} color="currentColor" strokeWidth={2} /> Lock</>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Organizer tip */}
            {isOrg && destinations.length > 0 && (
              <div className="alert alert-amber" style={{ margin: '12px 16px 0' }}>
                <Icon name="info" size={14} color="currentColor" strokeWidth={1.75} />
                <span>You can lock any destination as organizer, regardless of vote count. Tap <strong>Lock</strong> when ready.</span>
              </div>
            )}
          </div>
        )}

        {/* ── Results tab ── */}
        {!locked && tab === 'results' && (
          <div className="anim-in">
            {destinations.length === 0 ? (
              <div className="empty">
                <div className="empty-icon"><Icon name="activity" size={44} strokeWidth={1.25} /></div>
                <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-1)' }}>No votes yet</p>
                <p style={{ fontSize: 14, color: 'var(--label-3)' }}>Add destinations first, then votes will appear here.</p>
              </div>
            ) : (
              <>
                {/* Summary strip */}
                <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, padding: '18px', boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Options</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--label-1)' }}>{destinations.length}</p>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px' }}>
                      <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Votes cast</p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)' }}>{votes.length}</p>
                    </div>
                  </div>
                </div>

                {/* Vote bars */}
                <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                  {destinations.map((dest, i) => {
                    const vc  = votes.filter(v => v.destination_id === dest.id).length
                    const pct = votes.length > 0 ? Math.round((vc / votes.length) * 100) : 0
                    return (
                      <div key={dest.id} style={{ padding: '14px 16px', borderBottom: i < destinations.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: i === 0 && vc > 0 ? 700 : 400, color: 'var(--label-1)' }}>{dest.name}</p>
                            {dest.note && <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>{dest.note}</p>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <p style={{ fontSize: 17, fontWeight: 800, color: i === 0 && vc > 0 ? 'var(--accent)' : 'var(--label-3)' }}>{vc}</p>
                            <p style={{ fontSize: 11, color: 'var(--label-3)' }}>{pct}%</p>
                          </div>
                        </div>
                        <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: i === 0 && vc > 0 ? 'var(--accent)' : 'var(--border)', borderRadius: 3, transition: 'width 0.7s' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}
