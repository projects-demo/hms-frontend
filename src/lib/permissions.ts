import type { Role } from '@/types/domain'

// Mirrors the backend's @PreAuthorize rules on each controller - kept in one
// place so frontend visibility never drifts out of sync with what the API
// actually allows. If you change a role restriction on the backend, update
// the matching entry here.

export const ROLE_GROUPS = {
  ADMIN_ONLY: ['HOSPITAL_ADMIN'] as Role[],
  ALL_STAFF: ['HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST', 'LAB_TECH'] as Role[],
  PATIENT_ACCESS: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'BILLING_STAFF', 'PHARMACIST'] as Role[],
  DOCTOR_DIRECTORY: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST'] as Role[],
  FRONT_DESK: ['HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] as Role[],
  // Appointments menu: nurses & doctors do NOT see "Appointments" nav (they use OPD/IPD)
  APPOINTMENTS: ['HOSPITAL_ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'] as Role[],
  CLINICAL: ['HOSPITAL_ADMIN', 'DOCTOR', 'NURSE'] as Role[],
  DOCTOR_NURSE: ['DOCTOR', 'NURSE'] as Role[],
  DOCTOR_ONLY: ['DOCTOR'] as Role[],
  IPD_ADMIT: ['HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] as Role[],
  IPD_DISCHARGE: ['HOSPITAL_ADMIN', 'DOCTOR'] as Role[],
  BILLING: ['HOSPITAL_ADMIN', 'BILLING_STAFF', 'RECEPTIONIST'] as Role[],
  PHARMACY: ['HOSPITAL_ADMIN', 'PHARMACIST'] as Role[],
  ANALYTICS: ['HOSPITAL_ADMIN', 'BILLING_STAFF'] as Role[],
}

/** Which roles can see each top-level route - used by Sidebar/MobileNav and route guards. */
export const NAV_ACCESS: Record<string, Role[]> = {
  '/': ROLE_GROUPS.ALL_STAFF,
  // Patients: nurses and doctors do not see Patient menu (req 9, 11)
  '/patients': ROLE_GROUPS.PATIENT_ACCESS,
  // Doctors directory: only admin and receptionist (nurses/doctors don't need it in nav)
  '/doctors': ['HOSPITAL_ADMIN', 'RECEPTIONIST'] as Role[],
  '/departments': ROLE_GROUPS.ADMIN_ONLY,
  '/staff': ROLE_GROUPS.ADMIN_ONLY,
  // Appointments nav: receptionist + billing + admin only (nurse=9, doctor=11)
  '/appointments': ['HOSPITAL_ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'] as Role[],
  '/opd': ROLE_GROUPS.CLINICAL,
  '/ipd': ROLE_GROUPS.IPD_ADMIT,
  '/billing': ROLE_GROUPS.BILLING,
  '/pharmacy': ROLE_GROUPS.PHARMACY,
  '/reports': ROLE_GROUPS.ANALYTICS,
  '/settings/branding': ROLE_GROUPS.ADMIN_ONLY,
}

export function hasRole(role: string | undefined | null, allowed: Role[]): boolean {
  return !!role && allowed.includes(role as Role)
}