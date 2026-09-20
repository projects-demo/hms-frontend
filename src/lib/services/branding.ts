import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { Branding } from '@/types/domain'

export const brandingApi = {
  get: () =>
    apiClient.get<ApiResponse<Branding>>('/api/v1/branding').then(r => r.data.data),
  update: (payload: Branding) =>
    apiClient.put<ApiResponse<Branding>>('/api/v1/branding', payload).then(r => r.data.data),
}