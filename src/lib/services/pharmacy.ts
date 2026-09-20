import { apiClient } from '@/lib/api-client'
import type { ApiResponse, PageResponse, OptionDto } from '@/types/api'
import type { Drug, DrugBatch, Dispense } from '@/types/domain'

export const pharmacyApi = {
  drugs: {
    search: (params: { q?: string; page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<Drug>>>('/api/v1/pharmacy/drugs', { params }).then(r => r.data.data),
    autocomplete: (q: string, limit = 10) =>
      apiClient.get<ApiResponse<OptionDto[]>>('/api/v1/pharmacy/drugs/autocomplete', { params: { q, limit } }).then(r => r.data.data),
    create: (payload: { name: string; genericName?: string; manufacturer?: string; category?: string; unit?: string; reorderLevel: number }) =>
      apiClient.post<ApiResponse<Drug>>('/api/v1/pharmacy/drugs', payload).then(r => r.data.data),
    receiveBatch: (payload: { drugId: number; batchNumber: string; expiryDate: string; quantity: number; purchasePrice: number; sellingPrice: number }) =>
      apiClient.post<ApiResponse<DrugBatch>>('/api/v1/pharmacy/drugs/batches', payload).then(r => r.data.data),
    lowStock: () =>
      apiClient.get<ApiResponse<DrugBatch[]>>('/api/v1/pharmacy/drugs/low-stock').then(r => r.data.data),
    expiring: (days = 30) =>
      apiClient.get<ApiResponse<DrugBatch[]>>('/api/v1/pharmacy/drugs/expiring', { params: { days } }).then(r => r.data.data),
  },
  dispenses: {
    create: (payload: { patientId: number; prescriptionId?: number; items: { drugId: number; quantity: number }[] }) =>
      apiClient.post<ApiResponse<Dispense>>('/api/v1/pharmacy/dispenses', payload).then(r => r.data.data),
    get: (id: number) =>
      apiClient.get<ApiResponse<Dispense>>(`/api/v1/pharmacy/dispenses/${id}`).then(r => r.data.data),
    byPatient: (patientId: number, params: { page?: number; size?: number }) =>
      apiClient.get<ApiResponse<PageResponse<Dispense>>>(`/api/v1/pharmacy/dispenses/by-patient/${patientId}`, { params }).then(r => r.data.data),
  },
}
