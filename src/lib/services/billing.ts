import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, OptionDto } from '@/types/api'
import type { Bill, BillStatus, BillingAuditLog, ChargeMaster, ChargeMasterSummary, ChargeType, DiscountMaster } from '@/types/domain'

export const billingApi = {
  auditLogs: {
    search: (params: { billId?: number; page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<BillingAuditLog>>>('/api/v1/billing-audit-logs', { params }).then(r => r.data.data),
  },
  chargeTypes: {
    list: () => apiClient.get<ApiResponse<ChargeType[]>>('/api/v1/charge-types').then(r => r.data.data),
    create: (payload: { name: string; code?: string; active?: boolean }) => apiClient.post<ApiResponse<ChargeType>>('/api/v1/charge-types', payload).then(r => r.data.data),
    update: (id: number, payload: { name: string; code?: string; active?: boolean }) => apiClient.put<ApiResponse<ChargeType>>(`/api/v1/charge-types/${id}`, payload).then(r => r.data.data),
  },
  chargeMaster: {
    search: (params: { q?: string; chargeTypeId?: number; active?: boolean; includeInactive?: boolean; page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<ChargeMaster>>>('/api/v1/charge-master', { params }).then(r => r.data.data),
    summary: () => apiClient.get<ApiResponse<ChargeMasterSummary>>('/api/v1/charge-master/summary').then(r => r.data.data),
    autocomplete: (q: string, limit = 10) =>
      apiClient.get<ApiResponse<OptionDto[]>>('/api/v1/charge-master/autocomplete', { params: { q, limit } }).then(r => r.data.data),
    create: (payload: { chargeTypeId: number; code?: string; name: string; defaultPrice: number; applicableDoctorId?: number }) =>
      apiClient.post<ApiResponse<ChargeMaster>>('/api/v1/charge-master', payload).then(r => r.data.data),
    update: (id: number, payload: { chargeTypeId: number; code?: string; name: string; defaultPrice: number; applicableDoctorId?: number }) =>
      apiClient.put<ApiResponse<ChargeMaster>>(`/api/v1/charge-master/${id}`, payload).then(r => r.data.data),
    setActive: (id: number, active: boolean) => apiClient.patch<ApiResponse<ChargeMaster>>(`/api/v1/charge-master/${id}/active`, null, { params: { active } }).then(r => r.data.data),
  },
  discounts: {
    list: () => apiClient.get<ApiResponse<DiscountMaster[]>>('/api/v1/discount-master').then(r => r.data.data),
    create: (payload: { name: string; percentage: number }) =>
      apiClient.post<ApiResponse<DiscountMaster>>('/api/v1/discount-master', payload).then(r => r.data.data),
    update: (id: number, payload: { name: string; percentage: number }) =>
      apiClient.put<ApiResponse<DiscountMaster>>(`/api/v1/discount-master/${id}`, payload).then(r => r.data.data),
  },
  bills: {
    create: (payload: { patientId: number; admissionId?: number; appointmentId?: number; billType: string; items: { chargeMasterId?: number; description: string; quantity: number; unitPrice: number }[] }) =>
      apiClient.post<ApiResponse<Bill>>('/api/v1/bills', payload).then(r => r.data.data),
    finalize: (id: number, discountMasterId?: number, taxAmount?: number) =>
      apiClient.patch<ApiResponse<Bill>>(`/api/v1/bills/${id}/finalize`, { discountMasterId, taxAmount }).then(r => r.data.data),
    recordReceipt: (id: number, amount: number, paymentMode: string) =>
      apiClient.post<ApiResponse<void>>(`/api/v1/bills/${id}/receipts`, { amount, paymentMode }).then(r => r.data.data),
    refund: (id: number, amount: number, reason: string) =>
      apiClient.post<ApiResponse<void>>(`/api/v1/bills/${id}/refunds`, { amount, reason }).then(r => r.data.data),
    cancel: (id: number) =>
      apiClient.patch<ApiResponse<Bill>>(`/api/v1/bills/${id}/cancel`).then(r => r.data.data),
    get: (id: number) =>
      apiClient.get<ApiResponse<Bill>>(`/api/v1/bills/${id}`).then(r => r.data.data),
    search: (params: { patientId?: number; status?: BillStatus; page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<Bill>>>('/api/v1/bills', { params }).then(r => r.data.data),
  },
}
