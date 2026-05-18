import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ru from './ru.json'
import kg from './kg.json'

const resources = {
  ru: { translation: ru },
  kg: { translation: kg }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  })

export default i18n
