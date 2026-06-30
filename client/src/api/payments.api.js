import axiosInstance from './axios'

export const getPaymentsApi = (params) =>
  axiosInstance.get('/api/payments', { params })

export const getPaymentByIdApi = (id) =>
  axiosInstance.get(`/api/payments/${id}`)

export const createPaymentApi = (data) =>
  axiosInstance.post('/api/payments', data)

export const updatePaymentApi = (id, data) =>
  axiosInstance.put(`/api/payments/${id}`, data)

export const deletePaymentApi = (id) =>
  axiosInstance.delete(`/api/payments/${id}`)
