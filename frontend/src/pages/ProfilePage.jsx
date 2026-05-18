import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import WebApp from '@twa-dev/sdk'
import { CreditCard, Globe, FileText, Settings, X, Loader2 } from 'lucide-react'

const ProfilePage = () => {
  const { t, i18n } = useTranslation()
  const { user, credits, setCredits, navigate, refreshUser } = useApp()

  useEffect(() => {
    refreshUser?.()
  }, [refreshUser])

  const [showPayment, setShowPayment] = useState(false)
  const [processing, setProcessing] = useState(false)

  const packages = [
    { id: 1, credits: 1, price: 50 },
    { id: 5, credits: 5, price: 200, discount: '20%' },
    { id: 10, credits: 10, price: 350, discount: '30%' }
  ]

  const [selectedPackage, setSelectedPackage] = useState(packages[1])
  const [paymentMethod, setPaymentMethod] = useState('localpay')

  const handlePayment = async () => {
    setProcessing(true)
    WebApp?.HapticFeedback?.impactOccurred('medium')
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setCredits((prev) => prev + selectedPackage.credits)
      WebApp?.showAlert(`✅ ${t('payment.success')} +${selectedPackage.credits} ${t('payment.creditsAdded')}`)
      setShowPayment(false)
    } catch (error) {
      WebApp?.showAlert(`❌ ${t('payment.errorPayment')}`)
    } finally {
      setProcessing(false)
    }
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ru' ? 'kg' : 'ru'
    i18n.changeLanguage(newLang)
    WebApp?.HapticFeedback?.notificationOccurred('success')
  }

  return (
    <div className="page-container py-6 md:py-8">
      <header className="pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2 break-words-anywhere md:text-3xl">
          {t('profile.title')}
        </h1>
      </header>

      <div className="glass-card p-6 mb-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4 text-white shadow-lg shadow-indigo-500/30">
          {user?.first_name?.[0] || 'U'}
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1 break-words-anywhere">{user?.first_name} {user?.last_name}</h2>
        <p className="text-sm text-slate-500 mb-4 break-words-anywhere">@{user?.username || 'unknown'}</p>
        <div className="credit-badge inline-flex">
          <span className="text-lg">🪙</span>
          <span className="text-lg font-bold text-slate-800">{credits}</span>
          <span className="text-sm text-slate-500">{t('profile.creditsLabel')}</span>
        </div>
        <p className="text-sm text-slate-600 mt-3">
          {t('profile.balance')}: {(user?.balance_som ?? 0).toFixed(0)} сом
        </p>
        {(user?.free_demo_credits ?? 0) > 0 && (
          <p className="text-sm text-emerald-600 mt-1">
            {user.free_demo_credits === 1
              ? t('profile.freeDemoOne')
              : t('profile.freeDemoPlural', { count: user.free_demo_credits })}
          </p>
        )}
      </div>

      {!user?.is_premium && (
        <div className="glass-card p-5 mb-6 border-indigo-200 bg-indigo-50/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 break-words-anywhere">
                <span>👑</span>
                {t('profile.getPremium')}
              </h3>
              <p className="text-sm mt-1 text-slate-600 break-words-anywhere">{t('profile.getMoreOpportunities')}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">{t('profile.premiumPrice')}</p>
              <p className="text-xs text-slate-500">{t('profile.premiumPerMonth')}</p>
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span>✓</span>
              <span className="break-words-anywhere">{t('profile.upgradeBenefits.unlimited')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span>✓</span>
              <span className="break-words-anywhere">{t('profile.upgradeBenefits.priority')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <span>✓</span>
              <span className="break-words-anywhere">{t('profile.upgradeBenefits.quality')}</span>
            </div>
          </div>
          <button className="secondary-button font-bold active:scale-95 min-h-[52px] w-full">
            <span className="break-words-anywhere">{t('profile.upgradeToPremium')}</span>
          </button>
        </div>
      )}

      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
          {t('profile.quickActions')}
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full glass-card p-4 flex items-center justify-between text-slate-800 active:scale-[0.99] touch-manipulation hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="break-words-anywhere">{t('profile.topUpCredits')}</span>
            </div>
            <span className="text-indigo-600">→</span>
          </button>
          <button
            onClick={toggleLanguage}
            className="w-full glass-card p-4 flex items-center justify-between text-slate-800 active:scale-[0.99] touch-manipulation hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="break-words-anywhere">{t('profile.language')}</span>
            </div>
            <span className="text-indigo-600">{i18n.language === 'ru' ? 'Русский' : 'Кыргызча'}</span>
          </button>
          <button className="w-full glass-card p-4 flex items-center justify-between text-slate-800 active:scale-[0.99] touch-manipulation hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="break-words-anywhere">{t('profile.history')}</span>
            </div>
            <span className="text-indigo-600">→</span>
          </button>
          <button className="w-full glass-card p-4 flex items-center justify-between text-slate-800 active:scale-[0.99] touch-manipulation hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-indigo-600 shrink-0" />
              <span className="break-words-anywhere">{t('profile.settings')}</span>
            </div>
            <span className="text-indigo-600">→</span>
          </button>
          <button
            onClick={() => navigate('admin')}
            className="w-full glass-card p-4 flex items-center justify-between text-slate-800 active:scale-[0.99] touch-manipulation hover:shadow-2xl transition-shadow"
          >
            <span className="break-words-anywhere text-slate-600">Admin</span>
            <span className="text-indigo-600">→</span>
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
          {t('profile.aboutApp')}
        </h3>
        <div className="glass-card p-4 space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span>{t('profile.version')}</span>
            <span className="text-slate-800">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Разработчик</span>
            <span className="text-slate-800">MelodyGift Team</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Поддержка</span>
            <a href="#" className="text-indigo-600 hover:underline">@melodygift_support</a>
          </div>
        </div>
      </section>

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 break-words-anywhere">{t('payment.title')}</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center active:scale-95 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              <p className="text-sm text-slate-500 mb-3">{t('payment.selectPackage')}</p>
              {packages.map((pkg) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left active:scale-[0.99] ${
                    selectedPackage.id === pkg.id
                      ? 'bg-indigo-50 border-indigo-500'
                      : 'border-slate-200 bg-white/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🪙</span>
                      <div>
                        <p className="font-medium text-slate-800 break-words-anywhere">{t(`payment.packages.${pkg.id}.name`)}</p>
                        {pkg.discount && <span className="text-xs text-emerald-600">{pkg.discount}</span>}
                      </div>
                    </div>
                    <p className="text-lg font-bold text-indigo-600">{pkg.price} сом</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-3">{t('payment.method')}</p>
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentMethod('localpay')}
                  className={`w-full p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'localpay' ? 'bg-indigo-50 border-indigo-500 text-slate-800' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span>{t('payment.paymentMethods.localpay')}</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('optima')}
                  className={`w-full p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'optima' ? 'bg-indigo-50 border-indigo-500 text-slate-800' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">🏦</span>
                  <span>{t('payment.paymentMethods.optima')}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 p-4 rounded-2xl bg-slate-50 text-slate-800">
              <span className="text-slate-500">{t('payment.total')}</span>
              <span className="text-xl font-bold">{selectedPackage.price} сом</span>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="primary-button disabled:opacity-50 min-h-[52px] flex items-center justify-center gap-2 active:scale-95"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <span className="break-words-anywhere">{t('payment.processing')}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 shrink-0" />
                  <span className="break-words-anywhere">{t('payment.pay')} {selectedPackage.price} сом</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

export default ProfilePage
