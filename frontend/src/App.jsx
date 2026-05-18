import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import WebApp from '@twa-dev/sdk'
import { useTelegramTheme } from './hooks/useTelegramTheme'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import LibraryPage from './pages/LibraryPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'

const AppContext = createContext(null)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

const AppProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [user, setUser] = useState(null)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('home')

  useEffect(() => {
    try {
      if (typeof WebApp !== 'undefined' && WebApp) {
        WebApp.ready?.()
        WebApp.expand?.()
        const isLight = WebApp.colorScheme === 'light'
        const bg = isLight ? '#f8fafc' : '#17212B'
        WebApp.setHeaderColor?.(bg)
        WebApp.setBackgroundColor?.(bg)
        WebApp.enableClosingConfirmation?.()
      }
    } catch (e) {
      console.warn('Telegram WebApp init skipped', e)
    }
  }, [])

  useEffect(() => {
    const initUser = async () => {
      try {
        if (WebApp?.initDataUnsafe?.user) {
          const tgUser = WebApp.initDataUnsafe.user
          const code = (tgUser.language_code || '').toLowerCase()
          const platformLang = (code.startsWith('kg') || code.startsWith('ky')) ? 'kg' : 'ru'
          const { userApi } = await import('./api')
          const userData = {
            tg_id: tgUser.id,
            first_name: tgUser.first_name || 'User',
            last_name: tgUser.last_name,
            username: tgUser.username,
            language: platformLang
          }
          const response = await userApi.create(userData)
          setUser(response.data)
          setCredits(response.data.credits || 3)
          i18n.changeLanguage(platformLang)
        } else {
          setUser({ id: 'demo_user', first_name: 'Demo', last_name: 'User', is_premium: false })
          setCredits(3)
        }
      } catch (error) {
        console.error('Failed to initialize user:', error)
        setUser({ id: 'demo_user', first_name: 'Demo', last_name: 'User', is_premium: false })
        setCredits(3)
      } finally {
        setLoading(false)
      }
    }
    initUser()
  }, [i18n])

  const refreshCredits = useCallback(async () => {
    if (!user) return
    try {
      const { userApi } = await import('./api')
      const response = await userApi.getCredits(user.id)
      setCredits(response.data.credits)
    } catch (error) {
      console.error('Failed to refresh credits:', error)
    }
  }, [user])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    try {
      const { userApi } = await import('./api')
      const response = await userApi.get(user.id)
      const data = response.data
      setUser(data)
      if (typeof data.credits === 'number') setCredits(data.credits)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [user])

  const navigate = (page) => {
    WebApp?.HapticFeedback?.impactOccurred('light')
    setActivePage(page)
  }

  const value = {
    user,
    setUser,
    credits,
    setCredits,
    refreshCredits,
    refreshUser,
    loading,
    navigate,
    activePage
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4 h-10 w-10 rounded-full border-2 border-slate-200 border-t-indigo-600" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="text-sm text-slate-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

const AppContent = () => {
  useTelegramTheme()

  const AppContentInner = () => {
    const { activePage, navigate } = useApp()
    return (
      <>
        <Header />
        <main className="min-h-[100vh] flex-1 flex flex-col">
          <div className="mx-auto w-full max-w-[600px] md:max-w-6xl px-4 pb-24 md:pb-12 sm:px-6 lg:px-8 flex-1" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
            {activePage === 'home' && <HomePage />}
            {activePage === 'create' && <CreatePage onBack={() => navigate('home')} />}
            {activePage === 'library' && <LibraryPage />}
            {activePage === 'profile' && <ProfilePage />}
            {activePage === 'admin' && <AdminPage onBack={() => navigate('profile')} />}
          </div>
        </main>
        <BottomNav />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 app-shell overflow-x-hidden">
      <AppContentInner />
    </div>
  )
}

const App = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
)

export default App
