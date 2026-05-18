import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './i18n/config'
import './styles/index.css'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #17212B 0%, #1e293b 50%, #0f172a 100%)',
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            textAlign: 'center'
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Что-то пошло не так</h1>
          <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>{this.state.error?.message || 'Ошибка загрузки'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Обновить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
