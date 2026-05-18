import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const tgData = window.Telegram?.WebApp?.initData
    if (tgData) {
      config.headers['X-Telegram-Data'] = tgData
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 402) {
      window.Telegram?.WebApp?.showAlert('Недостаточно кредитов!')
    }
    return Promise.reject(error)
  }
)

// User API
export const userApi = {
  create: (userData) => api.post('/users', userData),
  get: (userId) => api.get(`/users/${userId}`),
  getCredits: (userId) => api.get(`/users/${userId}/credits`),
  updateLanguage: (userId, language) => api.put(`/users/${userId}/language`, { language })
}

// Recipient API
export const recipientApi = {
  getAll: (userId) => api.get(`/users/${userId}/recipients`),
  create: (userId, data) => api.post(`/users/${userId}/recipients`, data)
}

// Song API
export const songApi = {
  create: (userId, data) => api.post(`/users/${userId}/songs`, data),
  getAll: (userId) => api.get(`/users/${userId}/songs`),
  getOne: (songId) => api.get(`/songs/${songId}`),
  getStatus: (songId) => api.get(`/songs/${songId}/status`),
  prepareDemo: (data) => api.post('/songs/prepare-demo', data),
  generateDemo: (data) => api.post('/songs/generate', data, { timeout: 20000 }),
  purchaseFullVersion: (songId, userId) =>
    api.post(`/purchase/${songId}`, { user_id: userId }),
}

// Payment API
export const paymentApi = {
  createTransaction: (userId, data) => api.post(`/users/${userId}/transactions`, data),
  getHistory: (userId) => api.get(`/users/${userId}/transactions`)
}

// Content API
export const contentApi = {
  getGenres: () => api.get('/content/genres'),
  getOccasions: () => api.get('/content/occasions'),
  getLanguages: () => api.get('/content/languages')
}

// Stats API
export const statsApi = {
  get: () => api.get('/stats')
}

export default api
