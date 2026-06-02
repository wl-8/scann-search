import { message } from "ant-design-vue"

export function getErrMsg(err: any, fallback = "操作失败，请稍后重试"): string {
  const detail = err?.response?.data?.detail
  if (detail) return typeof detail === "string" ? detail : JSON.stringify(detail)
  if (!err?.response) return "后端连接失败，请确认服务已启动"
  return fallback
}

function isBackendDown(err: any): boolean {
  if (!err?.response) return true
  const s = err.response?.status
  return s === 502 || s === 503 || s === 504
}

// 防止同一页面多个并发请求在离线时重复弹出同一条 toast
let _lastNetworkErrAt = 0
export function showErrMsg(err: any, fallback = "操作失败，请稍后重试"): void {
  if (isBackendDown(err)) {
    const now = Date.now()
    if (now - _lastNetworkErrAt > 1000) {
      _lastNetworkErrAt = now
      message.error("后端连接失败，请确认服务已启动")
    }
  } else {
    message.error(getErrMsg(err, fallback))
  }
}
