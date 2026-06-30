import axiosInstance from './axios'

export const getInstallationsApi = (params) =>
  axiosInstance.get('/api/installations', { params })

export const getInstallationByIdApi = (id) =>
  axiosInstance.get(`/api/installations/${id}`)

export const createInstallationApi = (data) =>
  axiosInstance.post('/api/installations', data)

export const updateInstallationApi = (id, data) =>
  axiosInstance.put(`/api/installations/${id}`, data)

export const deleteInstallationApi = (id) =>
  axiosInstance.delete(`/api/installations/${id}`)
