'use client'

import { useTheme } from './theme-context'
import { ThemeLoader } from '@/components/ui/theme-loader'

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isThemeLoading } = useTheme()

  return (
    <>
      {isThemeLoading && <ThemeLoader />}
      <div className={isThemeLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}>
        {children}
      </div>
    </>
  )
}
