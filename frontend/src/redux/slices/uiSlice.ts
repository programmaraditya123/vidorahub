import { createSlice } from '@reduxjs/toolkit'

interface SidebarState {
  isCollapsed: boolean,
  isLight : boolean,
}

const initialState: SidebarState = {
  isCollapsed: false,
  isLight : false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isCollapsed = !state.isCollapsed
    },
    toggleTheme : (state) => {
       state.isLight = !state.isLight
    }
  },
})

export const { toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
