import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  clearCredentials,
  loginThunk,
} from '../features/auth/authSlice'
import { logoutApi } from '../api/auth.api'
import { disconnectSocket } from '../app/socket'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectIsLoading)
  const error = useSelector(selectAuthError)

  const login = async (email, password) => {
    const result = await dispatch(loginThunk({ email, password }))
    if (loginThunk.fulfilled.match(result)) {
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {}
    dispatch(clearCredentials())
    disconnectSocket()
    navigate('/login')
  }

  const hasPermission = (permission) => {
    if (!user) return false
    if (user.role?.key === 'super_admin') return true
    const perms = user.role?.permissions || user.permissions || []
    return perms.includes(permission)
  }

  const hasRole = (roleKey) => {
    if (!user) return false
    return user.role?.key === roleKey || user.role === roleKey
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
  }
}
