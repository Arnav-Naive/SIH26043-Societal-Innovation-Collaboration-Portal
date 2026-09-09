import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token to every request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-refresh access token on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // Only attempt token refresh if:
    // 1. Response was 401
    // 2. We haven't retried yet
    // 3. There IS an access token (i.e. this was an authenticated request)
    const hasToken = !!localStorage.getItem('access_token')
    if (error.response?.status === 401 && !originalRequest._retry && hasToken) {
      originalRequest._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const baseURL = import.meta.env.VITE_API_URL || '/api'
        const { data } = await axios.post(`${baseURL}/auth/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return axiosClient(originalRequest)
      } catch {
        // Refresh failed — clear session and force re-login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
