import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RoomContext, ChatSession } from '../types';

interface ChatState {
    isActive: boolean;             // Whether chat UI is open
    sessionId: string | null;      // Current session ID
    category: string;              // Current category
    rooms: RoomContext[];          // Active room contexts
    intent: ChatSession | null;    // Pending intent (restore session, etc.)
}

const initialState: ChatState = {
    isActive: false,
    sessionId: null,
    category: '',
    rooms: [],
    intent: null,
};

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setChatActive: (state, action: PayloadAction<boolean>) => {
            state.isActive = action.payload;
        },
        setSessionId: (state, action: PayloadAction<string>) => {
            state.sessionId = action.payload;
        },
        setCategory: (state, action: PayloadAction<string>) => {
            state.category = action.payload;
        },
        setRooms: (state, action: PayloadAction<RoomContext[]>) => {
            state.rooms = action.payload;
        },
        addRoom: (state, action: PayloadAction<RoomContext>) => {
            state.rooms.push(action.payload);
        },
        setIntent: (state, action: PayloadAction<ChatSession | null>) => {
            state.intent = action.payload;
        },
        clearSession: (state) => {
            state.sessionId = null;
            state.category = '';
            state.rooms = [];
            state.intent = null;
        }
    },
});

export const {
    setChatActive,
    setSessionId,
    setCategory,
    setRooms,
    addRoom,
    setIntent,
    clearSession
} = chatSlice.actions;

export default chatSlice.reducer;
