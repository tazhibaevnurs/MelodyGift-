import React, { useState, useEffect } from 'react'
import { useApp } from '../App'
import { ArrowLeft, RefreshCw, Check, Music } from 'lucide-react'
import api from '../api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const AdminPage = ({ onBack }) => {
  const { navigate } = useApp()
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [stats, setStats] = useState(null)
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const headers = () => (secret ? { 'X-Admin-Secret': secret } : {})

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, { headers: headers() })
      if (res.status === 403) {
        setAuthenticated(false)
        setError('Неверный ключ')
        return
      }
      const data = await res.json()
      setStats(data)
      setError(null)
      setAuthenticated(true)
    } catch (e) {
      setError(e.message)
    }
  }

  const fetchSongs = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/songs`, { headers: headers() })
      if (res.status === 403) {
        setAuthenticated(false)
        return
      }
      const data = await res.json()
      setSongs(data.songs || [])
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    if (authenticated && secret) {
      fetchStats()
      fetchSongs()
    }
  }, [authenticated, secret])

  const handleConfirmPayment = async (songId) => {
    try {
      const res = await fetch(`${API_BASE}/admin/songs/${songId}/confirm-payment`, {
        method: 'POST',
        headers: headers(),
      })
      if (res.status === 403) return
      if (res.ok) {
        fetchStats()
        fetchSongs()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (!authenticated && !secret) {
    return (
      <div className="page-container py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 mb-6 rounded-xl py-2 -ml-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin</h1>
        <p className="text-slate-600 mb-4">Введите ключ администратора:</p>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          className="input-field mb-4"
        />
        <button
          type="button"
          className="primary-button w-full"
          onClick={() => {
            setLoading(true)
            setError(null)
            fetchStats().finally(() => setLoading(false))
          }}
        >
          {loading ? 'Проверка...' : 'Войти'}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="page-container py-8">
        <p className="text-red-600">Доступ запрещён. Проверьте ключ.</p>
        <button type="button" className="primary-button mt-4" onClick={() => setSecret('')}>
          Назад
        </button>
      </div>
    )
  }

  return (
    <div className="page-container py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 mb-6 rounded-xl py-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Назад
      </button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <button
          type="button"
          onClick={() => { fetchStats(); fetchSongs() }}
          className="p-2 rounded-xl border border-slate-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-sm text-slate-500">Выручка</p>
            <p className="text-2xl font-bold text-slate-800">{stats.revenue_som} сом</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-slate-500">Генераций</p>
            <p className="text-2xl font-bold text-slate-800">{stats.generation_count}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-slate-500">Чистая прибыль</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.net_profit_som} сом</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-slate-500">Конверсия</p>
            <p className="text-2xl font-bold text-slate-800">{stats.conversion_percent}%</p>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-900 mb-4">Все песни</h2>
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {songs.map((s) => (
          <div
            key={s.id}
            className="glass-card p-4 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800 truncate">{s.title || s.id}</p>
              <p className="text-sm text-slate-500">
                {s.status} · {s.is_paid ? 'Оплачено' : 'Демо'} · user: {s.user_id}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {s.audio_url && (
                <a
                  href={s.audio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600"
                  title="Слушать"
                >
                  <Music className="w-4 h-4" />
                </a>
              )}
              {!s.is_paid && s.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => handleConfirmPayment(s.id)}
                  className="p-2 rounded-xl bg-emerald-100 text-emerald-700"
                  title="Подтвердить оплату"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPage
