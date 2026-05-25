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

  it('falls back to mock when backend fails', async () => {
    ;(searchApi.search as any).mockRejectedValueOnce(new Error('network'))
    const { search } = useSearch()
    const res = await search({ k: 3 })
    expect(res.results.length).toBeGreaterThanOrEqual(1)
    expect(res.total).toBeDefined()
  })
})
