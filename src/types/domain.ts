// Domain types mirroring backend response DTOs.

export type Role =
  | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'
  | 'BILLING_STAFF' | 'PHARMACIST' | 'LAB_TECH'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
  userId: number
  username: string
  fullName: string
  role: Role
  tenantCode: string
  hospitalName: string | null
}

export interface Department {
  id: number
  name: string
  description: string | null
  active: boolean
}

export interface Doctor {
  id: number
  doctorCode: string
  fullName: string
  userId: number
  departmentId: number
  departmentName: string
  specialization: string
  licenseNumber: string
  licenseExpiryDate: string | null
  qualifications: string | null
  experienceYears: number
  consultationFee: number
  maxPatientsPerDay: number
  officeRoomNumber: string | null
  availabilityStatus: 'AVAILABLE' | 'ON_LEAVE' | 'INACTIVE'
  active: boolean
}

export interface StaffMember {
  id: number
  staffCode: string
  userId: number
  staffType: 'NURSE' | 'RECEPTIONIST' | 'BILLING_STAFF' | 'PHARMACIST' | 'LAB_TECH'
  departmentId: number | null
  shift: string | null
  joiningDate: string | null
  active: boolean
}

export interface Patient {
  id: number
  patientCode: string
  firstName: string
  lastName: string
  dob: string | null
  age: number | null
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  primaryPhone: string
  secondaryPhone: string | null
  email: string | null
  emergencyName: string | null
  emergencyContact: string | null
  governmentIdType: string | null
  governmentIdNumber: string | null
  insuranceProvider: string | null
  policyNumber: string | null
  groupId: string | null
  street: string | null
  city: string | null
  state: string | null
  country: string | null
  zipCode: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentSlot {
  id: number
  doctorId: number
  slotDate: string
  startTime: string
  endTime: string
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'
}

export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Appointment {
  id: number
  appointmentCode: string
  patientId: number
  doctorId: number
  slotId: number | null
  appointmentDate: string
  appointmentType: 'NEW' | 'FOLLOWUP'
  status: AppointmentStatus
  feeAmount: number
  freeVisit: boolean
  paid: boolean
  notes: string | null
}

export interface DoctorAvailability {
  id: number
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMins: number
}

export interface Consultation {
  id: number
  appointmentId: number
  patientId: number
  doctorId: number
  chiefComplaint: string | null
  bp: string | null
  pulse: string | null
  temperature: string | null
  weightKg: number | null
  heightCm: number | null
  spo2: string | null
  diagnosis: string | null
  clinicalNotes: string | null
  status: 'DRAFT' | 'COMPLETED'
  startedAt: string
  completedAt: string | null
}

export interface Prescription {
  id: number
  consultationId: number
  items: { id: number; drugName: string; dosage: string | null; frequency: string | null; duration: string | null; instructions: string | null }[]
}

export type WardType = 'GENERAL' | 'ICU' | 'PRIVATE' | 'SEMI_PRIVATE' | 'EMERGENCY'
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'
export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED' | 'DECEASED'

export interface Ward {
  id: number
  name: string
  wardType: WardType
  floor: string | null
  totalBeds: number
  active: boolean
}

export interface Bed {
  id: number
  wardId: number
  wardName: string
  bedNumber: string
  status: BedStatus
  dailyRate: number
}

export interface Admission {
  id: number
  admissionCode: string
  patientId: number
  admittingDoctorId: number
  bedId: number
  bedNumber: string
  admissionType: 'EMERGENCY' | 'PLANNED' | 'TRANSFER'
  reasonForAdmission: string | null
  provisionalDiagnosis: string | null
  finalDiagnosis: string | null
  status: AdmissionStatus
  admissionDate: string
  expectedDischargeDate: string | null
  dischargeDate: string | null
}

export interface RoundNote {
  id: number
  admissionId: number
  recordedAt: string
  bp: string | null
  pulse: string | null
  temperature: string | null
  spo2: string | null
  notes: string | null
}

export type BillType = 'OPD' | 'IPD' | 'PHARMACY'
export type BillStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED'

export interface ChargeMaster {
  id: number
  chargeTypeId: number
  chargeTypeName: string
  code: string
  name: string
  defaultPrice: number
  active: boolean
}

export interface ChargeType {
  id: number
  name: string
}

export interface Bill {
  id: number
  billNumber: string
  patientId: number
  admissionId: number | null
  appointmentId: number | null
  billType: BillType
  status: BillStatus
  subtotalAmount: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  finalizedAt: string | null
  items: { id: number; description: string; quantity: number; unitPrice: number; amount: number }[]
}

export interface Drug {
  id: number
  drugCode: string
  name: string
  genericName: string | null
  manufacturer: string | null
  category: string | null
  unit: string
  reorderLevel: number
  active: boolean
}

export interface DrugBatch {
  id: number
  drugId: number
  drugName: string
  batchNumber: string
  expiryDate: string
  quantityAvailable: number
  purchasePrice: number
  sellingPrice: number
}

export interface Dispense {
  id: number
  dispenseCode: string
  patientId: number
  totalAmount: number
  dispensedAt: string
  items: { drugId: number; batchId: number; quantity: number; unitPrice: number; amount: number }[]
}

export interface DashboardSummary {
  todaysAppointments: number
  todaysCompletedAppointments: number
  todaysRevenue: number
  activeAdmissions: number
  totalBeds: number
  occupiedBeds: number
  bedOccupancyPercent: number
  lowStockDrugBatches: number
  expiringDrugBatches30Days: number
}

export interface RevenueReport {
  from: string
  to: string
  totalRevenue: number
  dailyBreakdown: { date: string; revenue: number }[]
}

export interface OpdTrend {
  from: string
  to: string
  totalVisits: number
  newVisits: number
  followupVisits: number
  newPercent: number
  followupPercent: number
  dailyBreakdown: { date: string; total: number; newCount: number; followupCount: number }[]
}

export interface DoctorPerformance {
  doctorId: number
  doctorName: string
  departmentName: string
  visitCount: number
  revenue: number
}

export interface DepartmentPerformance {
  departmentId: number
  departmentName: string
  visitCount: number
  revenue: number
}

export interface RevenueBreakdown {
  from: string
  to: string
  opdRevenue: number
  ipdRevenue: number
  pharmacyRevenue: number
  totalRevenue: number
  subtotalAmount: number
  discountTotal: number
  taxTotal: number
  netRevenue: number
  billCount: number
  transactionCount: number
  paymentModeBreakdown: { mode: string; amount: number; count: number }[]
}

export interface Demographics {
  genderBreakdown: { gender: string; count: number }[]
  ageGroupBreakdown: { ageGroup: string; count: number }[]
}

// --- Platform admin: hospital (tenant) management ---
export type TenantStatus = 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'

export interface Tenant {
  id: number
  tenantCode: string
  schemaName: string
  hospitalName: string
  contactEmail: string
  contactPhone: string | null
  city: string | null
  state: string | null
  subscriptionPlan: string
  status: TenantStatus
  provisionedAt: string | null
  createdAt: string
}

// --- Hospital branding (logo, colors, banner/footer text) ---
export interface Branding {
  logoDataUrl: string | null
  primaryColor: string | null
  accentColor: string | null
  headerBannerText: string | null
  footerText: string | null
}