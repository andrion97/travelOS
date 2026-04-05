import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import { parseExpense } from '../lib/ai.js'
import Icon from '../components/Icon.jsx'

const AV_CLASS = ['av-0','av-1','av-2','av-3','av-4']

const HINTS = [
  'paid 1500 for dinner for all',
  'Maine 800 diye petrol ke liye',
  'Priya paid 2400 for hotel room',
  'ice cream 500 for everyone',
]

export default function ExpenseLogger() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { member, allMembers } = useTripStore()
  const [expenses, setExpenses] = useState([])
  const [input, setInput] = useState('')
  const [parsing, setParsing] = useState(false)
  const [pending, setPending] = useState(null)
  const [tab, setTab] = useState('log')
  const inputRef = useRef(null)

  const load = async () => {
    const { data } = await supabase.from('expenses').select('*, paid_by(name)').eq('trip_id', id).order('created_at', { ascending: false })
    setExpenses(data || [])
  }
  useEffect(() => { load() }, [id])

  const handleParse = async () => {
    if (!input.trim()) return
    setParsing(true)
    try {
      const result = await parseExpense(input, allMembers.map(m => m.name))
      setPending({ ...result, rawInput: input })
    } catch { showToast('Could not parse. Try again', 'error') }
    finally { setParsing(false) }
  }

  const handleConfirm = async () => {
    if (!pending || !member) return
    try {
      let paidById = member.id
      if (pending.paid_by_name) {
        const found = allMembers.find(m => m.name.toLowerCase().includes(pending.paid_by_name.toLowerCase()))
        if (found) paidById = found.id
      }
      const splitAmong = pending.split_type === 'all' || !pending.split_names?.length
        ? allMembers.map(m => m.id)
        : pending.split_names.map(n => allMembers.find(m => m.name.toLowerCase().includes(n.toLowerCase()))?.id || member.id)

      const { error } = await supabase.from('expenses').insert({
        trip_id: id, paid_by: paidById, description: pending.description,
        amount: pending.amount, split_among: splitAmong, raw_input: pending.rawInput
      })
      if (error) throw error
      showToast('Expense logged', 'success')
      setInput(''); setPending(null); load()
    } catch (err) { showToast(err.message, 'error') }
  }

  // Balances
  const balances = {}
  allMembers.forEach(m => { balances[m.id] = { name: m.name, paid: 0, owes: 0 } })
  expenses.forEach(exp => {
    if (!exp.amount) return
    const share = exp.amount / (exp.split_among?.length || 1)
    const paidId = typeof exp.paid_by === 'object' ? null : exp.paid_by
    if (paidId && balances[paidId]) balances[paidId].paid += exp.amount
    exp.split_among?.forEach(mid => { if (balances[mid]) balances[mid].owes += share })
  })
  const netBals = Object.entries(balances).map(([uid, b]) => ({ id: uid, name: b.name, net: Math.round(b.paid - b.owes), paid: b.paid, owes: b.owes }))
  const totalSpend = expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const myBal = netBals.find(b => b.id === member?.id)

  return (
    <div className="screen">
      <ToastContainer />

      {/* Navbar */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate(`/trip/${id}`)}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">Expenses</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab + totals strip */}
      <div style={{ background: 'white', padding: '12px 16px', borderBottom: '0.5px solid var(--sep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex-row gap-6">
          {['log', 'ledger'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                background: tab === t ? 'var(--accent)' : 'var(--bg)',
                color: tab === t ? 'white' : 'var(--label-2)',
                transition: 'all 0.15s',
              }}
            >{t === 'log' ? 'Log' : 'Ledger'}</button>
          ))}
        </div>
        {myBal && (
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 500 }}>Your balance</p>
            <p style={{ fontSize: 17, fontWeight: 800, color: myBal.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {myBal.net >= 0 ? '+' : ''}₹{Math.abs(myBal.net).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="scroll-area" style={{ paddingBottom: tab === 'log' ? 140 : 96 }}>
        {tab === 'log' && (
          <>
            {/* Hint chips */}
            {!pending && (
              <div style={{ padding: '16px 16px 0' }}>
                <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Try typing</p>
                <div className="chips">
                  {HINTS.map(h => <button key={h} className="chip" style={{ fontSize: 12 }} onClick={() => setInput(h)}>{h}</button>)}
                </div>
              </div>
            )}

            {/* Confirmation card */}
            {pending && (
              <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, padding: '16px', border: '1.5px solid var(--accent)', boxShadow: '0 2px 16px rgba(88,86,214,0.12)' }} className="anim-pop">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--label-1)' }}>Confirm expense</p>
                  <span className={`badge ${pending.confidence === 'high' ? 'badge-green' : 'badge-amber'}`}>{pending.confidence}</span>
                </div>
                <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)', marginBottom: 12 }}>₹{pending.amount?.toLocaleString()}</p>
                {[
                  { label: 'Description', val: pending.description },
                  { label: 'Paid by', val: pending.paid_by_name || member?.name },
                  { label: 'Split', val: pending.split_type === 'all' ? `All ${allMembers.length} members` : pending.split_names?.join(', ') },
                ].map(r => (
                  <div key={r.label} className="flex-between" style={{ padding: '8px 0', borderBottom: '0.5px solid var(--sep)' }}>
                    <span style={{ fontSize: 13, color: 'var(--label-3)' }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--label-1)' }}>{r.val}</span>
                  </div>
                ))}
                {pending.clarification_needed && (
                  <div className="alert alert-amber" style={{ marginTop: 10, margin: 0, padding: '10px 12px', borderRadius: 10 }}>
                    <Icon name="info" size={14} color="currentColor" />
                    <span>{pending.clarification_needed}</span>
                  </div>
                )}
                <div className="flex-row gap-8" style={{ marginTop: 14 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleConfirm}>
                    <Icon name="check" size={14} color="white" strokeWidth={2.5} /> Confirm
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setPending(null)}>Edit</button>
                </div>
              </div>
            )}

            {/* Expense list */}
            {expenses.length === 0 && !pending && (
              <div className="empty" style={{ paddingTop: 80 }}>
                <div className="empty-icon"><Icon name="receipt" size={40} color="var(--label-3)" strokeWidth={1.25} /></div>
                <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-1)', marginTop: 8 }}>No expenses yet</p>
                <p style={{ fontSize: 14, color: 'var(--label-3)' }}>Type below in English or Hinglish</p>
              </div>
            )}

            <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {expenses.map((exp) => {
                const paidByName = typeof exp.paid_by === 'object' ? exp.paid_by?.name : allMembers.find(m => m.id === exp.paid_by)?.name || 'Someone'
                const splitCount = exp.split_among?.length || 1
                const share = Math.round(exp.amount / splitCount)
                return (
                  <div key={exp.id} style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-card)' }} className="anim-up">
                    <div className="flex-between">
                      <div style={{ flex: 1, marginRight: 12 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--label-1)', marginBottom: 3 }}>{exp.description}</p>
                        <p style={{ fontSize: 13, color: 'var(--label-3)' }}>
                          <strong style={{ color: 'var(--label-2)', fontWeight: 600 }}>{paidByName}</strong> · ₹{share.toLocaleString()} each × {splitCount}
                        </p>
                        {exp.raw_input && <p style={{ fontSize: 11, color: 'var(--label-3)', marginTop: 3, fontStyle: 'italic' }}>"{exp.raw_input}"</p>}
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)', flexShrink: 0 }}>₹{exp.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'ledger' && (
          <div style={{ padding: '16px' }} className="anim-in">
            {/* Total card */}
            <div style={{ background: 'white', borderRadius: 16, padding: '20px', marginBottom: 12, boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 12, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total group spend</p>
              <p style={{ fontSize: 34, fontWeight: 800, color: 'var(--label-1)', letterSpacing: -0.5 }}>₹{totalSpend.toLocaleString()}</p>
              <p style={{ fontSize: 14, color: 'var(--label-3)', marginTop: 2 }}>~₹{allMembers.length ? Math.round(totalSpend / allMembers.length).toLocaleString() : 0} per person</p>
            </div>

            {/* Member balances */}
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {netBals.map((b, i) => (
                <div key={b.id} className="row-item">
                  <div className={`avatar avatar-sm ${AV_CLASS[i % 5]}`}>{b.name[0]}</div>
                  <div className="flex-1">
                    <p style={{ fontSize: 15, fontWeight: b.id === member?.id ? 700 : 400, color: 'var(--label-1)' }}>{b.name}{b.id === member?.id ? ' · you' : ''}</p>
                    <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>Paid ₹{b.paid.toLocaleString()} · Share ₹{Math.round(b.owes).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 15, fontWeight: 800, color: b.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {b.net >= 0 ? '+' : ''}₹{Math.abs(b.net).toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--label-3)' }}>{b.net >= 0 ? 'gets back' : 'owes'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="alert alert-info" style={{ marginTop: 12, margin: '12px 0 0' }}>
              <Icon name="info" size={14} color="currentColor" strokeWidth={1.75} />
              <span>Settle up via GPay or UPI outside the app.</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      {tab === 'log' && (
        <div className="input-bar">
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder="paid 800 for everyone… or in Hinglish"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !parsing && handleParse()}
            style={{ borderRadius: 12, padding: '12px 14px', fontSize: 15 }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleParse}
            disabled={parsing || !input.trim()}
            style={{ borderRadius: 12, height: 46, padding: '0 18px' }}
          >
            {parsing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Icon name="send" size={16} color="white" strokeWidth={2} />}
          </button>
        </div>
      )}

      <BottomNav tripId={id} />
    </div>
  )
}
