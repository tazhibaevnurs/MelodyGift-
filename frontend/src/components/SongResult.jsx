import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import WebApp from '@twa-dev/sdk'
import { X, Share2, Download, Play, Pause } from 'lucide-react'

const SongResult = ({ song, onClose, onShare, onDownload }) => {
  const { t } = useTranslation()

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.7
      audio.play()
      setIsPlaying(true)
    }
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(audio.currentTime)
    setDuration(audio.duration)
    setProgress((audio.currentTime / audio.duration) * 100)
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    audio.currentTime = percentage * duration
    setProgress(percentage * 100)
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleShare = () => {
    WebApp?.shareUrl?.(`🎁 Песня для ${song.recipient_name} от MelodyGift KG!`)
    onShare?.(song)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50">
      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const audio = audioRef.current
          if (audio) setDuration(audio.duration)
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col">
        <header className="pt-6 px-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-center active:scale-95 touch-manipulation text-slate-700 hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-xs uppercase tracking-wider text-slate-500">{t('player.nowPlaying')}</p>
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-2xl border border-slate-200 bg-white/90 shadow-sm flex items-center justify-center active:scale-95 touch-manipulation text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-30 animate-pulse bg-gradient-to-br from-indigo-400 to-violet-500" />
            <div className="relative w-72 h-72 rounded-3xl border border-slate-200 flex items-center justify-center shadow-2xl backdrop-blur-md bg-white/80">
              {isPlaying && (
                <div className="absolute inset-4 flex items-end justify-around gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-violet-500 animate-wave"
                      style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.05}s` }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={togglePlay}
                className="w-24 h-24 rounded-full border border-slate-200 bg-white/90 shadow-lg flex items-center justify-center z-10 active:scale-95 touch-manipulation text-slate-800 hover:bg-slate-50"
              >
                {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 ml-1" />}
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1 break-words-anywhere">{song.recipient_name}</h2>
            <p className="text-sm text-slate-500 capitalize break-words-anywhere">
              {song.genre?.replace('_', ' ')} • {song.language?.toUpperCase()}
            </p>
          </div>

          <div className="mb-4">
            <div
              className="h-2 rounded-full cursor-pointer overflow-hidden bg-slate-200"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2 text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShare}
              className="py-4 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center gap-2 active:scale-95 touch-manipulation text-slate-700 hover:bg-slate-50"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              <span className="break-words-anywhere">{t('player.share')}</span>
            </button>
            <button
              onClick={() => onDownload?.(song)}
              className="py-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center gap-2 active:scale-95 touch-manipulation text-indigo-600 font-medium hover:bg-indigo-100"
            >
              <Download className="w-5 h-5 shrink-0" />
              <span className="break-words-anywhere">{t('player.download')}</span>
            </button>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  )
}

export default SongResult
