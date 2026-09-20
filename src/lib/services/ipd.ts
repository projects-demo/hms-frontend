import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Ward, Bed, Admission, RoundNote, AdmissionStatus } from '@/types/domain'

export const ipdApi = {
  createWard: (payload: { name: string; wardType: string; floor?: string }) =>
    apiClient.post<ApiResponse<Ward>>('/api/v1/wards', payload).then(r => r.data.data),
  listWards: (params: { q?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Ward>>>('/api/v1/wards', { params }).then(r => r.data.data),
  createBed: (payload: { wardId: number; bedNumber: string; dailyRate: number }) =>
    apiClient.post<ApiResponse<Bed>>('/api/v1/beds', payload).then(r => r.data.data),
  listBeds: (params: { wardId?: number; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Bed>>>('/api/v1/beds', { params }).then(r => r.data.data),
  availableBeds: (wardId?: number) =>
    apiClient.get<ApiResponse<Bed[]>>('/api/v1/beds/available', { params: { wardId } }).then(r => r.data.data),
  admit: (payload: { patientId: number; admittingDoctorId: number; bedId: number; admissionType: string; reasonForAdmission?: string; provisionalDiagnosis?: string }) =>
    apiClient.post<ApiResponse<Admission>>('/api/v1/admissions', payload).then(r => r.data.data),
  discharge: (id: number, payload: { finalDiagnosis: string; dischargeSummary: string }) =>
    apiClient.patch<ApiResponse<Admission>>(`/api/v1/admissions/${id}/discharge`, payload).then(r => r.data.data),
  addRoundNote: (id: number, payload: { bp?: string; pulse?: string; temperature?: string; spo2?: string; notes?: string }) =>
    apiClient.post<ApiResponse<RoundNote>>(`/api/v1/admissions/${id}/round-notes`, payload).then(r => r.data.data),
  roundNotes: (id: number, params: { page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<RoundNote>>>(`/api/v1/admissions/${id}/round-notes`, { params }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Admission>>(`/api/v1/admissions/${id}`).then(r => r.data.data),
  search: (params: { patientId?: number; status?: AdmissionStatus; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Admission>>>('/api/v1/admissions', { params }).then(r => r.data.data),
}
