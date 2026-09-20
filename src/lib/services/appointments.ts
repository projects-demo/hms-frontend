import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Appointment, AppointmentSlot, AppointmentStatus } from '@/types/domain'

export const appointmentsApi = {
  availableSlots: (doctorId: number, date: string) =>
    apiClient.get<ApiResponse<AppointmentSlot[]>>('/api/v1/appointment-slots', { params: { doctorId, date } }).then(r => r.data.data),
  generateSlots: (doctorId: number, date: string) =>
    apiClient.post<ApiResponse<AppointmentSlot[]>>('/api/v1/appointment-slots/generate', { doctorId, date }).then(r => r.data.data),
  book: (payload: { patientId: number; doctorId: number; slotId?: number; appointmentDate: string; appointmentType: 'NEW' | 'FOLLOWUP'; freeVisit: boolean; notes?: string }) =>
    apiClient.post<ApiResponse<Appointment>>('/api/v1/appointments', payload).then(r => r.data.data),
  search: (params: { doctorId?: number; patientId?: number; date?: string; status?: AppointmentStatus; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Appointment>>>('/api/v1/appointments', { params }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Appointment>>(`/api/v1/appointments/${id}`).then(r => r.data.data),
  changeStatus: (id: number, status: AppointmentStatus) =>
    apiClient.patch<ApiResponse<Appointment>>(`/api/v1/appointments/${id}/status`, null, { params: { status } }).then(r => r.data.data),
  recordPayment: (id: number, amount: number, paymentMode: string) =>
    apiClient.post<ApiResponse<void>>(`/api/v1/appointments/${id}/payments`, { amount, paymentMode }).then(r => r.data.data),
}
