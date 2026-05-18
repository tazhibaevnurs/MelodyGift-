import React from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import { Home, Music, Library, User } from 'lucide-react'

/**
 * Mobile-only bottom navigation. Sticky, native-looking for iOS/Android.
 * Hidden on md and up (desktop uses Header nav).
 */
const BottomNav = () => {
  const { t } = useTranslation()
  const { activePage, navigate, credits } = useApp()

  const navItems = [
    { id: 'home', label: t('nav.home'), Icon: Home },
    { id: 'create', label: t('nav.create'), Icon: Music },
    { id: 'library', label: t('nav.library'), Icon: Library },
    { id: 'profile', label: t('nav.profile'), Icon: User }
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-slate-200/80 backdrop-blur-xl bg-white/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-pb"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.Icon
          const isActive = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex flex-1 max-w-[100px] flex-col items-center justify-center rounded-xl py-2.5 transition-all active:scale-95 ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-6 w-6 shrink-0 mb-0.5" strokeWidth={2} />
              <span className="text-[10px] leading-tight break-words-anywhere">{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md">
        <span>🪙</span>
        <span>{credits}</span>
      </div>
    </nav>
  )
}

export default BottomNav
