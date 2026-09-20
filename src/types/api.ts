// Mirrors com.hms.common.dto.ApiResponse / PageResponse / OptionDto on the backend.

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface OptionDto {
  id: number
  label: string
  subLabel?: string | null
}

export interface ApiErrorBody {
  success: false
  message: string
  status: number
  path: string
  timestamp: string
  fieldErrors?: { field: string; message: string }[]
}
