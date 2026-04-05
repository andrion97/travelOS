import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import CreateTrip from './pages/CreateTrip.jsx'
import JoinTrip from './pages/JoinTrip.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Preferences from './pages/Preferences.jsx'
import Destinations from './pages/Destinations.jsx'
import DateAvailability from './pages/DateAvailability.jsx'
import BudgetInput from './pages/BudgetInput.jsx'
import ItineraryBuilder from './pages/ItineraryBuilder.jsx'
import ExpenseLogger from './pages/ExpenseLogger.jsx'
import TaskBoard from './pages/TaskBoard.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="phone-frame">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/create" element={<CreateTrip />} />
            <Route path="/join/:code" element={<JoinTrip />} />
            <Route path="/trip/:id" element={<Dashboard />} />
            <Route path="/trip/:id/preferences" element={<Preferences />} />
            <Route path="/trip/:id/destinations" element={<Destinations />} />
            <Route path="/trip/:id/dates" element={<DateAvailability />} />
            <Route path="/trip/:id/budget" element={<BudgetInput />} />
            <Route path="/trip/:id/itinerary" element={<ItineraryBuilder />} />
            <Route path="/trip/:id/expenses" element={<ExpenseLogger />} />
            <Route path="/trip/:id/tasks" element={<TaskBoard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
