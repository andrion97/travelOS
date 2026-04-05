import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './Icon.jsx'

const TABS = [
  { icon: 'home',    label: 'Home',      path: '' },
  { icon: 'map',     label: 'Itinerary', path: 'itinerary' },
  { icon: 'receipt', label: 'Expenses',  path: 'expenses' },
  { icon: 'check',   label: 'Tasks',     path: 'tasks' },
]

export default function BottomNav({ tripId }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === `/trip/${tripId}` || pathname === `/trip/${tripId}/`
  const current = pathname.split('/').pop()

  return (
    <nav className="tab-bar">
      {TABS.map(tab => {
        const active = tab.path === '' ? isHome : current === tab.path
        return (
          <button
            key={tab.label}
            className={`tab-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path ? `/trip/${tripId}/${tab.path}` : `/trip/${tripId}`)}
          >
            <span className="tab-icon-wrap">
              <Icon name={tab.icon} size={22} strokeWidth={active ? 2 : 1.75} />
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
