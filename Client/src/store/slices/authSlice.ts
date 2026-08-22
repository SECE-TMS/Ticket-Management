import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authService } from '../../services/authService'
import type { User } from '../../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
}

const storedUser = (() => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
})()

const initialState: AuthState = {
  user: storedUser,
  accessToken: localStorage.getItem('accessToken'),
  status: storedUser && localStorage.getItem('accessToken') ? 'authenticated' : 'idle',
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(email, password)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Login failed'
      return rejectWithValue(message)
    }
  }
)

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    return await authService.me()
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
        ?.message || 'Session expired'
    return rejectWithValue(message)
  }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logout()
  } catch {
    // ignore network errors on logout
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null
    },
    setCredentials(
      state,
      action: { payload: { accessToken: string; user: User } }
    ) {
      state.accessToken = action.payload.accessToken
      state.user = action.payload.user
      state.status = 'authenticated'
      localStorage.setItem('accessToken', action.payload.accessToken)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated'
        state.accessToken = action.payload.accessToken
        state.user = action.payload.user
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'unauthenticated'
        state.error = (action.payload as string) || 'Login failed'
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'authenticated'
        state.user = action.payload
        localStorage.setItem('user', JSON.stringify(action.payload))
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'unauthenticated'
        state.user = null
        state.accessToken = null
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.status = 'unauthenticated'
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      })
  },
})

export const { clearAuthError, setCredentials } = authSlice.actions
export default authSlice.reducer
