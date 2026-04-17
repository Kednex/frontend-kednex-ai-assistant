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
    suggestions: string []
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
      suggestions: [
        "Give me a modern rug recommendation for my living room",
        "I'm looking for a vintage rug for my bedroom, any suggestions?",
        "Can you recommend a durable rug for a high-traffic area?",
        "What are some eco-friendly rug options?"
      ],
      rules: {
        fallbackResponse: 'Sorry, I could not find a match yet. Try another style.',
      },
      theme: {
        primary: '#8d2424',
        highlight: '#f59e0b',
        highlightText: '#111827',
        background: '#fef9f9',
        radius: '1rem',
        font: 'Inter',
        // font: 'Playwrite IE'
      },
    },
  },
  '8fd0db69-b8cf-4356-8689-6c1a0719fe80': {
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
      },suggestions: [
        "what rug styles would go well with a Scandinavian living room?",
        "I have a bohemian bedroom, can you suggest some rug styles that would fit?",
        "I need a durable rug for my kids playroom, any style recommendations?",
        "Give me budget-friendly rug options?"
      ],
      rules: {
        fallbackResponse: 'Sorry, I could not find a match yet. Try another style.',
      },
      theme: {
        primary: '#24328d',
        highlight: '#90ef93',
        highlightText: '#111827',
        background: '#fef9f9',
        radius: '0rem',
        font: 'Inter',
        // font: 'Playwrite IE'
      },
    },
  },
}



export function getMerchantThemeSample(userUuid?: string) {
  if (!userUuid) return undefined
  return merchantThemeSamples[userUuid]
}
