import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, OptionDto } from '@/types/api'
import type { Bill, BillStatus, ChargeMaster, ChargeType } from '@/types/domain'

export const billingApi = {
  chargeTypes: {
    list: () => apiClient.get<ApiResponse<ChargeType[]>>('/api/v1/charge-types').then(r => r.data.data),
    create: (name: string) => apiClient.post<ApiResponse<ChargeType>>('/api/v1/charge-types', { name }).then(r => r.data.data),
  },
  chargeMaster: {
    search: (params: { q?: string; page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<ChargeMaster>>>('/api/v1/charge-master', { params }).then(r => r.data.data),
    autocomplete: (q: string, limit = 10) =>
      apiClient.get<ApiResponse<OptionDto[]>>('/api/v1/charge-master/autocomplete', { params: { q, limit } }).then(r => r.data.data),
    create: (payload: { chargeTypeId: number; code: string; name: string; defaultPrice: number }) =>
      apiClient.post<ApiResponse<ChargeMaster>>('/api/v1/charge-master', payload).then(r => r.data.data),
  },
  bills: {
    create: (payload: { patientId: number; admissionId?: number; appointmentId?: number; billType: string; items: { chargeMasterId?: number; description: string; quantity: number; unitPrice: number }[] }) =>
      apiClient.post<ApiResponse<Bill>>('/api/v1/bills', payload).then(r => r.data.data),
    finalize: (id: number, discountAmount?: number, taxAmount?: number) =>
      apiClient.patch<ApiResponse<Bill>>(`/api/v1/bills/${id}/finalize`, { discountAmount, taxAmount }).then(r => r.data.data),
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
