'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  isThemeLoading: boolean
  setThemeLoading: (loading: boolean) => void
  welcomeMessage: string
  setWelcomeMessage: (message: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isThemeLoading, setThemeLoading] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState('How can I help you today?')

  return (
    <ThemeContext.Provider value={{ isThemeLoading, setThemeLoading, welcomeMessage, setWelcomeMessage }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
