import axiosInstance from './axios'

export const getNotificationsApi = (params) =>
  axiosInstance.get('/api/notifications', { params })

export const markReadApi = (id) =>
  axiosInstance.patch(`/api/notifications/${id}/read`)

export const markAllReadApi = () =>
  axiosInstance.patch('/api/notifications/read-all')

export const getUnreadCountApi = () =>
  axiosInstance.get('/api/notifications/unread-count')
