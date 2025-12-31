import { configureStore } from '@reduxjs/toolkit'
import { api } from './services/api'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    ui : uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
