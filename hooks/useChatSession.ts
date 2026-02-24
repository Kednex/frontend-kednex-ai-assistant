import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
import { RootState } from '@/lib/store/store'
import { setSessionId, setRooms, setCategory } from '@/lib/store/chatSlice'
import type { ChatSession } from '@/lib/types'
import { generateUUID } from '@/lib/utils/uuid'
import { normalizeRooms } from '@/lib/utils/storage'

const STORAGE_KEYS = {
    CHAT_ACTIVE_SESSION: 'imersian:chat_active_session',
    CHAT_SESSION_INDEX: 'imersian:chat_session_index'
} as const

export function useChatSession() {
    const dispatch = useAppDispatch()
    const { sessionId, category, rooms, intent } = useAppSelector(
        (state: RootState) => state.chat
    )

    const hasHydratedRef = useRef(false)
    const isNewChatFromIntro = useRef(false)
    const [hydrated, setHydrated] = useState(false)

    // Hydrate once
    useEffect(() => {
        if (hasHydratedRef.current) return
        hasHydratedRef.current = true

        try {
            let session: ChatSession | null = null
            let shouldAutoIntro = false

            if (intent?.sessionId) {
                session = intent
                if (intent.messages.length === 0) {
                    shouldAutoIntro = true
                }
            } else {
                const raw = localStorage.getItem(STORAGE_KEYS.CHAT_ACTIVE_SESSION)
                if (raw) {
                    session = JSON.parse(raw) as ChatSession
                }
            }

            if (!session) {
                session = {
                    sessionId: generateUUID(),
                    category: '',
                    contextUploads: [],
                    messages: [],
                    previousResponseId: null,
                    timestamp: Date.now()
                }
            }

            dispatch(setSessionId(session.sessionId))
            dispatch(setCategory(session.category || ''))
            dispatch(setRooms(normalizeRooms(session.contextUploads || [])))

            if (shouldAutoIntro) {
                isNewChatFromIntro.current = true
            }

            setHydrated(true)
        } catch (e) {
            console.error('[useChatSession] Hydration error:', e)
            setHydrated(true)
        }
    }, [dispatch, intent])

    // Memoise body so it updates when category/rooms change
    const chatBody = useMemo(() => {
        return {
            sessionId,
            category,
            rooms: rooms.map(r => r.imageUrl)
        }
    }, [sessionId, category, rooms])

    const chatApi = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: chatBody,
        }),
        id: sessionId || undefined,
        onError: (error) => {
            console.error('Chat error:', error)
        }
    })

    const { messages, setMessages, sendMessage: sdkSendMessage, status } = chatApi
    const isLoading = status === 'submitted' || status === 'streaming'

    // Restore previous messages AFTER hydration + chat initialised
    useEffect(() => {
        if (!hydrated) return
        if (!sessionId) return

        const raw = localStorage.getItem(STORAGE_KEYS.CHAT_ACTIVE_SESSION)
        if (!raw) return

        const session = JSON.parse(raw) as ChatSession
        if (session.messages?.length) {
            setMessages(session.messages)
        }
    }, [hydrated, sessionId, setMessages])

    // Autosave
    useEffect(() => {
        if (!sessionId) return

        const timeout = setTimeout(() => {
            const session: ChatSession = {
                sessionId,
                category,
                messages,
                contextUploads: rooms,
                timestamp: Date.now(),
                previousResponseId: null
            }

            try {
                localStorage.setItem(
                    STORAGE_KEYS.CHAT_ACTIVE_SESSION,
                    JSON.stringify(session)
                )

                const indexRaw = localStorage.getItem(
                    STORAGE_KEYS.CHAT_SESSION_INDEX
                )
                const index: ChatSession[] = indexRaw
                    ? JSON.parse(indexRaw)
                    : []

                const existing = index.findIndex(
                    s => s.sessionId === session.sessionId
                )

                if (existing >= 0) {
                    index[existing] = session
                } else {
                    index.unshift(session)
                }

                localStorage.setItem(
                    STORAGE_KEYS.CHAT_SESSION_INDEX,
                    JSON.stringify(index.slice(0, 10))
                )
            } catch (e) {
                console.error('Failed to save session', e)
            }
        }, 800)

        return () => clearTimeout(timeout)
    }, [sessionId, messages, category, rooms])

    // Auto intro
    useEffect(() => {
        if (
            !isNewChatFromIntro.current ||
            messages.length > 0 ||
            !category ||
            rooms.length === 0
        )
            return

        isNewChatFromIntro.current = false

        const introText = `Here is my room. Please recommend ${category.toLowerCase()} that would suit this interior.`

        sdkSendMessage({ text: introText })
    }, [messages.length, category, rooms.length, sdkSendMessage])

    const getChatSession = useCallback((): ChatSession => {
        return {
            sessionId: sessionId || '',
            category,
            messages: messages as any[],
            contextUploads: rooms,
            timestamp: Date.now(),
            previousResponseId: null,
        };
    }, [sessionId, category, messages, rooms]);

    // Expose an adapted sendMessage that matches what UI expects
    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return
            if (isLoading) return

            await sdkSendMessage({ text: content })
        },
        [sdkSendMessage, isLoading]
    )

    return {
        ...chatApi,
        sendMessage,
        category,
        rooms,
        sessionId,
        hydrated,
        isLoading,
        getChatSession
    }
}