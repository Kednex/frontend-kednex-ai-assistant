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

function normalizeRadius(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return `${numeric}px`
  }
  return null
}

function normalizeFont(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return `${trimmed}, ui-sans-serif, system-ui, -apple-system, sans-serif`
}

export default function MerchantTheme() {
  const { setThemeLoading } = useTheme()

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
        const theme = payload?.aiAssistant?.theme
        const color = normalizeHexColor(theme?.primary || payload?.primaryColor || '')
        const highlight = normalizeHexColor(theme?.highlight || '')
        const highlightText = normalizeHexColor(theme?.highlightText || '')
        const background = normalizeHexColor(theme?.background || '')
        const radius = normalizeRadius(theme?.radius)
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
          if (radius) root.style.setProperty('--radius', radius)
          if (font) root.style.setProperty('--font-sans', font)
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
