import axiosInstance from './axios'

export const getProductsApi = (params) =>
  axiosInstance.get('/api/products', { params })

export const getProductByIdApi = (id) =>
  axiosInstance.get(`/api/products/${id}`)

export const createProductApi = (data) =>
  axiosInstance.post('/api/products', data)

export const updateProductApi = (id, data) =>
  axiosInstance.put(`/api/products/${id}`, data)

export const deleteProductApi = (id) =>
  axiosInstance.delete(`/api/products/${id}`)
