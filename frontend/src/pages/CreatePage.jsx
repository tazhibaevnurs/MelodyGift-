import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import GenerationProgress from '../components/GenerationProgress'
import DemoPlayer from '../components/DemoPlayer'
import api from '../api'
import WebApp from '@twa-dev/sdk'
import { ArrowLeft, Check, Play, Pause, ChevronRight, Download, X } from 'lucide-react'

const EXAMPLE_BASE = (api.defaults.baseURL || '').replace(/\/$/, '') + '/style-examples'

const RELATIONS = [
  { id: 'wife', emoji: '💍' },
  { id: 'girlfriend', emoji: '💕' },
  { id: 'mom', emoji: '👩' },
  { id: 'dad', emoji: '👨' }
]
const EVENTS = [
  { id: 'no_occasion', emoji: '😊' },
  { id: 'birthday', emoji: '🎂' },
  { id: 'new_year', emoji: '🎄' },
  { id: 'feb14', emoji: '❤️' },
  { id: 'wedding', emoji: '💒' },
  { id: 'anniversary', emoji: '🎉' },
  { id: 'new_home', emoji: '🏠' },
  { id: 'gratitude', emoji: '🙏' },
  { id: 'apology', emoji: '😔' },
  { id: 'love_confession', emoji: '💕' },
  { id: 'just_because', emoji: '🌟' },
  { id: 'professional', emoji: '💼' },
  { id: 'graduation', emoji: '🎓' },
  { id: 'baby', emoji: '👶' },
  { id: 'get_well', emoji: '💪' },
  { id: 'farewell', emoji: '👋' },
  { id: 'custom', emoji: '✏️' }
]
const STYLES = [
  { id: 'cheerful', tag: 'Веселый', labelKey: 'styleCheerful', exampleDuration: '02:22' },
  { id: 'lyrical', tag: 'Лиричный', labelKey: 'styleLyrical', exampleDuration: '01:10' },
  { id: 'romantic', tag: 'Романтичный', labelKey: 'styleRomantic', exampleDuration: '01:18' }
]

const CreatePage = ({ onBack }) => {
  const { t } = useTranslation()
  const { user, credits, refreshCredits, navigate } = useApp()

  const [step, setStep] = useState(1)
  const [senderName, setSenderName] = useState('')
  const [senderGender, setSenderGender] = useState(null) // 'male' | 'female'
  const [recipientName, setRecipientName] = useState('')
  const [recipientRelation, setRecipientRelation] = useState(null) // wife, girlfriend, mom, dad
  const [event, setEvent] = useState(null)
  const [customEventText, setCustomEventText] = useState('')
  const [songLanguage, setSongLanguage] = useState('ru') // 'ru' | 'kg' — язык песни
  const [style, setStyle] = useState(null) // cheerful, lyrical, romantic
  const [voiceGender, setVoiceGender] = useState('female') // 'male' | 'female' — пол вокала
  const [loading, setLoading] = useState(false)
  const [generationState, setGenerationState] = useState(null)
  const [elapsedSec, setElapsedSec] = useState(0)
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [songTitle, setSongTitle] = useState('')
  const songTitleRef = useRef('')
  const timerRef = useRef(null)
  const exampleAudioRef = useRef(null)
  const [playingExampleId, setPlayingExampleId] = useState(null)
  const [exampleProgress, setExampleProgress] = useState(0)
  const [exampleDuration, setExampleDuration] = useState(0)

  const COMPOSE_STATUS_KEYS = [
    'create.statusPreparing',
    'create.statusWriting',
    'create.statusAlmost',
    'create.statusMixing',
    'create.statusFinishing',
  ]

  const canContinueStep1 =
    (senderName || '').trim().length > 0 &&
    (recipientName || '').trim().length > 0 &&
    senderGender &&
    recipientRelation &&
    event &&
    (event !== 'custom' || (customEventText || '').trim().length > 0) &&
    !!songLanguage

  const canContinueStep2 = !!style

  const playStyleExample = (styleId, e) => {
    if (e) e.stopPropagation()
    const url = `${EXAMPLE_BASE}/${styleId}.mp3`
    const audio = exampleAudioRef.current
    if (!audio) return
    if (playingExampleId === styleId) {
      audio.pause()
      audio.currentTime = 0
      setPlayingExampleId(null)
      return
    }
    setPlayingExampleId(styleId)
    setExampleProgress(0)
    setExampleDuration(0)
    audio.src = url
    audio.play().catch(() => {
      setPlayingExampleId(null)
      WebApp?.showAlert?.('Пример для этого стиля пока не загружен. Запустите генерацию примеров на сервере.')
    })
  }

  const handleExampleEnded = () => {
    setPlayingExampleId(null)
    setExampleProgress(0)
    setExampleDuration(0)
  }

  useEffect(() => {
    const audio = exampleAudioRef.current
    if (!audio || !playingExampleId) return
    const onTimeUpdate = () => setExampleProgress(audio.currentTime)
    const onDurationChange = () => setExampleDuration(audio.duration || 0)
    const onEnded = () => {
      setPlayingExampleId(null)
      setExampleProgress(0)
      setExampleDuration(0)
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
    }
  }, [playingExampleId])

  const formatExampleTime = (sec) => {
    if (sec == null || !Number.isFinite(sec) || sec < 0) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const handleContinueStep1 = () => {
    if (!canContinueStep1) {
      WebApp?.showAlert('Заполните имя «О тебе», имя «О получателе» и выберите все параметры.')
      return
    }
    WebApp?.HapticFeedback?.impactOccurred('light')
    setStep(2)
  }

  const handleContinueStep2 = async () => {
    if (!canContinueStep2) {
      WebApp?.showAlert('Выберите один стиль песни.')
      return
    }
    const freeDemo = user?.free_demo_credits ?? 0
    if (credits <= 0 && freeDemo <= 0) {
      WebApp?.showAlert('Недостаточно кредитов или бесплатных демо! Перейдите в профиль.')
      navigate('profile')
      return
    }
    setLoading(true)
    WebApp?.HapticFeedback?.impactOccurred('medium')
    try {
      const { songApi } = await import('../api')
      const prep = await songApi.prepareDemo({
        sender_name: senderName.trim(),
        recipient_name: recipientName.trim(),
        sender_gender: senderGender
      })
      const titleFromBackend = prep.data?.title || `Для ${recipientName.trim()} от ${senderName.trim()}`
      songTitleRef.current = titleFromBackend
      setSongTitle(titleFromBackend)
      const styleTag = STYLES.find((s) => s.id === style)?.tag || 'Веселый'
      const gen = await songApi.generateDemo({
        user_id: user.id,
        title: titleFromBackend,
        lyrics: prep.data.lyrics,
        tags: styleTag,
        language: songLanguage,
        instrumental: false,
        sender_name: senderName.trim(),
        recipient_name: recipientName.trim(),
        sender_gender: senderGender,
        voice_gender: voiceGender,
      })
      const song = gen?.data?.song
      if (!song?.id) throw new Error('No song id')
      setStep(3)
      setElapsedSec(0)
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000)
      pollGenerationStatus(song.id)
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.detail || err.message || 'Ошибка. Попробуйте ещё раз.'
      WebApp?.showAlert(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setLoading(false)
    }
  }

  const pollGenerationStatus = async (songId) => {
    const maxAttempts = 90
    let attempts = 0
    const poll = async () => {
      attempts++
      try {
        const { songApi } = await import('../api')
        const res = await songApi.getOne(songId)
        const song = res?.data?.song
        if (!song) {
          if (attempts < maxAttempts) setTimeout(poll, 2000)
          else finishPoll({ status: 'error', message: 'Ошибка получения статуса.' })
          return
        }
        if (song.status === 'completed') {
          if (timerRef.current) clearInterval(timerRef.current)
          refreshCredits()
          setStep(4)
          setGenerationState({
            songId,
            status: 'completed',
            audioUrl: song.audio_url,
            is_paid: song.is_paid ?? false,
            songTitle: songTitleRef.current || song.title,
          })
          setLoading(false)
        } else if (song.status === 'failed') {
          if (timerRef.current) clearInterval(timerRef.current)
          setLoading(false)
          WebApp?.showAlert('Генерация не удалась. Попробуйте ещё раз.')
          setStep(2)
        } else if (attempts < maxAttempts) setTimeout(poll, 2000)
        else finishPoll({ status: 'error', message: 'Превышено время ожидания.' })
      } catch (e) {
        if (attempts < maxAttempts) setTimeout(poll, 2000)
        else finishPoll({ status: 'error', message: 'Ошибка получения статуса.' })
      }
    }
    function finishPoll(state) {
      if (timerRef.current) clearInterval(timerRef.current)
      setLoading(false)
      setStep(2)
      setGenerationState(state)
    }
    poll()
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (generationState?.status === 'error' && step !== 4) {
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center">
        <p className="text-slate-600 mb-4">{generationState.message}</p>
        <button
          type="button"
          onClick={() => setGenerationState(null)}
          className="primary-button"
        >
          {t('common.back')}
        </button>
      </div>
    )
  }

  if (step === 4 && generationState?.audioUrl) {
    const isPaid = generationState.is_paid === true
    const handlePurchase = async () => {
      if (!user?.id || !generationState.songId || purchasing) return
      setPurchasing(true)
      try {
        const { songApi } = await import('../api')
        await songApi.purchaseFullVersion(generationState.songId, user.id)
        const res = await songApi.getOne(generationState.songId)
        const song = res?.data?.song
        setGenerationState((prev) => ({ ...prev, is_paid: song?.is_paid ?? true }))
        setShowUpsellModal(false)
        WebApp?.showAlert?.(t('payment.success'))
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Ошибка оплаты.'
        WebApp?.showAlert?.(typeof msg === 'string' ? msg : JSON.stringify(msg))
      } finally {
        setPurchasing(false)
      }
    }
    return (
      <div className="page-container min-h-screen flex flex-col">
        <header className="pt-4 pb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 rounded-xl py-2 -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('common.back')}</span>
          </button>
        </header>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 create-text">
          {t('create.listenGreat')}
        </h1>
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 bg-white/90 shadow-lg mb-4">
            <div className="p-4">
              <DemoPlayer
                audioUrl={generationState.audioUrl}
                isPaid={isPaid}
                songId={generationState.songId}
                userId={user?.id}
                onShowUpsell={() => setShowUpsellModal(true)}
                title={generationState.songTitle || t('create.demoTitle')}
              />
            </div>
          </div>
          {!isPaid && (
            <button
              type="button"
              className="w-full max-w-sm rounded-2xl py-3 font-semibold text-white flex items-center justify-center gap-2 create-btn mb-4"
              onClick={() => setShowUpsellModal(true)}
            >
              {t('create.buyFullVersion1000')}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <a
            href={isPaid ? generationState.audioUrl : undefined}
            download
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full max-w-sm rounded-2xl py-3 font-semibold flex items-center justify-center gap-2 border-2 transition-all ${
              isPaid
                ? 'create-btn text-white border-[var(--create-accent)]'
                : 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-100'
            }`}
            onClick={(e) => !isPaid && e.preventDefault()}
          >
            <Download className="w-5 h-5" />
            {t('create.download')}
          </a>
        </div>

        {showUpsellModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6 animate-slide-up">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setShowUpsellModal(false)}
                  className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-800 mb-6 text-center">
                {t('create.upsellModalText')}
              </p>
              <button
                type="button"
                disabled={purchasing}
                className="w-full rounded-2xl py-4 font-semibold text-white flex items-center justify-center gap-2 create-btn disabled:opacity-50"
                onClick={handlePurchase}
              >
                {purchasing ? t('payment.processing') : t('create.buyFullVersion1000')}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 3) {
    const mm = Math.floor(elapsedSec / 60)
    const ss = elapsedSec % 60
    const statusIndex = Math.min(
      Math.floor(elapsedSec / 10),
      COMPOSE_STATUS_KEYS.length - 1
    )
    const statusKey = COMPOSE_STATUS_KEYS[statusIndex]
    return (
      <div className="page-container min-h-screen flex flex-col items-center justify-center">
        <div className="compose-ring mb-8">
          <div className="compose-ring-inner">
            <span className="text-slate-700 text-center text-sm font-medium px-3 leading-tight">
              {songTitle || t('create.demoTitle')}
            </span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 create-text">
          {t('create.composingSong')}
        </h2>
        <p className="text-slate-600 text-sm mb-1">{t('create.soonTrial')}</p>
        <p className="text-indigo-600 text-sm font-medium mb-4 min-h-[1.25rem]">
          {t(statusKey)}
        </p>
        <p className="text-lg font-semibold create-text">
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </p>
      </div>
    )
  }

  return (
    <div className="page-container min-h-screen">
      <header className="pt-4 pb-4">
        <button
          onClick={step === 1 ? onBack : () => setStep((s) => s - 1)}
          className="flex items-center gap-2 mb-4 text-slate-600 hover:text-slate-900 rounded-xl py-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('common.back')}</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 break-words-anywhere">
          {t('create.title')}
        </h1>
      </header>

      {step === 1 && (
        <form className="space-y-6 pb-8" onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label className="input-label">{t('create.aboutYou')}</label>
            <div className="flex gap-3 mb-3">
              {[
                { id: 'male', labelKey: 'male' },
                { id: 'female', labelKey: 'female' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSenderGender(opt.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 border-2 font-medium transition-all touch-manipulation relative ${
                    senderGender === opt.id
                      ? 'create-btn text-white border-[var(--create-accent)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {senderGender === opt.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full create-checkmark flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  {t(`create.${opt.labelKey}`)}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={t('create.senderNamePlaceholder')}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('create.aboutRecipient')}</label>
            <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
              {RELATIONS.map((r) => (
                <div key={r.id} className="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <button
                    type="button"
                    onClick={() => { setRecipientRelation(r.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl transition-all relative ${
                      recipientRelation === r.id
                        ? 'create-selected-bg'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    style={recipientRelation === r.id ? { borderColor: 'var(--create-accent)' } : undefined}
                  >
                    {recipientRelation === r.id && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full create-checkmark flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    {r.emoji}
                  </button>
                  <span className="text-xs font-medium text-slate-600 text-center max-w-[4.5rem] px-0.5">
                    {t(`create.${r.id}`)}
                  </span>
                </div>
              ))}
            </div>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={t('create.recipientNamePlaceholder')}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('create.chooseEvent')}</label>
            <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin">
              {EVENTS.map((ev) => (
                <div key={ev.id} className="flex-shrink-0 flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                  <button
                    type="button"
                    onClick={() => { setEvent(ev.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                    className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all relative ${
                      event === ev.id ? 'create-selected-bg' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    style={event === ev.id ? { borderColor: 'var(--create-accent)' } : undefined}
                  >
                    {event === ev.id && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full create-checkmark flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    )}
                    {ev.emoji}
                  </button>
                  <span className="text-xs font-medium text-slate-600 text-center max-w-[4.5rem] px-0.5">
                    {t(`create.${ev.id}`)}
                  </span>
                </div>
              ))}
            </div>
            {event === 'custom' && (
              <input
                type="text"
                value={customEventText}
                onChange={(e) => setCustomEventText(e.target.value)}
                placeholder={t('create.customEventPlaceholder')}
                className="input-field mt-2"
              />
            )}
          </div>

          <div className="input-group">
            <label className="input-label">{t('create.songLanguage')}</label>
            <div className="flex gap-3">
              {[
                { id: 'ru', labelKey: 'langRu' },
                { id: 'kg', labelKey: 'langKg' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSongLanguage(opt.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 border-2 font-medium transition-all touch-manipulation relative ${
                    songLanguage === opt.id
                      ? 'create-btn text-white border-[var(--create-accent)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {songLanguage === opt.id && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full create-checkmark flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
                  )}
                  {t(`create.${opt.labelKey}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueStep1}
            disabled={!canContinueStep1}
            className="w-full rounded-2xl py-4 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed create-btn"
          >
            {t('create.continue')}
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 pb-8">
          <audio ref={exampleAudioRef} onEnded={handleExampleEnded} />
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t('create.chooseStyle')}</h2>
            <p className="text-sm text-slate-600">{t('create.chooseStyleHint')}</p>
          </div>
          <div className="space-y-4">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setStyle(s.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                className={`w-full rounded-2xl border-2 p-4 text-left flex items-center justify-between transition-all ${
                  style === s.id ? 'create-selected-bg' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                style={style === s.id ? { borderColor: 'var(--create-accent)' } : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    style === s.id ? 'create-checkmark border-transparent' : 'border-slate-300'
                  }`}>
                    {style === s.id && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800">{t(`create.${s.labelKey}`)}</p>
                    <button
                      type="button"
                      onClick={(e) => playStyleExample(s.id, e)}
                      className="text-sm text-slate-500 flex items-center gap-2 mt-0.5 rounded-lg py-1 pr-2 hover:bg-slate-100 hover:text-slate-700 transition-colors w-full"
                    >
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        playingExampleId === s.id ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {playingExampleId === s.id ? (
                          <Pause className="w-4 h-4" fill="currentColor" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                        )}
                      </span>
                      <span className="flex-1 text-left">
                        {playingExampleId === s.id
                          ? `${formatExampleTime(exampleProgress)} / ${formatExampleTime(exampleDuration) || s.exampleDuration}`
                          : `${t('create.listenExample')} · ${s.exampleDuration}`}
                      </span>
                    </button>
                    {playingExampleId === s.id && (
                      <div className="mt-1.5 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-200"
                          style={{
                            width: exampleDuration > 0
                              ? `${Math.min(100, (exampleProgress / exampleDuration) * 100)}%`
                              : '0%',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">{t('create.voiceGenderLabel')}</h2>
            <div className="flex gap-3">
              {[
                { id: 'male', labelKey: 'voiceMale' },
                { id: 'female', labelKey: 'voiceFemale' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setVoiceGender(opt.id); WebApp?.HapticFeedback?.impactOccurred('light') }}
                  className={`flex-1 rounded-2xl py-3.5 border-2 font-medium transition-all ${
                    voiceGender === opt.id
                      ? 'create-btn text-white border-[var(--create-accent)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t(`create.${opt.labelKey}`)}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleContinueStep2}
            disabled={!canContinueStep2 || loading}
            className="w-full rounded-2xl py-4 font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed create-btn"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>{t('generation.creating')}</span>
              </>
            ) : (
              <>
                {t('create.continue')}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default CreatePage
