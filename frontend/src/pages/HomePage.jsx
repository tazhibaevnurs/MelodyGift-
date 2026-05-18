import React from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import {
  Music,
  Bot,
  Heart,
  Zap,
  UserPlus,
  MessageCircle,
  Palette,
  Sparkles,
  Gift,
  BookOpen
} from 'lucide-react'

const HomePage = () => {
  const { t } = useTranslation()
  const { navigate, credits, user } = useApp()

  const features = [
    { icon: Bot, title: t('home.features.aiPowered'), desc: t('home.featureAiDesc') },
    { icon: Heart, title: t('home.features.personalized'), desc: t('home.featurePersonalizedDesc') },
    { icon: Zap, title: t('home.features.quick'), desc: t('home.featureQuickDesc') }
  ]

  const steps = [
    { icon: UserPlus, text: t('home.steps.1'), glow: 'from-indigo-500/80 to-violet-500/80' },
    { icon: MessageCircle, text: t('home.steps.2'), glow: 'from-violet-500/80 to-purple-500/80' },
    { icon: Palette, text: t('home.steps.3'), glow: 'from-purple-500/80 to-fuchsia-500/80' },
    { icon: Sparkles, text: t('home.steps.4'), glow: 'from-fuchsia-500/80 to-pink-500/80' }
  ]

  const examples = [
    { emoji: '🎂', titleKey: 'home.example1Title', descKey: 'home.example1Desc' },
    { emoji: '💒', titleKey: 'home.example2Title', descKey: 'home.example2Desc' },
    { emoji: '🏠', titleKey: 'home.example3Title', descKey: 'home.example3Desc' }
  ]

  return (
    <div className="page-container py-6 md:py-10">
      {/* Hero: one column on mobile, two on desktop */}
      <section className="mb-12 md:mb-16">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600 mb-2">
              {user?.first_name}, {t('home.welcome')}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-4">
              <span className="text-gradient">{t('app.title')}</span>
            </h1>
            <p className="text-lg text-slate-600 mb-6 max-w-xl">
              {t('app.tagline')}
            </p>
            <p className="text-slate-500 mb-8 max-w-lg">
              {t('app.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('create')}
                className="primary-button w-full sm:w-auto"
              >
                <Gift className="h-5 w-5 shrink-0" strokeWidth={2} />
                {t('home.createButton')}
              </button>
              <button
                onClick={() => navigate('library')}
                className="secondary-button w-full sm:w-auto"
              >
                {t('home.mySongs')}
              </button>
            </div>
          </div>

          {/* Right: player preview / illustration - desktop */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="glass-card relative w-full max-w-sm overflow-hidden p-6">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40">
                    <Music className="h-10 w-10 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-1 rounded-full bg-gradient-to-t from-indigo-400 to-violet-500 animate-wave"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-slate-600">{t('home.playerPreview')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - 3 cols */}
      <section className="mb-12 md:mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="glass-card p-5 text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <p className="font-semibold text-slate-800">{feature.title}</p>
                <p className="mt-1 text-sm text-slate-500">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works - horizontal grid, neon-style cards */}
      <section className="mb-12 md:mb-16">
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 md:text-2xl">
          <BookOpen className="h-5 w-5 text-indigo-600 shrink-0" strokeWidth={2} />
          {t('home.howItWorks')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={index}
                className="glass-card group relative overflow-hidden p-5 animate-slide-up"
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${step.glow} blur-2xl`}
                  style={{ filter: 'blur(40px)' }}
                />
                <div className="relative">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-white/50">
                    <Icon className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-semibold text-indigo-600/90">{index + 1}</span>
                  <p className="mt-2 text-sm font-medium text-slate-700 leading-snug">
                    {step.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Examples */}
      <section>
        <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900 md:text-2xl">
          <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" strokeWidth={2} />
          {t('home.examplesTitle')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="glass-card flex items-center gap-4 p-4 transition-shadow hover:shadow-2xl hover:shadow-slate-200/60"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                {ex.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-800">{t(ex.titleKey)}</p>
                <p className="text-sm text-slate-500">{t(ex.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-12 md:h-16" />
    </div>
  )
}

export default HomePage
