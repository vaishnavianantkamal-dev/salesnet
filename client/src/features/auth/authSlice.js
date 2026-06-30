import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loginApi, logoutApi, getMeApi } from '../../api/auth.api'

const SESSION_KEY = 'salesnest_auth'

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveToSession(data) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {}
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {}
}

const persisted = loadFromSession()

const initialState = {
  user: persisted?.user || null,
  accessToken: persisted?.accessToken || null,
  isAuthenticated: !!persisted?.accessToken,
  isLoading: false,
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginApi(email, password)
      // Backend sends { success, message, data: { user, accessToken, refreshToken } }
      return response.data?.data || response.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || err.message || 'Login failed'
      )
    }
  }
)

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutApi()
    } catch (err) {
      // Ignore logout errors
    }
  }
)

export const getMeThunk = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMeApi()
      // Backend: { success, message, data: { user } }
      return response.data?.data?.user || response.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch user'
      )
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload
      state.user = user
      state.accessToken = accessToken
      state.isAuthenticated = true
      state.error = null
      saveToSession({ user, accessToken })
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.isAuthenticated = false
      state.error = null
      clearSession()
    },
    setLoading(state, action) {
      state.isLoading = action.payload
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      saveToSession({ user: state.user, accessToken: state.accessToken })
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false
        const { user, accessToken, refreshToken } = action.payload
        state.user = user
        state.accessToken = accessToken
        state.isAuthenticated = true
        state.error = null
        saveToSession({ user, accessToken, refreshToken })
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
        state.error = null
        clearSession()
      })
      // Get Me
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.user = action.payload
        const raw = sessionStorage.getItem(SESSION_KEY)
        const stored = raw ? JSON.parse(raw) : {}
        saveToSession({ ...stored, user: action.payload })
      })
  },
})

export const { setCredentials, clearCredentials, setLoading, updateUser } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer
