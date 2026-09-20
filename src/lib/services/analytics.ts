import { apiClient } from '@/lib/api-client'
import type { ApiResponse } from '@/types/api'
import type { DashboardSummary, RevenueReport, OpdTrend, DoctorPerformance, DepartmentPerformance, RevenueBreakdown, Demographics } from '@/types/domain'

export const analyticsApi = {
  dashboardSummary: () =>
    apiClient.get<ApiResponse<DashboardSummary>>('/api/v1/analytics/dashboard-summary').then(r => r.data.data),
  revenueReport: (from: string, to: string) =>
    apiClient.get<ApiResponse<RevenueReport>>('/api/v1/analytics/revenue-report', { params: { from, to } }).then(r => r.data.data),
  opdTrend: (from: string, to: string) =>
    apiClient.get<ApiResponse<OpdTrend>>('/api/v1/analytics/opd-trend', { params: { from, to } }).then(r => r.data.data),
  doctorPerformance: (from: string, to: string) =>
    apiClient.get<ApiResponse<DoctorPerformance[]>>('/api/v1/analytics/doctor-performance', { params: { from, to } }).then(r => r.data.data),
  departmentPerformance: (from: string, to: string) =>
    apiClient.get<ApiResponse<DepartmentPerformance[]>>('/api/v1/analytics/department-performance', { params: { from, to } }).then(r => r.data.data),
  revenueBreakdown: (from: string, to: string) =>
    apiClient.get<ApiResponse<RevenueBreakdown>>('/api/v1/analytics/revenue-breakdown', { params: { from, to } }).then(r => r.data.data),
  demographics: () =>
    apiClient.get<ApiResponse<Demographics>>('/api/v1/analytics/demographics').then(r => r.data.data),
}