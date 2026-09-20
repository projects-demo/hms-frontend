import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, OptionDto } from '@/types/api'
import type { Doctor, DoctorAvailability } from '@/types/domain'

export interface DoctorRequest {
  username?: string; email?: string; password?: string; fullName?: string; phone?: string
  departmentId: number; specialization: string; licenseNumber: string
  licenseIssueDate?: string; licenseExpiryDate?: string; qualifications?: string
  experienceYears: number; consultationFee: number; maxPatientsPerDay: number; officeRoomNumber?: string
}

export const doctorsApi = {
  list: (params: { departmentId?: number; specialization?: string; q?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Doctor>>>('/api/v1/doctors', { params }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Doctor>>(`/api/v1/doctors/${id}`).then(r => r.data.data),
  create: (payload: DoctorRequest) =>
    apiClient.post<ApiResponse<Doctor>>('/api/v1/doctors', payload).then(r => r.data.data),
  update: (id: number, payload: DoctorRequest) =>
    apiClient.put<ApiResponse<Doctor>>(`/api/v1/doctors/${id}`, payload).then(r => r.data.data),
  autocomplete: (q: string, limit = 10) =>
    apiClient.get<ApiResponse<OptionDto[]>>('/api/v1/doctors/autocomplete', { params: { q, limit } }).then(r => r.data.data),
  setAvailabilityStatus: (id: number, status: string) =>
    apiClient.patch<ApiResponse<void>>(`/api/v1/doctors/${id}/availability-status`, null, { params: { status } }).then(r => r.data.data),
  deactivate: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`/api/v1/doctors/${id}/deactivate`).then(r => r.data.data),
  listAvailability: (doctorId: number) =>
    apiClient.get<ApiResponse<DoctorAvailability[]>>(`/api/v1/doctors/${doctorId}/availability`).then(r => r.data.data),
  addAvailability: (doctorId: number, payload: { dayOfWeek: number; startTime: string; endTime: string; slotDurationMins: number }) =>
    apiClient.post<ApiResponse<DoctorAvailability>>(`/api/v1/doctors/${doctorId}/availability`, payload).then(r => r.data.data),
}