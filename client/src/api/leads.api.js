import axiosInstance from './axios'

export const getLeadsApi = (params) =>
  axiosInstance.get('/api/leads', { params })

export const getLeadByIdApi = (id) =>
  axiosInstance.get(`/api/leads/${id}`)

export const createLeadApi = (data) =>
  axiosInstance.post('/api/leads', data)

export const updateLeadApi = (id, data) =>
  axiosInstance.put(`/api/leads/${id}`, data)

export const assignLeadApi = (id, assignedTo) =>
  axiosInstance.patch(`/api/leads/${id}/assign`, { assignedTo })

export const changeLeadStageApi = (id, stage) =>
  axiosInstance.patch(`/api/leads/${id}/stage`, { stage })

export const deleteLeadApi = (id) =>
  axiosInstance.delete(`/api/leads/${id}`)

export const getActionQueueApi = () =>
  axiosInstance.get('/api/leads/action-queue')

export const importLeadsApi = (formData) =>
  axiosInstance.post('/api/leads/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const createPublicLeadApi = (data) =>
  axiosInstance.post('/api/leads/public', data)

export const getLeadActivitiesApi = (leadId, params) =>
  axiosInstance.get(`/api/leads/${leadId}/activities`, { params })

export const createLeadNoteApi = (leadId, data) =>
  axiosInstance.post(`/api/leads/${leadId}/notes`, data)
