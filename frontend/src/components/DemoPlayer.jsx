import React, { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Play, Pause } from 'lucide-react'

const DEMO_CUTOFF_SEC = 40

/**
 * Custom audio player for demo songs.
 * If is_paid === false, stops at 40s and can show upsell modal.
 */
const DemoPlayer = ({
  audioUrl,
  isPaid,
  songId,
  userId,
  onShowUpsell,
  onPurchased,
  title,
  className = '',
}) => {
  const { t } = useTranslation()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const cutoff = isPaid ? null : DEMO_CUTOFF_SEC

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      const t = audio.currentTime
      setCurrentTime(t)
      if (cutoff != null && t >= cutoff) {
        audio.pause()
        setPlaying(false)
        setCurrentTime(cutoff)
        onShowUpsell?.()
      }
    }
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [audioUrl, cutoff, onShowUpsell])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      if (cutoff != null && currentTime >= cutoff) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      audio.play().catch(() => {})
    }
  }

  const displayTime = (sec) => {
    if (sec == null || !Number.isFinite(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const maxTime = cutoff != null ? Math.min(duration, cutoff) : duration
  const displayCurrent = cutoff != null && currentTime >= cutoff ? cutoff : currentTime

  return (
    <div className={className}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0 create-btn"
          onClick={togglePlay}
        >
          {playing ? (
            <Pause className="w-7 h-7" fill="currentColor" />
          ) : (
            <Play className="w-7 h-7 ml-1" fill="currentColor" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800">{title || t('create.demoTitle')}</p>
          <p className="text-sm text-slate-500">
            {displayTime(displayCurrent)}
            {cutoff != null && (
              <span className="text-slate-400"> / {displayTime(cutoff)}</span>
            )}
            {isPaid && duration > 0 && (
              <span className="text-slate-400"> / {displayTime(duration)}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DemoPlayer
export { DEMO_CUTOFF_SEC }
