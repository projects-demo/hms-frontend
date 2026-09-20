import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Department } from '@/types/domain'

export const departmentsApi = {
  list: (params: { q?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Department>>>('/api/v1/departments', { params }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Department>>(`/api/v1/departments/${id}`).then(r => r.data.data),
  create: (payload: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Department>>('/api/v1/departments', payload).then(r => r.data.data),
}
