import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import WebApp from '@twa-dev/sdk'
import { Palette, Music2, Mic, Sparkles, Check, AlertCircle, Music } from 'lucide-react'

const GenerationProgress = ({ state, onRetry, onViewResult }) => {
  const { t } = useTranslation()

  const stages = [
    { id: 'prompt', icon: Palette, text: 'generatingPrompt' },
    { id: 'compose', icon: Music2, text: 'composingMusic' },
    { id: 'vocals', icon: Mic, text: 'addingVocals' },
    { id: 'finalize', icon: Sparkles, text: 'finalizing' }
  ]

  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (state.status === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + 2, 100)
          const newStage = Math.min(
            Math.floor(newProgress / 25),
            stages.length - 1
          )
          if (newStage !== currentStage) {
            setCurrentStage(newStage)
            WebApp?.HapticFeedback?.impactOccurred('light')
          }
          return newProgress
        })
      }, 200)
      return () => clearInterval(interval)
    }
  }, [state.status])

  const getStageProgress = () => {
    if (progress >= 100) return 100
    const stageWidth = 100 / stages.length
    const stageStart = currentStage * stageWidth
    return ((progress - stageStart) / stageWidth) * 100
  }

  if (state.status === 'completed') {
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-emerald-600 break-words-anywhere">
            {t('generation.success')}
          </h2>
          <p className="mb-8 text-slate-500 break-words-anywhere">
            Ваша песня успешно создана!
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <button
              onClick={onViewResult}
              className="primary-button flex items-center justify-center gap-2 min-h-[52px] active:scale-95"
            >
              <Music className="w-5 h-5 shrink-0" />
              <span className="break-words-anywhere">Слушать песню</span>
            </button>
            <button
              onClick={onViewResult}
              className="secondary-button flex items-center justify-center gap-2 min-h-[52px] active:scale-95"
            >
              <span className="break-words-anywhere">{t('generation.toMySongs')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-red-600 break-words-anywhere">
            {t('generation.error')}
          </h2>
          <p className="mb-8 text-slate-500 break-words-anywhere">
            {state.message || 'Что-то пошло не так. Попробуйте снова.'}
          </p>
          <button
            onClick={onRetry}
            className="primary-button flex items-center justify-center gap-2 min-h-[52px] active:scale-95"
          >
            <span className="break-words-anywhere">{t('generation.retry')}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container min-h-screen flex flex-col">
      <header className="pt-6 pb-2 text-center">
        <h1 className="text-xl font-bold text-slate-900 break-words-anywhere">{t('generation.title')}</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="relative">
            <div className="w-44 h-44 rounded-full border-4 border-slate-200 flex items-center justify-center bg-white/80 shadow-xl">
              <svg className="absolute w-44 h-44 transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="4"
                  strokeDasharray={`${(progress / 100) * 502} 502`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center z-10">
                <div className="audio-wave justify-center mb-2">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{Math.round(progress)}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-lg font-medium text-slate-800 mb-1 animate-pulse break-words-anywhere">{t('generation.creating')}</p>
          <p className="text-sm text-slate-500 break-words-anywhere">{t('generation.thisMayTake')}</p>
        </div>

        <div className="w-full max-w-xs">
          <div className="space-y-3">
            {stages.map((stage, index) => {
              const Icon = stage.icon
              return (
                <div
                  key={stage.id}
                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                    index === currentStage
                      ? 'bg-indigo-50 border-indigo-200'
                      : index < currentStage
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      index <= currentStage ? 'bg-indigo-100' : 'bg-slate-100'
                    }`}
                  >
                    {index < currentStage ? (
                      <Check className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Icon className={`w-5 h-5 ${index === currentStage ? 'text-indigo-600' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-slate-800 break-words-anywhere ${index === currentStage ? '' : 'opacity-70'}`}>
                      {t(`generation.${stage.text}`)}
                    </p>
                    {index === currentStage && (
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 rounded-full"
                          style={{ width: `${getStageProgress()}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="py-4 text-center">
        <button onClick={onRetry} className="text-sm text-slate-500 py-2 active:scale-95 touch-manipulation hover:text-slate-700">
          Отмена
        </button>
      </div>
    </div>
  )
}

export default GenerationProgress
