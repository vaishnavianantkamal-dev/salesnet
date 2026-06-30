import axiosInstance from './axios'

export const getConversationsApi = (leadId, params) =>
  axiosInstance.get(`/api/leads/${leadId}/conversations`, { params })

export const sendTemplateApi = (leadId, data) =>
  axiosInstance.post(`/api/leads/${leadId}/conversations/template`, data)

export const sendMessageApi = (leadId, data) =>
  axiosInstance.post(`/api/leads/${leadId}/conversations/message`, data)

export const getInboxApi = (params) =>
  axiosInstance.get('/api/inbox', { params })

export const markConversationReadApi = (leadId) =>
  axiosInstance.patch(`/api/leads/${leadId}/conversations/read`)
