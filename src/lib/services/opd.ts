import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Consultation, Prescription } from '@/types/domain'

export const opdApi = {
  start: (payload: { appointmentId: number; patientId: number; doctorId: number; chiefComplaint?: string }) =>
    apiClient.post<ApiResponse<Consultation>>('/api/v1/consultations', payload).then(r => r.data.data),
  complete: (id: number, payload: {
    vitals?: { bp?: string; pulse?: string; temperature?: string; weightKg?: number; heightCm?: number; spo2?: string }
    diagnosis?: string; clinicalNotes?: string
    prescriptionItems?: { drugName: string; dosage?: string; frequency?: string; duration?: string; instructions?: string }[]
  }) =>
    apiClient.patch<ApiResponse<Consultation>>(`/api/v1/consultations/${id}/complete`, payload).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Consultation>>(`/api/v1/consultations/${id}`).then(r => r.data.data),
  prescription: (consultationId: number) =>
    apiClient.get<ApiResponse<Prescription>>(`/api/v1/consultations/${consultationId}/prescription`).then(r => r.data.data),
  byPatient: (patientId: number, params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Consultation>>>(`/api/v1/consultations/by-patient/${patientId}`, { params }).then(r => r.data.data),
  byDoctor: (doctorId: number, params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Consultation>>>(`/api/v1/consultations/by-doctor/${doctorId}`, { params }).then(r => r.data.data),
}
