import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../App'
import WebApp from '@twa-dev/sdk'
import { X, User, Loader2 } from 'lucide-react'

const AddRecipientModal = ({ onClose, onAdd }) => {
  const { t } = useTranslation()
  const { user } = useApp()

  const [formData, setFormData] = useState({
    name: '',
    gender: 'female',
    age: '',
    relation: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      WebApp?.showAlert('Пожалуйста, введите имя получателя!')
      return
    }

    setLoading(true)
    WebApp?.HapticFeedback?.impactOccurred('medium')

    try {
      const { recipientApi } = await import('../api')
      const response = await recipientApi.create(user.id, {
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        relation: formData.relation || 'друг'
      })
      onAdd(response.data)
      WebApp?.HapticFeedback?.notificationOccurred('success')
    } catch (error) {
      console.error('Failed to add recipient:', error)
      const localRecipient = {
        id: `local_${Date.now()}`,
        user_id: user.id,
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        relation: formData.relation || 'друг',
        created_at: new Date().toISOString()
      }
      onAdd(localRecipient)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const quickRelations = ['друг', 'подруга', 'мама', 'папа', 'коллега']

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 break-words-anywhere">{t('addRecipient.title')}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 flex items-center justify-center active:scale-95 touch-manipulation hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="input-group">
            <label className="input-label">{t('addRecipient.name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('addRecipient.namePlaceholder')}
              className="input-field"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('addRecipient.gender')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange('gender', 'female')}
                className={`flex-1 py-3.5 rounded-2xl font-medium transition-all touch-manipulation active:scale-95 ${
                  formData.gender === 'female'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">👩</span>
                <span className="break-words-anywhere">{t('addRecipient.female')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleChange('gender', 'male')}
                className={`flex-1 py-3.5 rounded-2xl font-medium transition-all touch-manipulation active:scale-95 ${
                  formData.gender === 'male'
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">👨</span>
                <span className="break-words-anywhere">{t('addRecipient.male')}</span>
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('addRecipient.age')}</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder={t('addRecipient.agePlaceholder')}
              min="1"
              max="150"
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">{t('addRecipient.relation')}</label>
            <input
              type="text"
              value={formData.relation}
              onChange={(e) => handleChange('relation', e.target.value)}
              placeholder={t('addRecipient.relationPlaceholder')}
              className="input-field"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {quickRelations.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => handleChange('relation', rel)}
                className={`px-4 py-2 rounded-2xl text-sm transition-all touch-manipulation active:scale-95 ${
                  formData.relation === rel
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 secondary-button min-h-[52px] active:scale-95"
            >
              <span className="break-words-anywhere">{t('addRecipient.cancel')}</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 primary-button disabled:opacity-50 min-h-[52px] flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <>
                  <User className="w-5 h-5 shrink-0" />
                  <span className="break-words-anywhere">{t('addRecipient.save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddRecipientModal
