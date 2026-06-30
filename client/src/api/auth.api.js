import axiosInstance from './axios'

export const loginApi = (email, password) =>
  axiosInstance.post('/api/auth/login', { email, password })

export const logoutApi = () =>
  axiosInstance.post('/api/auth/logout')

export const refreshApi = () =>
  axiosInstance.post('/api/auth/refresh')

export const getMeApi = () =>
  axiosInstance.get('/api/auth/me')

export const changePasswordApi = (currentPassword, newPassword) =>
  axiosInstance.put('/api/auth/change-password', { currentPassword, newPassword })
