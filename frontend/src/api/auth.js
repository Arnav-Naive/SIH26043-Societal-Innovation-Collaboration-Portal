import axiosClient from './axiosClient'
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const login = (credentials) =>
  axios.post(`${baseURL}/auth/login/`, credentials)

export const register = (data) =>
  axios.post(`${baseURL}/auth/register/`, data)

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
