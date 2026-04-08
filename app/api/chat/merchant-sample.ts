export type MerchantThemeSample = {
  companyId: string
  aiAssistant: {
    isChatbotEnabled: boolean
    identity: {
      name: string
      description: string
      avatarUrl: string
    }
    behaviour: {
      tone: 'Friendly' | 'Professional' | 'Technical' | 'Minimal'
      welcomeMessage: string
    }
    rules: {
      fallbackResponse: string
    }
    theme: {
      primary: string
      highlight: string
      highlightText: string
      background: string
      radius: string
      font: string
    }
  }
}

const merchantThemeSamples: Record<string, MerchantThemeSample> = {
  '835b7458-9477-4394-8957-c1e65225a481': {
    companyId: '1',
    aiAssistant: {
      isChatbotEnabled: true,
      identity: {
        name: 'Design Assistant',
        description: 'Rug recommendation assistant',
        avatarUrl: 'https://example.com/avatar.png',
      },
      behaviour: {
        tone: 'Friendly',
        welcomeMessage: 'Upload a room photo and tell me your style.',
      },
      rules: {
        fallbackResponse: 'Sorry, I could not find a match yet. Try another style.',
      },
      theme: {
        primary: '#8d2424',
        highlight: '#f59e0b',
        highlightText: '#111827',
        background: '#fef9f9',
        radius: '5rem', //type: integer
        // font: 'Inter',
        font: 'Inter'
      },
    },
  },
}

export function getMerchantThemeSample(userUuid?: string) {
  if (!userUuid) return undefined
  return merchantThemeSamples[userUuid]
}
