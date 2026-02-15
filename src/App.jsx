import React from 'react'
import LabelGenerator from './components/LabelGenerator'
import { LocaleProvider } from './i18n/LocaleContext'

function App() {
  return (
    <LocaleProvider>
      <LabelGenerator />
    </LocaleProvider>
  )
}

export default App
