import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { fetchMe } from './store/slices/authSlice'
import { ToastProvider } from './context/ToastContext'
import { AppRoutes } from './routes/AppRoutes'
import { PageLoader } from './components/common/LoadingSpinner'

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { accessToken, status } = useAppSelector((s) => s.auth)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!bootstrapped.current && accessToken) {
      bootstrapped.current = true
      void dispatch(fetchMe())
    }
  }, [accessToken, dispatch])

  if (accessToken && status === 'loading' && bootstrapped.current) {
    return <PageLoader fullScreen />
  }

  return children
}

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthBootstrap>
          <AppRoutes />
        </AuthBootstrap>
      </ToastProvider>
    </Provider>
  )
}
