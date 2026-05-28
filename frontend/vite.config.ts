import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import { resolve } from "path"

function jsonBody(req: any) {
  return new Promise((resolveBody, reject) => {
    let data = ""
    req.on("data", (chunk: any) => (data += chunk))
    req.on("end", () => {
      try {
        const parsed = data ? JSON.parse(data) : {}
        resolveBody(parsed)
      } catch (e) {
        resolveBody({})
      }
    })
    req.on("error", reject)
  })
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const useMock = (env.VITE_USE_MOCK ?? "false") === "true"

  return {
    plugins: [
      vue(),
      ...(useMock
        ? [
            {
              name: "mock-api",
              configureServer(server) {
                server.middlewares.use(async (req: any, res: any, next: any) => {
                  // Simple mock endpoints for /api/search variants to allow frontend development without backend
                  if (req.url && req.method === "POST") {
                    const body = await jsonBody(req)

                    // Helper to create a mock item
                    const makeItem = (idx: number, datasetName?: string, forcedType?: string) => ({
                      rank: idx,
                      id: `cell_${100000 + idx}`,
                      score: Number((Math.random() * 0.5 + 0.5).toFixed(4)),
                      cell_type: forcedType ?? ["T-cell", "B-cell", "Monocyte", "NK-cell"][Math.floor(Math.random() * 4)],
                      dataset: datasetName ?? ["datasetA", "datasetB"][Math.floor(Math.random() * 2)],
                      metadata: {
                        donor: `donor_${Math.floor(Math.random() * 1000)}`,
                        age_group: ["adult", "child"][Math.floor(Math.random() * 2)],
                        disease: ["healthy", "diseaseX"][Math.floor(Math.random() * 2)],
                      },
                      umap_x: Number((Math.random() * 10 - 5).toFixed(4)),
                      umap_y: Number((Math.random() * 10 - 5).toFixed(4)),
                      gene_expr: {
                        GAPDH: Number((Math.random() * 10).toFixed(3)),
                        ACTB: Number((Math.random() * 10).toFixed(3)),
                      },
                    })

                    // POST /api/search (top-k)
                    if (req.url.startsWith("/api/search") && !req.url.startsWith("/api/search/")) {
                      const k = Number(body.k ?? body.pageSize ?? 10)
                      const page = Number(body.page ?? 1)
                      const pageSize = Number(body.pageSize ?? k)
                      const total = 500
                      const items = Array.from({ length: pageSize }).map((_, i) => {
                        const idx = (page - 1) * pageSize + i + 1
                        return makeItem(idx)
                      })
                      res.setHeader("Content-Type", "application/json")
                      res.end(JSON.stringify({ items, total }))
                      return
                    }

                    // POST /api/search/conditional (filters in body.filters)
                    if (req.url.startsWith("/api/search/conditional")) {
                      const page = Number(body.page ?? 1)
                      const pageSize = Number(body.pageSize ?? 10)
                      const total = 120
                      const forcedType = body?.filters?.cell_type || null
                      const items = Array.from({ length: pageSize }).map((_, i) => {
                        const idx = (page - 1) * pageSize + i + 1
                        return makeItem(idx, undefined, forcedType)
                      })
                      res.setHeader("Content-Type", "application/json")
                      res.end(JSON.stringify({ items, total }))
                      return
                    }

                    // POST /api/search/multi-dataset
                    if (req.url.startsWith("/api/search/multi-dataset")) {
                      const datasets: string[] = body?.datasets ?? ["datasetA", "datasetB"]
                      const page = Number(body.page ?? 1)
                      const pageSize = Number(body.pageSize ?? 10)
                      const total = datasets.length * 100
                      const items = Array.from({ length: pageSize }).map((_, i) => {
                        const idx = (page - 1) * pageSize + i + 1
                        const ds = datasets[i % datasets.length]
                        return makeItem(idx, ds)
                      })
                      res.setHeader("Content-Type", "application/json")
                      res.end(JSON.stringify({ items, total }))
                      return
                    }

                    // POST /api/search/browse (data browsing / faceting)
                    if (req.url.startsWith("/api/search/browse")) {
                      const facets = {
                        cell_type: { "T-cell": 120, "B-cell": 80, Monocyte: 60, "NK-cell": 40 },
                        dataset: { datasetA: 200, datasetB: 100 },
                        disease: { healthy: 220, diseaseX: 80 },
                      }
                      const items = Array.from({ length: 20 }).map((_, i) => makeItem(i + 1))
                      res.setHeader("Content-Type", "application/json")
                      res.end(JSON.stringify({ items, total: 320, facets }))
                      return
                    }
                  }

                  next()
                })
              },
            },
          ]
        : []),
    ],
    resolve: { alias: { "@": resolve(__dirname, "src") } },
    server: { proxy: { "/api": "http://localhost:8000" } },
  }
})
