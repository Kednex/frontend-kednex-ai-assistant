'use client'

import { useEffect } from 'react'
import { useTheme } from './theme-context'

function normalizeHexColor(value: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(withHash)
  return isValid ? withHash : null
}

// normalize radius values, allowing numbers (assumed to be px) or strings with units
// function normalizeRadius(value: unknown): string | null {
//   if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
//   if (typeof value === 'string' && value.trim()) {
//     const trimmed = value.trim()
//     const normalized = trimmed.replace(/\s+/g, '')
//     // ✅ Accept already-unitized values like '24px', '1.5rem', '0.5em'
//     if (/^\d+(\.\d+)?(px|rem|em)$/.test(normalized)) return normalized
//     // ✅ Accept plain numbers as strings like '24'
//     const numeric = Number(normalized)
//     if (Number.isFinite(numeric)) return `${numeric}px`
//   }
//   return null
// }

// set radius values for radius-sm, radius-md, radius-lg according to the provided radius value
function applyRadius(RadiusType: string) {
  switch (RadiusType) {
    case 'sharp':
      document.documentElement.style.setProperty('--radius-sm', '0px')
      document.documentElement.style.setProperty('--radius-md', '0px')
      document.documentElement.style.setProperty('--radius-lg', '0px')
      break
    case 'medium-rounded':
      document.documentElement.style.setProperty('--radius-sm', '10px')
      document.documentElement.style.setProperty('--radius-md', '20px')
      document.documentElement.style.setProperty('--radius-lg', '30px')
      break
    case 'fully-rounded':
      document.documentElement.style.setProperty('--radius-sm', '40px')
      document.documentElement.style.setProperty('--radius-md', '50px')
      document.documentElement.style.setProperty('--radius-lg', '60px')
      break
  }
}






function normalizeFont(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return `${trimmed}, ui-sans-serif, system-ui, -apple-system, sans-serif`
}

function toGoogleFontFamily(value: string): string {
  return value.trim().replace(/\s+/g, '+')
}

function ensureGoogleFontLoaded(fontFamily: string) {
  if (typeof document === 'undefined') return
  const id = 'merchant-theme-font'
  const existing = document.getElementById(id)
  const fontUrl = `https://fonts.googleapis.com/css2?family=${toGoogleFontFamily(fontFamily)}:wght@300;400;500;600;700&display=swap`

  if (existing) {
    if ((existing as HTMLLinkElement).href !== fontUrl) {
      ;(existing as HTMLLinkElement).href = fontUrl
    }
    return
  }

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = fontUrl
  document.head.appendChild(link)
}

function removeGoogleFont() {
  if (typeof document === 'undefined') return
  const existing = document.getElementById('merchant-theme-font')
  if (existing) existing.remove()
}

export default function MerchantTheme() {
  const { setThemeLoading, setWelcomeMessage, setMerchantSuggestions } = useTheme()

  const resetThemeColors = () => {
    const root = document.documentElement
    root.style.removeProperty('--primary')
    root.style.removeProperty('--sidebar-primary')
    root.style.removeProperty('--accent')
    root.style.removeProperty('--accent-foreground')
    root.style.removeProperty('--background')
    root.style.removeProperty('--card')
    root.style.removeProperty('--popover')
    root.style.removeProperty('--radius')
    root.style.removeProperty('--font-sans')
    removeGoogleFont()
    setWelcomeMessage('How can I help you today?') // reset to default welcome message
    setMerchantSuggestions([
        'Find products under $2000.',
        'Show blue wool products.',
        'Recommend washable area products.',
        'List outdoor products on sale.',
    ]) // reset merchant suggestions
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userUuid = new URLSearchParams(window.location.search).get('userUuid') || ''

    // If no userUuid, set theme as loaded immediately
    if (!userUuid) {
      resetThemeColors()
      setThemeLoading(false)
      return
    }

    const controller = new AbortController()

    const applyTheme = async () => {
      try {
        // Load response from the frontend route that proxies the Imersian backend, which includes the primary color for the merchant's theme
        const response = await fetch(`/api/chat?userUuid=${encodeURIComponent(userUuid)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          resetThemeColors()
          setThemeLoading(false)
          return
        }

        const payload = await response.json()
        console.log("Merchant theme payload:", payload)
        const MerchantSuggetions = payload?.aiAssistant?.suggestions
        const theme = payload?.aiAssistant?.theme
        const nextWelcome = payload?.aiAssistant?.behaviour?.welcomeMessage // allow dynamic welcome message from backend, fallback to default if not provided
        const color = normalizeHexColor(theme?.primary || payload?.primaryColor || '')
        const highlight = normalizeHexColor(theme?.highlight || '')
        const highlightText = normalizeHexColor(theme?.highlightText || '')
        const background = normalizeHexColor(theme?.background || '')
        // const radius = normalizeRadius(theme?.radius)
        const radius = theme?.radius
        const font = normalizeFont(theme?.font)

        if (color) {
          const root = document.documentElement
          root.style.setProperty('--primary', color) // change primary color
          root.style.setProperty('--sidebar-primary', color)
          if (highlight) root.style.setProperty('--accent', highlight)
          if (highlightText) root.style.setProperty('--accent-foreground', highlightText)
          if (background) {
            root.style.setProperty('--background', background)
            root.style.setProperty('--card', background)
            root.style.setProperty('--popover', background)
          }
          // if (radius) {
          //   root.style.setProperty('--radius', radius)
          // }
          if (radius) {
            applyRadius(radius)
          }

          // change font and load from Google Fonts if specified  
          if (font) {
            ensureGoogleFontLoaded(theme.font)  // ✅ loads wght@300;400;500;600;700
            root.style.setProperty('--font-sans', `'${theme.font}', sans-serif`)
          }
          // Set welcome message if provided, otherwise keep default
          if (typeof nextWelcome === 'string' && nextWelcome.trim()) {
            setWelcomeMessage(nextWelcome.trim())
          }

          // Set suggestions if provided
          if (MerchantSuggetions && Array.isArray(MerchantSuggetions)) {
            setMerchantSuggestions(MerchantSuggetions.filter((s): s is string => typeof s === 'string' && s.trim().length > 0))
          }
        } else {
          resetThemeColors()
        }

        // Set theme as loaded after applying colors
        setThemeLoading(false)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('[MerchantTheme] Failed to apply theme', error)
        resetThemeColors()
        setThemeLoading(false)
      }
    }

    applyTheme()

    return () => controller.abort()
  }, [setThemeLoading])

  return null
}
