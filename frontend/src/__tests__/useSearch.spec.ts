import { vi, describe, it, expect, beforeEach } from 'vitest'

// mock the search API before importing the composable
vi.mock('@/api/search', () => ({
  search: vi.fn(),
}))

import { useSearch } from '@/composables/useSearch'
import * as searchApi from '@/api/search'

describe('useSearch composable', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls backend search and returns results and total', async () => {
    const mockResp = { items: [{ id: 'cell_1', score: 0.9 }], total: 1 }
    ;(searchApi.search as any).mockResolvedValueOnce(mockResp)

    const { search } = useSearch()
    const res = await search({ k: 1, page: 1, pageSize: 10 })

    expect(res.results).toHaveLength(1)
    expect(res.total).toBe(1)
  })

  it('surfaces backend failures instead of returning mock data', async () => {
    const error = new Error('network')
    ;(searchApi.search as any).mockRejectedValueOnce(error)
    const { search } = useSearch()
    await expect(search({ k: 3 })).rejects.toThrow('network')
  })
})
