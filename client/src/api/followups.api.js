import axiosInstance from './axios'

export const getFollowupsApi = (params) =>
  axiosInstance.get('/api/followups', { params })

export const getFollowupByIdApi = (id) =>
  axiosInstance.get(`/api/followups/${id}`)

export const createFollowupApi = (data) =>
  axiosInstance.post('/api/followups', data)

export const updateFollowupApi = (id, data) =>
  axiosInstance.put(`/api/followups/${id}`, data)

export const deleteFollowupApi = (id) =>
  axiosInstance.delete(`/api/followups/${id}`)
