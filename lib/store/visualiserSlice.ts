import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../types';

export interface VisualiserState {
    userUploadedImage: string | null;  // Equivalent to roomBackgroundUrl
    designId: string | null;           // Equivalent to designId / spaceDesignUuid
    activeRug: Product | null;         // Rug to open in visualiser
    activeFurniture: Product[];        // Furniture objects 
    sceneObjects: any[];               // General scene objects
}

const initialState: VisualiserState = {
    userUploadedImage: null,
    designId: null,
    activeRug: null,
    activeFurniture: [],
    sceneObjects: [],
};

export const visualiserSlice = createSlice({
    name: 'visualiser',
    initialState,
    reducers: {
        setUserUploadedImage: (state, action: PayloadAction<string | null>) => {
            state.userUploadedImage = action.payload;
        },
        setDesignId: (state, action: PayloadAction<string | null>) => {
            state.designId = action.payload;
        },
        setActiveRug: (state, action: PayloadAction<Product | null>) => {
            state.activeRug = action.payload;
        },
        addActiveFurniture: (state, action: PayloadAction<Product>) => {
            state.activeFurniture.push(action.payload);
        },
        removeActiveFurniture: (state, action: PayloadAction<string>) => {
            state.activeFurniture = state.activeFurniture.filter(f => f.id !== action.payload);
        },
        clearActiveFurniture: (state) => {
            state.activeFurniture = [];
        },
        setSceneObjects: (state, action: PayloadAction<any[]>) => {
            state.sceneObjects = action.payload;
        }
    },
});

export const {
    setUserUploadedImage,
    setDesignId,
    setActiveRug,
    addActiveFurniture,
    removeActiveFurniture,
    clearActiveFurniture,
    setSceneObjects
} = visualiserSlice.actions;

export default visualiserSlice.reducer;
