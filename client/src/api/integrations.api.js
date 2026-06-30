import axiosInstance from './axios'

export const getIntegrationsApi = () =>
  axiosInstance.get('/api/integrations')

export const getIntegrationByNameApi = (name) =>
  axiosInstance.get(`/api/integrations/${name}`)

export const upsertIntegrationApi = (name, data) =>
  axiosInstance.put(`/api/integrations/${name}`, data)

export const toggleIntegrationApi = (name) =>
  axiosInstance.patch(`/api/integrations/${name}/toggle`)

export const testIntegrationApi = (name) =>
  axiosInstance.post(`/api/integrations/${name}/test`)
