import { Navigate, Route, Routes } from 'react-router-dom'
import { StaffLayout } from './components/layout/StaffLayout'
import { ProtectedRoute } from './router/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { MdiKioskPage } from './features/mdi/MdiKioskPage'
import { OpenDaysListPage } from './features/open-days/OpenDaysListPage'
import { BookingsManagePage } from './features/bookings/BookingsManagePage'
import { MonitoringDashboardPage } from './features/monitoring/MonitoringDashboardPage'
import { GruppiOpenDayPage } from './features/gruppi/GruppiOpenDayPage'
import { MdiListPage } from './features/mdi/MdiListPage'
import { ImpostazioniPage } from './features/impostazioni/ImpostazioniPage'
import { SedeProvider } from './features/sedi/SedeProvider'
import { ConfrontoSediPage } from './features/sedi/ConfrontoSediPage'
import { AdminPage } from './features/sedi/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />

      {/* Pubblico. Le iscrizioni agli Open Day arrivano solo dal Google Modulo (webhook). */}
      {/* Kiosk per sede (link fisso del tablet) o per singolo Open Day. */}
      <Route path="/mdi/kiosk/sede/:sedeSlug" element={<MdiKioskPage />} />
      <Route path="/mdi/kiosk/:openDayId?" element={<MdiKioskPage />} />

      <Route path="/login" element={<LoginPage />} />

      {/* Staff (riservato) */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute>
            <SedeProvider>
              <StaffLayout />
            </SedeProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MonitoringDashboardPage />} />
        <Route path="open-days" element={<OpenDaysListPage />} />
        <Route path="open-days/:openDayId/iscrizioni" element={<BookingsManagePage />} />
        <Route path="open-days/:openDayId/gruppi" element={<GruppiOpenDayPage />} />
        <Route path="mdi" element={<MdiListPage />} />
        <Route path="confronto" element={<ConfrontoSediPage />} />
        <Route path="impostazioni" element={<ImpostazioniPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
