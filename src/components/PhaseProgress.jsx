const PHASES = [
  { key: 'onboarding',   label: 'Setup',    icon: '👋' },
  { key: 'destination',  label: 'Where',    icon: '📍' },
  { key: 'dates_budget', label: 'When & ₹', icon: '📅' },
  { key: 'itinerary',   label: 'Plan',     icon: '🗺️' },
  { key: 'on_trip',     label: 'Go!',      icon: '🏖️' },
  { key: 'completed',   label: 'Done',     icon: '🎉' },
]

export default function PhaseProgress({ currentPhase }) {
  const idx = PHASES.findIndex(p => p.key === currentPhase)
  const pct = Math.round(((idx + 1) / PHASES.length) * 100)

  return (
    <div>
      <div className="row-between" style={{ marginBottom: '0.5rem' }}>
        <div className="phase-steps">
          {PHASES.map((phase, i) => {
            const done = i < idx, active = i === idx
            return (
              <div key={phase.key} className="phase-step">
                <div className={`phase-dot ${done ? 'done' : active ? 'active' : ''}`} title={phase.label}>
                  {done ? '✓' : phase.icon}
                </div>
                {i < PHASES.length - 1 && <div className={`phase-line ${done ? 'done' : ''}`} />}
              </div>
            )
          })}
        </div>
      </div>
      <div className="row-between" style={{ marginTop: '0.375rem' }}>
        <p className="text-xs text-muted" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>
          {PHASES[idx]?.label}
        </p>
        <p className="text-xs" style={{ color: '#7c3aed', fontWeight: 600 }}>{pct}%</p>
      </div>
      <div className="progress-track" style={{ marginTop: '0.375rem' }}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
