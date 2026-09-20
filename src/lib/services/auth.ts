import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { LoginResponse } from '@/types/domain'

export const authApi = {
  login: (tenantCode: string, username: string, password: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', { tenantCode, username, password })
      .then(r => r.data.data),
}
