import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api',
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return axiosClient(originalRequest)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
