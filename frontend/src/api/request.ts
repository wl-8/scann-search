import axios from "axios"

const BASE = (import.meta.env.VITE_API_BASE as string) || "/api"

const request = axios.create({ baseURL: BASE, timeout: 30000 })

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any
  return config
})

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) window.location.href = "/login"
    return Promise.reject(err)
  }
)

export default request
