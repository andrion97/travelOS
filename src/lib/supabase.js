// ─── localStorage-backed Mock Supabase Client ─────────────────────────────
// Full drop-in replacement for @supabase/supabase-js
// No network calls. All data persists in localStorage.

const STORE_KEY = 'tripsync_db'

function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function getStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch { return {} }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function getTable(table) {
  return getStore()[table] || []
}

function saveTable(table, rows) {
  const store = getStore()
  store[table] = rows
  saveStore(store)
}

// ─── Query Builder ─────────────────────────────────────────────────────────
class QueryBuilder {
  constructor(table) {
    this._table = table
    this._filters = []
    this._orderConfig = null
    this._isSingle = false
    this._op = 'select'
    this._data = null
    this._conflictKey = null
    this._selectAfterInsert = false
    this._selectCols = '*'
  }

  select(cols = '*') {
    if (this._op === 'insert' || this._op === 'upsert') {
      this._selectAfterInsert = true
    } else {
      this._selectCols = cols
    }
    return this
  }

  eq(col, val) {
    this._filters.push([col, val])
    return this
  }

  order(col, opts = {}) {
    this._orderConfig = { col, ascending: opts.ascending !== false }
    return this
  }

  limit(n) { this._limitN = n; return this }

  single() {
    this._isSingle = true
    return Promise.resolve(this._execute())
  }

  insert(data) { this._op = 'insert'; this._data = data; return this }
  update(data) { this._op = 'update'; this._data = data; return this }
  upsert(data, opts = {}) {
    this._op = 'upsert'; this._data = data; this._conflictKey = opts.onConflict
    return this
  }

  // Thenable — lets you `await` the query builder directly
  then(onFulfilled, onRejected) {
    return Promise.resolve(this._execute()).then(onFulfilled, onRejected)
  }

  _applyFilters(rows) {
    return rows.filter(row => this._filters.every(([col, val]) => String(row[col]) === String(val)))
  }

  _applyOrder(rows) {
    if (!this._orderConfig) return rows
    const { col, ascending } = this._orderConfig
    return [...rows].sort((a, b) => {
      const va = a[col] ?? '', vb = b[col] ?? ''
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return ascending ? cmp : -cmp
    })
  }

  _expandJoins(rows, cols) {
    // Handle patterns like "*, paid_by(name)"
    if (!cols.includes('(')) return rows
    const joinMatches = [...cols.matchAll(/(\w+)\((\w+)\)/g)]
    if (!joinMatches.length) return rows

    return rows.map(row => {
      const expanded = { ...row }
      joinMatches.forEach(([, fkField, targetField]) => {
        const relatedId = row[fkField]
        if (!relatedId) return
        // Try to find in trip_members first, then any table
        const members = getTable('trip_members')
        const found = members.find(m => String(m.id) === String(relatedId))
        if (found) expanded[fkField] = { [targetField]: found[targetField] }
      })
      return expanded
    })
  }

  _execute() {
    try {
      const table = this._table

      if (this._op === 'select') {
        let rows = getTable(table)
        rows = this._applyFilters(rows)
        rows = this._applyOrder(rows)
        if (this._limitN) rows = rows.slice(0, this._limitN)
        rows = this._expandJoins(rows, this._selectCols)
        if (this._isSingle) {
          return rows.length > 0
            ? { data: rows[0], error: null }
            : { data: null, error: { message: 'Row not found' } }
        }
        return { data: rows, error: null }
      }

      if (this._op === 'insert') {
        const items = Array.isArray(this._data) ? this._data : [this._data]
        const inserted = items.map(item => ({
          id: genId(),
          created_at: new Date().toISOString(),
          ...item,
        }))
        const rows = getTable(table)
        saveTable(table, [...rows, ...inserted])
        if (this._selectAfterInsert && this._isSingle) return { data: inserted[0], error: null }
        if (this._selectAfterInsert) return { data: inserted, error: null }
        return { data: inserted[0] || null, error: null }
      }

      if (this._op === 'update') {
        let rows = getTable(table)
        const targets = this._applyFilters(rows).map(r => r.id)
        rows = rows.map(row => targets.includes(row.id) ? { ...row, ...this._data } : row)
        saveTable(table, rows)
        return { data: null, error: null }
      }

      if (this._op === 'upsert') {
        const items = Array.isArray(this._data) ? this._data : [this._data]
        let rows = getTable(table)
        const inserted = []

        items.forEach(item => {
          if (this._conflictKey) {
            const keys = this._conflictKey.split(',').map(k => k.trim())
            const idx = rows.findIndex(row => keys.every(k => String(row[k]) === String(item[k])))
            if (idx >= 0) {
              rows[idx] = { ...rows[idx], ...item }
              inserted.push(rows[idx])
            } else {
              const newRow = { id: genId(), created_at: new Date().toISOString(), ...item }
              rows.push(newRow)
              inserted.push(newRow)
            }
          } else {
            const newRow = { id: genId(), created_at: new Date().toISOString(), ...item }
            rows.push(newRow)
            inserted.push(newRow)
          }
        })

        saveTable(table, rows)
        return { data: inserted[0] || null, error: null }
      }

      return { data: null, error: null }
    } catch (err) {
      console.error('[MockDB error]', err)
      return { data: null, error: { message: err.message } }
    }
  }
}

// ─── Realtime (no-op) ──────────────────────────────────────────────────────
class MockChannel {
  constructor(name) { this.name = name; this._callbacks = [] }
  on(event, filter, cb) { this._callbacks.push(cb); return this }
  subscribe(cb) { if (cb) cb('SUBSCRIBED'); return this }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
let _currentUser = null

function getOrCreateUser() {
  let userId = localStorage.getItem('tripsync_user_id')
  if (!userId) { userId = genId(); localStorage.setItem('tripsync_user_id', userId) }
  return { id: userId, email: null }
}

const auth = {
  signInAnonymously: async () => {
    const user = getOrCreateUser()
    _currentUser = user
    return { data: { user }, error: null }
  },
  getUser: async () => {
    const user = getOrCreateUser()
    return { data: { user }, error: null }
  },
  signOut: async () => {
    localStorage.removeItem('tripsync_user_id')
    _currentUser = null
    return { error: null }
  }
}

// ─── Public API ────────────────────────────────────────────────────────────
export const supabase = {
  from: (table) => new QueryBuilder(table),
  auth,
  channel: (name) => new MockChannel(name),
  removeChannel: (_channel) => {},
}

// ─── Expose internal helpers for demo seeding ──────────────────────────────
export { genId, getStore, saveStore, getTable, saveTable }
