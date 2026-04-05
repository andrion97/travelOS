// Budget input is handled within the DateAvailability page (tab='budget')
// This redirect ensures the /budget route still works
import { useParams, Navigate } from 'react-router-dom'
export default function BudgetInput() {
  const { id } = useParams()
  return <Navigate to={`/trip/${id}/dates`} replace />
}
