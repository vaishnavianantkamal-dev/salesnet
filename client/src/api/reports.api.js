import axiosInstance from './axios'

export const getLeadSourceReportApi = (params) =>
  axiosInstance.get('/api/reports/lead-source', { params })

export const getSalesReportApi = (params) =>
  axiosInstance.get('/api/reports/sales-funnel', { params })

export const getExecutiveReportApi = (params) =>
  axiosInstance.get('/api/reports/team-performance', { params })
