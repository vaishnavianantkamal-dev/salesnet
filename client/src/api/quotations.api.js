import axiosInstance from './axios'

export const getQuotationsApi = (params) =>
  axiosInstance.get('/api/quotations', { params })

export const getQuotationByIdApi = (id) =>
  axiosInstance.get(`/api/quotations/${id}`)

export const createQuotationApi = (data) =>
  axiosInstance.post('/api/quotations', data)

export const updateQuotationApi = (id, data) =>
  axiosInstance.put(`/api/quotations/${id}`, data)

export const getLeadQuotationsApi = (leadId) =>
  axiosInstance.get(`/api/leads/${leadId}/quotations`)
