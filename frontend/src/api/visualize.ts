import request from "./request"

export function locateCells(datasetId: number, cellIds: string[], mode: "2d" | "3d" = "2d") {
  return request.post(`/visualize/${datasetId}/locate`, { cell_ids: cellIds, mode }) as Promise<{
    dataset_id: number
    mode: string
    points: Array<{ cell_id: string; x: number; y: number; z?: number | null; row_index: number }>
  }>
}
