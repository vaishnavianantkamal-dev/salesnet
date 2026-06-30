import axiosInstance from './axios'

export const getRolesApi = () =>
  axiosInstance.get('/api/roles')

export const getRoleByIdApi = (id) =>
  axiosInstance.get(`/api/roles/${id}`)

export const createRoleApi = (data) =>
  axiosInstance.post('/api/roles', data)

export const updateRoleApi = (id, data) =>
  axiosInstance.put(`/api/roles/${id}`, data)

export const deleteRoleApi = (id) =>
  axiosInstance.delete(`/api/roles/${id}`)

export const getPermissionsApi = () =>
  axiosInstance.get('/api/permissions')
