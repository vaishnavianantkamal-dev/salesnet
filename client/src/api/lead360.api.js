import axiosInstance from './axios'

export const getLead360Api = (leadId) =>
  axiosInstance.get(`/api/leads/${leadId}/360`)
