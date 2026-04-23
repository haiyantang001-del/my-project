import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { DictItem } from '@/types'

export function useDict() {
  const { data, isLoading } = useQuery({
    queryKey: ['dict'],
    queryFn: async () => {
      const response = await apiClient.get('/dict')
      return response.data.data as Record<string, DictItem[]>
    },
    staleTime: 5 * 60 * 1000
  })

  const getLabel = (category: string, code: string): string => {
    if (!data || !data[category]) return code
    const item = data[category].find(d => d.code === code)
    return item?.label || code
  }

  const getOptions = (category: string): { value: string; label: string }[] => {
    if (!data || !data[category]) return []
    return data[category].map(d => ({ value: d.code, label: d.label }))
  }

  return { dict: data || {}, isLoading, getLabel, getOptions }
}
