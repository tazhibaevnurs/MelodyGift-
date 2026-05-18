import React from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import { Music, Home, Library, CreditCard, User } from 'lucide-react'

const Header = () => {
  const { t } = useTranslation()
  const { navigate, activePage, credits, user } = useApp()

  const navLinks = [
    { id: 'home', label: t('nav.home'), Icon: Home },
    { id: 'library', label: t('nav.library'), Icon: Library },
    { id: 'profile', label: t('nav.tariffs'), Icon: CreditCard }
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 backdrop-blur-md bg-white/70 shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 shrink-0 rounded-xl py-2 pr-2 transition-opacity hover:opacity-90 active:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Music className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <span className="hidden font-semibold text-slate-800 sm:inline">
            {t('app.title')}
          </span>
        </button>

        {/* Center nav - desktop only */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.Icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Right: CTA + profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
            <span className="text-lg">🪙</span>
            <span className="font-semibold text-slate-800">{credits}</span>
            <span className="text-xs text-slate-500">{t('profile.creditsLabel')}</span>
          </div>
          <button
            onClick={() => navigate('create')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:brightness-110 active:scale-[0.98]"
          >
            <span className="hidden sm:inline">{t('home.createButton')}</span>
            <Music className="h-4 w-4 sm:hidden" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('profile')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            title={user?.first_name}
          >
            <User className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
