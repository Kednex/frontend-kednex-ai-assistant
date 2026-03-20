'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  isThemeLoading: boolean
  setThemeLoading: (loading: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isThemeLoading, setThemeLoading] = useState(true)

  return (
    <ThemeContext.Provider value={{ isThemeLoading, setThemeLoading }}>
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
