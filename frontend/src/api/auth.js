import axiosClient from './axiosClient'

export const login = (credentials) =>
  axiosClient.post('/auth/login/', credentials)

export const register = (data) =>
  axiosClient.post('/auth/register/', data)

export const logout = (refresh) =>
  axiosClient.post('/auth/logout/', { refresh })

export const getMe = () =>
  axiosClient.get('/auth/me/')
