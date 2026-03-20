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

export default function MerchantTheme() {
  const { setThemeLoading } = useTheme()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userUuid = new URLSearchParams(window.location.search).get('userUuid') || ''

    // If no userUuid, set theme as loaded immediately
    if (!userUuid) {
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
          setThemeLoading(false)
          return
        }

        const payload = await response.json()
        const color = normalizeHexColor(payload?.primaryColor || '')

        if (color) {
          const root = document.documentElement
          root.style.setProperty('--primary', color) // change primary color
          root.style.setProperty('--sidebar-primary', color)
        }

        // Set theme as loaded after applying colors
        setThemeLoading(false)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('[MerchantTheme] Failed to apply theme', error)
        setThemeLoading(false)
      }
    }

    applyTheme()

    return () => controller.abort()
  }, [setThemeLoading])

  return null
}
