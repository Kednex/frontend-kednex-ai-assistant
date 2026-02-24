import { configureStore } from '@reduxjs/toolkit';
import chatReducer from '../store/chatSlice';
import visualiserReducer from '../store/visualiserSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            chat: chatReducer,
            visualiser: visualiserReducer,
        },
        devTools: process.env.NODE_ENV !== 'production',
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
