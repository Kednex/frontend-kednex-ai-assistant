'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ThemeContextType {
  isThemeLoading: boolean
  setThemeLoading: (loading: boolean) => void
  heading: string
  setHeading: (heading: string) => void
  welcomeMessage: string
  setWelcomeMessage: (message: string) => void
  MerchantSuggestions: string[]
  setMerchantSuggestions: (suggestions: string[]) => void
  isVisualiserEnabled: boolean
  setIsVisualiserEnabled: (enabled: boolean) => void
}

const DEFAULT_HEADING = 'Style your room'

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isThemeLoading, setThemeLoading] = useState(true)
  const [heading, setHeading] = useState(DEFAULT_HEADING)
  const [welcomeMessage, setWelcomeMessage] = useState("Upload a room photo and tell me what you're looking for.")
  const [MerchantSuggestions, setMerchantSuggestions] = useState([
          'Find a vintage rug for my bedroom',
          'Recommend a durable rug for a busy home',
          'Show eco-friendly rug options',
      ])
  // Default off: only promise the 3D visualiser for merchants whose config opts in.
  const [isVisualiserEnabled, setIsVisualiserEnabled] = useState(false)

  return (
    <ThemeContext.Provider value={{ isThemeLoading, setThemeLoading, heading, setHeading, welcomeMessage, setWelcomeMessage, MerchantSuggestions, setMerchantSuggestions, isVisualiserEnabled, setIsVisualiserEnabled }}>
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
