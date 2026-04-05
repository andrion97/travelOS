import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'

export default function Destinations() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, member, destinations, setDestinations, votes, setVotes } = useTripStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newDest, setNewDest] = useState({ name: '', note: '' })
  const [adding, setAdding] = useState(false)
  const [locking, setLocking] = useState(null)

  const load = async () => {
    const { data: dests } = await supabase.from('destination_options').select('*').eq('trip_id', id).order('vote_count', { ascending: false })
    setDestinations(dests || [])
    const { data: v } = await supabase.from('votes').select('*').eq('trip_id', id)
    setVotes(v || [])
  }

  useEffect(() => { load() }, [id])

  const isOrg = member?.role === 'organizer'
  const myVote = votes.find(v => v.member_id === member?.id)
  const locked = trip?.destination

  const castVote = async (destId) => {
    if (myVote || locked) return
    const { error } = await supabase.from('votes').insert({ trip_id: id, destination_id: destId, member_id: member?.id })
    if (!error) {
      // Update vote count
      const dest = destinations.find(d => d.id === destId)
      await supabase.from('destination_options').update({ vote_count: (dest?.vote_count || 0) + 1 }).eq('id', destId)
      showToast('Vote cast! 🗳️', 'success')
      load()
    }
  }

  const handleAdd = async () => {
    if (!newDest.name.trim()) { showToast('Enter a destination name', 'error'); return }
    setAdding(true)
    await supabase.from('destination_options').insert({
      trip_id: id, name: newDest.name.trim(), note: newDest.note, vote_count: 0, added_by: member?.id
    })
    setNewDest({ name: '', note: '' })
    setShowAdd(false)
    showToast(`${newDest.name} added!`, 'success')
    load()
    setAdding(false)
  }

  const lockDestination = async (dest) => {
    setLocking(dest.id)
    await supabase.from('trips').update({ destination: dest.name, phase: 'dates_budget' }).eq('id', id)
    showToast(`${dest.name} locked! 🔐 Moving to dates`, 'success')
    setTimeout(() => navigate(`/trip/${id}`), 800)
    setLocking(null)
  }

  const totalVotes = votes.length || 1

  return (
    <div className="page" style={{ background: '#fafafa' }}>
      <ToastContainer />

      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div className="row-between">
            <div>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: '-0.5rem', marginBottom: '0.25rem' }} onClick={() => navigate(`/trip/${id}`)}>← Back</button>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {locked ? `📍 ${locked}` : '📍 Where are we going?'}
              </h3>
              <p className="text-xs text-muted" style={{ marginTop: '0.125rem' }}>
                {locked ? 'Destination locked ✅' : `${votes.length} votes cast · ${destinations.length} options`}
              </p>
            </div>
            {!locked && (
              <button className="btn btn-outline btn-sm" onClick={() => setShowAdd(v => !v)}>
                {showAdd ? '✕ Cancel' : '+ Add place'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container page-content" style={{ paddingBottom: '6rem' }}>

        {/* My vote */}
        {myVote && !locked && (
          <div className="info-box info-box-green">
            ✅ <strong>Your vote is in!</strong> Waiting for others and the organizer's call.
          </div>
        )}
        {locked && (
          <div className="info-box info-box-purple">
            🔐 <strong>{locked}</strong> was chosen. Next up: Dates & Budget!
          </div>
        )}

        {/* Add destination form */}
        {showAdd && (
          <div className="card animate-up">
            <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: '0.875rem' }}>Add a destination</h4>
            <div className="stack stack-md">
              <div className="input-group">
                <label className="input-label">Place *</label>
                <input className="input" placeholder="e.g. Coorg, Manali, Gokarna…" value={newDest.name} onChange={e => setNewDest(n => ({ ...n, name: e.target.value }))} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Why this place? <span className="text-muted">(optional)</span></label>
                <input className="input" placeholder="Great waterfalls, budget-friendly, 6hr drive…" value={newDest.note} onChange={e => setNewDest(n => ({ ...n, note: e.target.value }))} />
              </div>
              <div className="row gap-sm">
                <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={adding}>
                  {adding ? <span className="spinner spinner-white" /> : '+ Add'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {destinations.length === 0 && (
          <div className="empty-state animate-up">
            <div className="empty-icon">🌍</div>
            <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No destinations yet</h4>
            <p className="text-sm">Add places you'd like to visit and vote as a group.</p>
          </div>
        )}

        {/* Destination cards */}
        {destinations.map((dest, i) => {
          const voteCount = votes.filter(v => v.destination_id === dest.id).length
          const pct = Math.round((voteCount / totalVotes) * 100)
          const iVoted = votes.some(v => v.destination_id === dest.id && v.member_id === member?.id)
          const isTop = i === 0 && voteCount > 0

          return (
            <div key={dest.id} className="card animate-up" style={{
              border: isTop ? '1.5px solid rgba(124,58,237,0.3)' : '1px solid #e5e7eb',
              background: locked && dest.name === trip.destination ? 'linear-gradient(135deg, #f5f3ff, #fce7f3)' : 'white'
            }}>
              <div className="row-between" style={{ marginBottom: '0.5rem' }}>
                <div className="row gap-sm">
                  <h4 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '1rem' }}>{dest.name}</h4>
                  {isTop && !locked && <span className="badge badge-gradient">🔥 Leading</span>}
                  {locked && dest.name === trip.destination && <span className="badge badge-green">✅ Chosen</span>}
                </div>
                <div className="row gap-sm">
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#7c3aed', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {voteCount}
                  </span>
                  <span className="text-xs text-muted">votes</span>
                </div>
              </div>
              {dest.note && <p style={{ fontSize: '0.8125rem', color: '#6b7280', marginBottom: '0.75rem', lineHeight: 1.5 }}>{dest.note}</p>}
              <div className="vote-bar-track">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="row-between" style={{ marginTop: '0.875rem' }}>
                <span className="text-xs text-muted">{pct}% of votes</span>
                {!locked && (
                  <button
                    className={`btn btn-sm ${iVoted ? 'btn-accent-soft' : myVote ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={() => castVote(dest.id)}
                    disabled={!!myVote || !!locked}
                    style={iVoted ? { color: '#7c3aed', borderColor: 'rgba(124,58,237,0.3)' } : {}}
                  >
                    {iVoted ? '✓ My vote' : myVote ? 'Voted' : '🗳️ Vote'}
                  </button>
                )}
                {!locked && isOrg && (
                  <button className="btn btn-dark btn-sm" onClick={() => lockDestination(dest)} disabled={locking === dest.id}>
                    {locking === dest.id ? <span className="spinner spinner-white" /> : '🔐 Lock this'}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {!locked && isOrg && destinations.length > 0 && (
          <div className="info-box info-box-amber">
            👑 <strong>Organizer tip:</strong> You can lock any destination, even if it's not leading. Click "Lock this" when you're ready.
          </div>
        )}
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}
