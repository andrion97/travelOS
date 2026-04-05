import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useTripStore } from '../store/tripStore.js'
import BottomNav from '../components/BottomNav.jsx'
import { ToastContainer, showToast } from '../components/Toast.jsx'
import Icon from '../components/Icon.jsx'

const AV_CLASS = ['av-0','av-1','av-2','av-3','av-4']

const QUICK_TASKS = [
  'Book flights', 'Book hotel', 'Plan activities',
  'Create packing list', 'Book restaurant', 'Arrange airport pickup',
]

const STATUS = {
  todo:        { label: 'To do',   color: 'var(--label-3)' },
  in_progress: { label: 'Doing',   color: 'var(--amber)' },
  done:        { label: 'Done',    color: 'var(--green)' },
}

// Minimal 3-state toggle pill
function StatusPill({ value, onChange }) {
  const keys = Object.keys(STATUS)
  const next = keys[(keys.indexOf(value) + 1) % keys.length]
  const meta = STATUS[value]
  return (
    <button
      onClick={() => onChange(next)}
      style={{
        padding: '5px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif',
        background: value === 'done' ? 'var(--green-bg)'
          : value === 'in_progress' ? 'var(--amber-bg)'
          : 'var(--surface-2)',
        color: meta.color,
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {meta.label}
    </button>
  )
}

export default function TaskBoard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { member, allMembers } = useTripStore()
  const [tasks, setTasks] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', assigned_to: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const isOrg = member?.role === 'organizer'

  const load = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('trip_id', id).order('created_at')
    setTasks(data || [])
  }
  useEffect(() => { load() }, [id])

  const addTask = async () => {
    if (!form.title.trim()) { showToast('Enter a task title', 'error'); return }
    setSaving(true)
    await supabase.from('tasks').insert({
      trip_id: id,
      title: form.title,
      assigned_to: form.assigned_to || null,
      deadline: form.deadline || null,
    })
    showToast('Task added', 'success')
    setForm({ title: '', assigned_to: '', deadline: '' })
    setShowAdd(false)
    load()
    setSaving(false)
  }

  const updateStatus = async (taskId, status) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    setTasks(t => t.map(x => x.id === taskId ? { ...x, status } : x))
  }

  const done  = tasks.filter(t => t.status === 'done').length
  const pct   = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="screen">
      <ToastContainer />

      {/* Navbar */}
      <div className="navbar navbar-white">
        <button className="nav-btn" onClick={() => navigate(`/trip/${id}`)}>
          <Icon name="arrowLeft" size={18} strokeWidth={2} />
        </button>
        <span className="navbar-title">Tasks</span>
        {isOrg && (
          <button className="nav-btn" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? <Icon name="x" size={18} strokeWidth={2} /> : <Icon name="plus" size={20} strokeWidth={2.5} />}
          </button>
        )}
      </div>

      {/* Progress strip */}
      {tasks.length > 0 && (
        <div style={{ background: 'white', padding: '12px 20px 14px', borderBottom: '0.5px solid var(--sep)' }}>
          <div className="flex-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--label-2)', fontWeight: 500 }}>{done} of {tasks.length} done</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--accent)' }}>{pct}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--green)' : 'var(--accent)' }} />
          </div>
        </div>
      )}

      <div className="scroll-area">

        {/* Add task form — slides in */}
        {showAdd && (
          <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 16, padding: '18px', boxShadow: 'var(--shadow-card)', border: '1.5px solid var(--accent)' }} className="anim-pop">
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>New task</p>

            {/* Quick pick chips */}
            <p style={{ fontSize: 11, color: 'var(--label-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Quick add</p>
            <div className="chips" style={{ marginBottom: 14 }}>
              {QUICK_TASKS.map(t => (
                <button key={t} className="chip" style={{ fontSize: 12 }} onClick={() => setForm(f => ({ ...f, title: t }))}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="input"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                autoFocus
                style={{ borderRadius: 11, padding: '12px 14px', fontSize: 15 }}
              />

              <select
                className="input"
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                style={{ borderRadius: 11, padding: '12px 14px', fontSize: 15, cursor: 'pointer', color: form.assigned_to ? 'var(--label-1)' : 'var(--label-3)' }}
              >
                <option value="">Assign to…</option>
                {allMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}{m.id === member?.id ? ' (you)' : ''}</option>
                ))}
              </select>

              <input
                className="input"
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                style={{ borderRadius: 11, padding: '12px 14px', fontSize: 15 }}
              />

              <div className="flex-row gap-8" style={{ marginTop: 4 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1, height: 44 }} onClick={addTask} disabled={saving}>
                  {saving ? <span className="spinner" style={{ width: 15, height: 15 }} /> : 'Add task'}
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--label-2)' }} onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && !showAdd && (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="check" size={44} strokeWidth={1.25} />
            </div>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--label-1)' }}>No tasks yet</p>
            <p style={{ fontSize: 14, color: 'var(--label-3)', lineHeight: 1.55 }}>
              {isOrg ? 'Tap + to create and assign tasks to members.' : 'Tasks will appear here once the organizer creates them.'}
            </p>
            {isOrg && (
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
                <Icon name="plus" size={14} color="white" strokeWidth={2.5} /> Add first task
              </button>
            )}
          </div>
        )}

        {/* Task list — flat, no sub-sections */}
        {tasks.length > 0 && (
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {tasks.map((task, i) => {
                const assignee = allMembers.find(m => m.id === task.assigned_to)
                const assigneeIdx = allMembers.findIndex(m => m.id === task.assigned_to)
                const isMe = task.assigned_to === member?.id
                const overdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done'
                const isDone = task.status === 'done'

                return (
                  <div
                    key={task.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: i < tasks.length - 1 ? '0.5px solid var(--sep)' : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      background: isMe && !isDone ? 'rgba(88,86,214,0.02)' : 'transparent',
                    }}
                  >
                    {/* Done toggle circle */}
                    <button
                      style={{
                        width: 22, height: 22, borderRadius: 11, flexShrink: 0, marginTop: 2,
                        border: isDone ? 'none' : '1.5px solid var(--border)',
                        background: isDone ? 'var(--green)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onClick={() => updateStatus(task.id, isDone ? 'todo' : 'done')}
                    >
                      {isDone && <Icon name="check" size={11} color="white" strokeWidth={3} />}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 15, fontWeight: isMe ? 600 : 400,
                        color: isDone ? 'var(--label-3)' : 'var(--label-1)',
                        textDecoration: isDone ? 'line-through' : 'none',
                        marginBottom: 4, lineHeight: 1.3,
                      }}>
                        {task.title}
                        {isMe && !isDone && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginLeft: 6 }}>yours</span>}
                      </p>
                      <div className="flex-row gap-8" style={{ flexWrap: 'wrap' }}>
                        {assignee && (
                          <div className="flex-row gap-4">
                            <div className={`avatar avatar-xs ${AV_CLASS[assigneeIdx % 5]}`}>
                              {assignee.name[0]}
                            </div>
                            <span style={{ fontSize: 12, color: 'var(--label-3)' }}>{assignee.name}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <div className="flex-row gap-4">
                            <Icon name="calendar" size={11} color={overdue ? 'var(--red)' : 'var(--label-3)'} strokeWidth={2} />
                            <span style={{ fontSize: 12, color: overdue ? 'var(--red)' : 'var(--label-3)', fontWeight: overdue ? 600 : 400 }}>
                              {task.deadline}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status pill */}
                    <StatusPill value={task.status || 'todo'} onChange={s => updateStatus(task.id, s)} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      <BottomNav tripId={id} />
    </div>
  )
}
