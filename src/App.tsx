import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { PlatformProtectedRoute } from '@/features/auth/PlatformProtectedRoute'
import { RequireRole } from '@/features/auth/RequireRole'
import { ROLE_GROUPS } from '@/lib/permissions'
import LoginPage from '@/features/auth/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'

import DashboardPage from '@/features/dashboard/DashboardPage'
import ReportsPage from '@/features/reports/ReportsPage'
import PatientsPage from '@/features/patients/PatientsPage'
import PatientDetailPage from '@/features/patients/PatientDetailPage'
import DoctorsPage from '@/features/doctors/DoctorsPage'
import DepartmentsPage from '@/features/departments/DepartmentsPage'
import StaffPage from '@/features/staff/StaffPage'
import AppointmentsPage from '@/features/appointments/AppointmentsPage'
import OpdPage from '@/features/opd/OpdPage'
import IpdPage from '@/features/ipd/IpdPage'
import BillingPage from '@/features/billing/BillingPage'
import BillDetailPage from '@/features/billing/BillDetailPage'
import PharmacyPage from '@/features/pharmacy/PharmacyPage'
import BrandingSettingsPage from '@/features/branding/BrandingSettingsPage'

import PlatformLoginPage from '@/features/platform/PlatformLoginPage'
import { PlatformLayout } from '@/features/platform/PlatformLayout'
import TenantsPage from '@/features/platform/TenantsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/platform/login" element={<PlatformLoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />

              <Route path="/patients" element={<RequireRole allow={ROLE_GROUPS.PATIENT_ACCESS}><PatientsPage /></RequireRole>} />
              <Route path="/patients/:id" element={<RequireRole allow={ROLE_GROUPS.PATIENT_ACCESS}><PatientDetailPage /></RequireRole>} />
              <Route path="/doctors" element={<RequireRole allow={ROLE_GROUPS.DOCTOR_DIRECTORY}><DoctorsPage /></RequireRole>} />
              <Route path="/departments" element={<RequireRole allow={ROLE_GROUPS.ADMIN_ONLY}><DepartmentsPage /></RequireRole>} />
              <Route path="/staff" element={<RequireRole allow={ROLE_GROUPS.ADMIN_ONLY}><StaffPage /></RequireRole>} />
              <Route path="/appointments" element={<RequireRole allow={ROLE_GROUPS.APPOINTMENTS}><AppointmentsPage /></RequireRole>} />
              <Route path="/opd" element={<RequireRole allow={ROLE_GROUPS.CLINICAL}><OpdPage /></RequireRole>} />
              <Route path="/ipd" element={<RequireRole allow={ROLE_GROUPS.IPD_ADMIT}><IpdPage /></RequireRole>} />
              <Route path="/billing" element={<RequireRole allow={ROLE_GROUPS.BILLING}><BillingPage /></RequireRole>} />
              <Route path="/billing/:id" element={<RequireRole allow={ROLE_GROUPS.BILLING}><BillDetailPage /></RequireRole>} />
              <Route path="/pharmacy" element={<RequireRole allow={ROLE_GROUPS.PHARMACY}><PharmacyPage /></RequireRole>} />
              <Route path="/reports" element={<RequireRole allow={ROLE_GROUPS.ANALYTICS}><ReportsPage /></RequireRole>} />
              <Route path="/settings/branding" element={<RequireRole allow={ROLE_GROUPS.ADMIN_ONLY}><BrandingSettingsPage /></RequireRole>} />
            </Route>
          </Route>

          <Route element={<PlatformProtectedRoute />}>
            <Route element={<PlatformLayout />}>
              <Route path="/platform" element={<TenantsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}