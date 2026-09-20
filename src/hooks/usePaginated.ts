import { useCallback, useEffect, useState } from 'react'
import type { PageResponse } from '@/types/api'
import { apiErrorMessage } from '@/lib/api-client'
import { toast } from 'sonner'

/**
 * Generic paginated-list data hook. Every list screen in the app uses this
 * instead of hand-rolling page state - keeps the "always paginate" backend
 * discipline consistent on the frontend too.
 */
export function usePaginated<T>(
  fetcher: (page: number, size: number) => Promise<PageResponse<T>>,
  deps: unknown[] = [],
  size = 10,
) {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    fetcher(page, size)
      .then(setData)
      .catch((err) => {
        const msg = apiErrorMessage(err)
        setError(msg)
        toast.error(msg)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, ...deps])

  useEffect(() => { reload() }, [reload])

  // Reset to first page whenever filters (deps) change
  useEffect(() => { setPage(0) }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, page, setPage, reload }
}
