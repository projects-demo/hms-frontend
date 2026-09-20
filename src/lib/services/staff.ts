import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { StaffMember } from '@/types/domain'

export interface StaffRequest {
  username?: string; email?: string; password?: string; fullName?: string; phone?: string
  staffType: string; departmentId?: number; shift?: string; joiningDate?: string
}

export const staffApi = {
  list: (params: { staffType?: string; q?: string; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<StaffMember>>>('/api/v1/staff', { params }).then(r => r.data.data),
  create: (payload: StaffRequest) =>
    apiClient.post<ApiResponse<StaffMember>>('/api/v1/staff', payload).then(r => r.data.data),
  deactivate: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`/api/v1/staff/${id}/deactivate`).then(r => r.data.data),
}
