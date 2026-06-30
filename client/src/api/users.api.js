import axiosInstance from './axios'

export const getUsersApi = (params) =>
  axiosInstance.get('/api/users', { params })

export const getUserByIdApi = (id) =>
  axiosInstance.get(`/api/users/${id}`)

export const createUserApi = (data) =>
  axiosInstance.post('/api/users', data)

export const updateUserApi = (id, data) =>
  axiosInstance.put(`/api/users/${id}`, data)

export const deleteUserApi = (id) =>
  axiosInstance.delete(`/api/users/${id}`)

export const toggleUserStatusApi = (id) =>
  axiosInstance.patch(`/api/users/${id}/toggle-status`)
