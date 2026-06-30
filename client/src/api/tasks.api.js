import axiosInstance from './axios'

export const getTasksApi = (params) =>
  axiosInstance.get('/api/tasks', { params })

export const getTaskByIdApi = (id) =>
  axiosInstance.get(`/api/tasks/${id}`)

export const createTaskApi = (data) =>
  axiosInstance.post('/api/tasks', data)

export const updateTaskApi = (id, data) =>
  axiosInstance.put(`/api/tasks/${id}`, data)

export const deleteTaskApi = (id) =>
  axiosInstance.delete(`/api/tasks/${id}`)

export const markTaskCompleteApi = (id) =>
  axiosInstance.patch(`/api/tasks/${id}/complete`)
