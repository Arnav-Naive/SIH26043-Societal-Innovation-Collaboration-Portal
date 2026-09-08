import axiosClient from './axiosClient'

export const login = (credentials) =>
  axiosClient.post('/auth/login/', credentials)

export const register = (data) =>
  axiosClient.post('/auth/register/', data)

export const logout = (refresh) =>
  axiosClient.post('/auth/logout/', { refresh })

export const getMe = () =>
  axiosClient.get('/auth/me/')

export const updateProfile = (data) =>
  axiosClient.put('/auth/profile/', data)

export const getNotifications = () =>
  axiosClient.get('/auth/notifications/')

export const markNotificationRead = (id) =>
  axiosClient.post(`/auth/notifications/${id}/read/`)

export const markAllNotificationsRead = () =>
  axiosClient.post('/auth/notifications/read-all/')
