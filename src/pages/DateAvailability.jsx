import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import { addMonths, startOfMonth, getDaysInMonth, getDay, format } from 'date-fns'
import Icon from '../components/Icon.jsx'

const AV_CLASS = ['av-0','av-1','av-2','av-3','av-4']

const BUDGET_OPTIONS = [
  { label: '₹3k – 5k',   sub: 'Budget friendly',  min: 3000,  max: 5000  },
  { label: '₹5k – 8k',   sub: 'Mid range',         min: 5000,  max: 8000  },
  { label: '₹8k – 12k',  sub: 'Comfortable',       min: 8000,  max: 12000 },
  { label: '₹12k – 20k', sub: 'Premium',            min: 12000, max: 20000 },
  { label: '₹20k+',      sub: 'No limit',           min: 20000, max: 40000 },
]

const TABS = [
  { key: 'dates',   label: 'My dates',   icon: 'calendar' },
  { key: 'budget',  label: 'Budget',     icon: 'wallet'   },
  { key: 'overlap', label: 'Overlap',    icon: 'users'    },
]

const DAY_LABELS = ['S','M','T','W','T','F','S']

function buildCalendar(monthDate) {
  const year  = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const days  = getDaysInMonth(monthDate)
  const first = getDay(startOfMonth(monthDate))
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ day: d, dateStr, past: new Date(dateStr) < new Date(new Date().toDateString()) })
  }
  return cells
}

export default function DateAvailability() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, member, allMembers } = useTripStore()
  const [tab, setTab]         = useState('dates')
  const [selected, setSelected] = useState([])
  const [allAvail, setAllAvail] = useState([])
  const [budget, setBudget]   = useState(null)
  const [saving, setSaving]   = useState(false)
  const [viewMonth, setViewMonth] = useState(new Date())

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('date_availability').select('*').eq('trip_id', id)
      setAllAvail(data || [])
      const mine = (data || []).find(d => d.member_id === member?.id)
      if (mine) setSelected(mine.available_dates || [])
    }
    load()
  }, [id, member])

  const toggleDay = (dateStr) => {
    setSelected(s => s.includes(dateStr) ? s.filter(d => d !== dateStr) : [...s, dateStr])
  }

  const saveAvailability = async () => {
    if (!member) return
    setSaving(true)
    await supabase.from('date_availability').upsert(
      { trip_id: id, member_id: member.id, available_dates: selected },
      { onConflict: 'trip_id,member_id' }
    )
    showToast('Availability saved', 'success')
    setSaving(false)
  }

  const saveBudget = async () => {
    if (!budget || !member) return
    setSaving(true)
    await supabase.from('preferences').upsert(
      { trip_id: id, member_id: member.id, budget_min: budget.min, budget_max: budget.max },
      { onConflict: 'trip_id,member_id' }
    )
    showToast('Budget submitted anonymously', 'success')
    setSaving(false)
  }

  // Overlap counts
  const overlaps = {}
  allAvail.forEach(a => (a.available_dates || []).forEach(d => { overlaps[d] = (overlaps[d] || 0) + 1 }))
  const maxOverlap = Math.max(...Object.values(overlaps), 0)

  const cells = buildCalendar(viewMonth)

  // ── Shared month navigator ──
  const MonthNav = () => (
    <div className="flex-between" style={{ marginBottom: 16 }}>
      <button className="icon-btn-surface" onClick={() => setViewMonth(m => addMonths(m, -1))}>
        <Icon name="arrowLeft" size={16} color="var(--label-2)" strokeWidth={2} />
      </button>
      <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--label-1)', letterSpacing: -0.2 }}>
        {format(viewMonth, 'MMMM yyyy')}
      </p>
      <button className="icon-btn-surface" onClick={() => setViewMonth(m => addMonths(m, 1))}>
        <Icon name="chevronRight" size={16} color="var(--label-2)" strokeWidth={2} />
      </button>
    </div>
  )

  // ── Shared calendar grid ──
  const CalGrid = ({ modeOverlap = false }) => (
    <>
      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--label-3)', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />

          const overlapCount = overlaps[cell.dateStr] || 0
          const isPeak = overlapCount === maxOverlap && maxOverlap > 0
          const isSelected = selected.includes(cell.dateStr)

          let bg = 'transparent', color = 'var(--label-2)', fw = 400

          if (modeOverlap) {
            if (isPeak)          { bg = 'var(--green)';  color = 'white'; fw = 700 }
            else if (overlapCount > 0) { bg = 'var(--accent)'; color = 'white'; fw = 600 }
          } else {
            if (isSelected)      { bg = 'var(--accent)'; color = 'white'; fw = 700 }
          }

          if (cell.past) { color = 'var(--label-3)'; bg = 'transparent'; fw = 400 }

          return (
            <div
              key={cell.dateStr}
              onClick={() => !modeOverlap && !cell.past && toggleDay(cell.dateStr)}
              style={{
                aspectRatio: '1', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: fw,
                background: bg, color,
                cursor: modeOverlap || cell.past ? 'default' : 'pointer',
                opacity: cell.past ? 0.28 : 1,
                transition: 'all 0.12s',
                position: 'relative',
              }}
            >
              {cell.day}
              {modeOverlap && overlapCount > 0 && !cell.past && (
                <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 8, fontWeight: 700, color: isPeak ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.85)' }}>
                  {overlapCount}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="screen">
      <ToastContainer />

      {/* Navbar */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate(`/trip/${id}`)}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">When & Budget</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Segmented tab control */}
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

      <div className="scroll-area">

        {/* ── My Dates ── */}
        {tab === 'dates' && (
          <div className="anim-in">
            <div className="alert alert-info" style={{ margin: '16px 16px 0' }}>
              <Icon name="info" size={14} color="currentColor" strokeWidth={1.75} />
              <span>Tap the days you're <strong>available</strong>. Only the overlap is shown to the group.</span>
            </div>

            <div style={{ margin: '14px 16px 0', background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: 'var(--shadow-card)' }}>
              <MonthNav />
              <CalGrid />
            </div>

            {selected.length > 0 && (
              <div style={{ margin: '12px 16px 0' }}>
                <div className="alert alert-green">
                  <Icon name="checkCircle" size={14} color="currentColor" strokeWidth={1.75} />
                  <span><strong>{selected.length} days</strong> marked available</span>
                </div>
              </div>
            )}

            <div style={{ padding: '16px 16px 0' }}>
              <button
                className="btn btn-primary btn-w-full"
                style={{ height: 52, borderRadius: 14, fontSize: 16 }}
                onClick={saveAvailability}
                disabled={saving || !selected.length}
              >
                {saving
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
                  : <><Icon name="check" size={16} color="white" strokeWidth={2.5} /> Save availability</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Budget ── */}
        {tab === 'budget' && (
          <div className="anim-in">
            <div className="alert alert-green" style={{ margin: '16px 16px 0' }}>
              <Icon name="userPlus" size={14} color="currentColor" strokeWidth={1.75} />
              <span><strong>Anonymous.</strong> The group only sees the combined range, not your number.</span>
            </div>

            <div style={{ margin: '14px 16px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--label-3)', marginBottom: 12, fontWeight: 500 }}>Your comfort level per person · per day</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BUDGET_OPTIONS.map(b => {
                  const isSelected = budget?.min === b.min
                  return (
                    <button
                      key={b.label}
                      onClick={() => setBudget(b)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '15px 18px', borderRadius: 14, border: 'none', cursor: 'pointer',
                        background: isSelected ? 'var(--accent)' : 'white',
                        boxShadow: 'var(--shadow-card)',
                        transition: 'all 0.15s',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 17, fontWeight: 700, color: isSelected ? 'white' : 'var(--label-1)', fontVariantNumeric: 'tabular-nums', letterSpacing: -0.2 }}>{b.label}</p>
                        <p style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.72)' : 'var(--label-3)', marginTop: 2 }}>{b.sub}</p>
                      </div>
                      {isSelected && <Icon name="checkCircle" size={20} color="white" strokeWidth={2} />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ padding: '16px 16px 0' }}>
              <button
                className="btn btn-primary btn-w-full"
                style={{ height: 52, borderRadius: 14, fontSize: 16, background: 'var(--green)', boxShadow: '0 4px 16px rgba(52,199,89,0.28)' }}
                onClick={saveBudget}
                disabled={saving || !budget}
              >
                {saving
                  ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
                  : <><Icon name="userPlus" size={16} color="white" strokeWidth={2} /> Submit anonymously</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Overlap ── */}
        {tab === 'overlap' && (
          <div className="anim-in">

            {/* Responses */}
            <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--sep)' }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--label-1)' }}>Responses</p>
                <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{allAvail.length} of {allMembers?.length} submitted</p>
              </div>
              {allMembers?.map((m, i) => {
                const avail = allAvail.find(a => a.member_id === m.id)
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < allMembers.length - 1 ? '0.5px solid var(--sep)' : 'none' }}>
                    <div className={`avatar avatar-sm ${AV_CLASS[i % 5]}`}>{m.name[0]}</div>
                    <span style={{ flex: 1, fontSize: 15, color: 'var(--label-1)' }}>{m.name}</span>
                    {avail
                      ? <span className="badge badge-green"><Icon name="check" size={10} color="currentColor" strokeWidth={2.5} /> {avail.available_dates?.length}d</span>
                      : <span className="badge badge-gray">Pending</span>
                    }
                  </div>
                )
              })}
            </div>

            {/* Overlap calendar */}
            <div style={{ margin: '12px 16px 0', background: 'white', borderRadius: 18, padding: '18px 16px', boxShadow: 'var(--shadow-card)' }}>
              <MonthNav />
              <CalGrid modeOverlap />

              {/* Legend */}
              <div className="flex-row gap-16" style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid var(--sep)' }}>
                <div className="flex-row gap-6">
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--green)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--label-3)' }}>All available</span>
                </div>
                <div className="flex-row gap-6">
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--label-3)' }}>Some available</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}
