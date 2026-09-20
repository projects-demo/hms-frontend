import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, OptionDto } from '@/types/api'
import type { Patient } from '@/types/domain'

export type PatientRequest = Omit<Patient, 'id' | 'patientCode' | 'age' | 'createdAt' | 'updatedAt'>

export const patientsApi = {
  search: (params: { q?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Patient>>>('/api/v1/patients', { params }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Patient>>(`/api/v1/patients/${id}`).then(r => r.data.data),
  create: (payload: Partial<PatientRequest>) =>
    apiClient.post<ApiResponse<Patient>>('/api/v1/patients', payload).then(r => r.data.data),
  update: (id: number, payload: Partial<PatientRequest>) =>
    apiClient.put<ApiResponse<Patient>>(`/api/v1/patients/${id}`, payload).then(r => r.data.data),
  autocomplete: (q: string, limit = 10) =>
    apiClient.get<ApiResponse<OptionDto[]>>('/api/v1/patients/autocomplete', { params: { q, limit } }).then(r => r.data.data),
  remove: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`/api/v1/patients/${id}`).then(r => r.data.data),
}
