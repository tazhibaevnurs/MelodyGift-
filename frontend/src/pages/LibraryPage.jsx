import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import WebApp from '@twa-dev/sdk'
import { Music, Share2, Download, Play, Pause } from 'lucide-react'
import { Skeleton, SkeletonSongItem } from '../components/Skeleton'

const LibraryPage = () => {
  const { t } = useTranslation()
  const { user } = useApp()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState(null)
  const [audioProgress, setAudioProgress] = useState({})
  const audioRefs = useRef({})

  useEffect(() => {
    loadSongs()
  }, [user])

  const loadSongs = async () => {
    try {
      const { songApi } = await import('../api')
      const response = await songApi.getAll(user.id)
      setSongs(response.data)
    } catch (error) {
      console.error('Failed to load songs:', error)
      setSongs([
        {
          id: 'demo_song_1',
          recipient_name: 'Айжан',
          occasion: 'birthday',
          genre: 'pop',
          language: 'ru',
          status: 'completed',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          created_at: new Date().toISOString()
        },
        {
          id: 'demo_song_2',
          recipient_name: 'Нурлан',
          occasion: 'wedding',
          genre: 'romantic',
          language: 'ru',
          status: 'completed',
          audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = (songId, url) => {
    WebApp?.HapticFeedback?.impactOccurred('light')

    if (playingId === songId) {
      const audio = audioRefs.current[songId]
      if (audio) {
        if (audio.paused) audio.play()
        else audio.pause()
      }
    } else {
      if (playingId) {
        const prev = audioRefs.current[playingId]
        if (prev) {
          prev.pause()
          prev.currentTime = 0
        }
      }
      setPlayingId(songId)
      setTimeout(() => {
        const audio = audioRefs.current[songId]
        if (audio) {
          audio.src = url
          audio.play()
          audio.onended = () => setPlayingId(null)
        }
      }, 100)
    }
  }

  const handleShare = (song) => {
    WebApp?.shareUrl?.(`🎁 Песня для ${song.recipient_name} от MelodyGift KG!\n\nСлушайте: ${song.audio_url}`)
  }

  const handleDownload = (song) => {
    WebApp?.HapticFeedback?.impactOccurred('medium')
    window.open(song.audio_url, '_blank')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOccasionIcon = (occasion) => {
    const icons = {
      birthday: '🎂',
      wedding: '💒',
      new_home: '🏠',
      gratitude: '🙏',
      apology: '😔',
      love_confession: '💕',
      just_because: '🎁',
      professional: '🏆'
    }
    return icons[occasion] || '🎵'
  }

  if (loading) {
    return (
      <div className="page-container min-h-screen">
        <header className="pt-4 pb-4">
          <Skeleton className="h-8 w-48 rounded-xl mb-2" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </header>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonSongItem key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-6 md:py-8">
      <header className="pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-1 break-words-anywhere md:text-3xl">
          {t('library.title')}
        </h1>
        <p className="text-sm text-slate-500 break-words-anywhere">
          {songs.length} {songs.length === 1 ? 'песня' : songs.length < 5 ? 'песни' : 'песен'}
        </p>
      </header>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="mb-2 text-slate-600 break-words-anywhere text-center">{t('library.empty')}</p>
          <p className="text-sm text-slate-500 text-center break-words-anywhere">{t('library.createFirst')}</p>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {songs.map((song, index) => (
            <div
              key={song.id}
              className="glass-card p-4 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <audio
                ref={(el) => (audioRefs.current[song.id] = el)}
                onTimeUpdate={(e) => {
                  const audio = e.target
                  const p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
                  setAudioProgress((prev) => ({ ...prev, [song.id]: p }))
                }}
              />

              <div className="flex items-start gap-4">
                <button
                  onClick={() => togglePlay(song.id, song.audio_url)}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0 text-white shadow-lg shadow-indigo-500/30 active:scale-95 touch-manipulation"
                >
                  {playingId === song.id ? (
                    <Pause className="w-6 h-6" strokeWidth={2} />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" strokeWidth={2} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-lg shrink-0">{getOccasionIcon(song.occasion)}</span>
                    <h3 className="font-semibold text-slate-800 truncate break-words-anywhere">{song.recipient_name}</h3>
                  </div>
                  <p className="text-sm text-slate-500 capitalize break-words-anywhere">
                    {song.genre?.replace('_', ' ')} • {song.language?.toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 break-words-anywhere">{formatDate(song.created_at)}</p>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium shrink-0 ${
                    song.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {song.status === 'completed' ? '✓' : '⏳'}
                </div>
              </div>

              {playingId === song.id && (
                <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-200"
                    style={{ width: `${audioProgress[song.id] || 0}%` }}
                  />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleShare(song)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center gap-2 text-sm font-medium text-slate-700 active:scale-95 touch-manipulation hover:bg-slate-50"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="break-words-anywhere">{t('library.share')}</span>
                </button>
                <button
                  onClick={() => handleDownload(song)}
                  className="flex-1 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 active:scale-95 touch-manipulation hover:bg-indigo-100"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="break-words-anywhere">{t('library.download')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="h-4" />
    </div>
  )
}

export default LibraryPage
