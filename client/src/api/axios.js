import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const SESSION_KEY = 'salesnest_auth'

function getStoredToken() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.accessToken || null
    }
  } catch {}
  return null
}

function clearStoredAuth() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 with token refresh
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Don't retry refresh endpoint itself or already-retried requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const raw = sessionStorage.getItem(SESSION_KEY)
        const stored = raw ? JSON.parse(raw) : {}
        const refreshToken = stored.refreshToken || null

        const response = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        )
        // Backend: { success, message, data: { accessToken, refreshToken } }
        const data = response.data?.data || response.data
        const newAccessToken = data.accessToken
        const newRefreshToken = data.refreshToken

        // Update sessionStorage with rotated tokens
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          ...stored,
          accessToken: newAccessToken,
          refreshToken: newRefreshToken || stored.refreshToken,
        }))

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        processQueue(null, newAccessToken)
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearStoredAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
