import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { LoginResponse, Tenant, TenantStatus } from '@/types/domain'

export const platformAuthApi = {
  login: (username: string, password: string) =>
    apiClient.post<ApiResponse<LoginResponse>>('/api/v1/platform/auth/login', { username, password }).then(r => r.data.data),
}

export interface OnboardTenantRequest {
  tenantCode: string
  hospitalName: string
  legalName?: string
  contactEmail: string
  contactPhone?: string
  addressLine1?: string
  city?: string
  state?: string
  postalCode?: string
  adminUsername: string
  adminFullName: string
  adminPassword: string
}

export const tenantsApi = {
  list: (params: { status?: TenantStatus | 'ALL'; page?: number; size?: number }) =>
    apiClient.get<ApiResponse<PageResponse<Tenant>>>('/api/v1/platform/tenants', {
      params: { ...params, status: params.status === 'ALL' ? undefined : params.status },
    }).then(r => r.data.data),
  get: (id: number) =>
    apiClient.get<ApiResponse<Tenant>>(`/api/v1/platform/tenants/${id}`).then(r => r.data.data),
  onboard: (payload: OnboardTenantRequest) =>
    apiClient.post<ApiResponse<Tenant>>('/api/v1/platform/tenants', payload).then(r => r.data.data),
  suspend: (id: number) =>
    apiClient.patch<ApiResponse<Tenant>>(`/api/v1/platform/tenants/${id}/suspend`).then(r => r.data.data),
  reactivate: (id: number) =>
    apiClient.patch<ApiResponse<Tenant>>(`/api/v1/platform/tenants/${id}/reactivate`).then(r => r.data.data),
  deactivate: (id: number) =>
    apiClient.patch<ApiResponse<Tenant>>(`/api/v1/platform/tenants/${id}/deactivate`).then(r => r.data.data),
}