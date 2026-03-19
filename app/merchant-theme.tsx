'use client'

import { useEffect } from 'react'

const Backend = process.env.BackEnd || 'http://localhost:4000'

function normalizeHexColor(value: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(withHash)
  return isValid ? withHash : null
}

export default function MerchantTheme() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const userUuid = new URLSearchParams(window.location.search).get('userUuid') || ''
    if (!userUuid) return

    const controller = new AbortController()

    const applyTheme = async () => {
      try {
        const response = await fetch(`${Backend}/merchant/info/${userUuid}`, {
          signal: controller.signal,
        })

        if (!response.ok) return

        const payload = await response.json()
        const color = normalizeHexColor(payload?.primaryColor || '')
        if (!color) return

        const root = document.documentElement
        root.style.setProperty('--primary', color) // change primary color

        root.style.setProperty('--sidebar-primary', color)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('[MerchantTheme] Failed to apply theme', error)
      }
    }

    applyTheme()

    return () => controller.abort()
  }, [])

  return null
}
