import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SidebarState {
  isCollapsed: boolean,
  isLight : boolean,
  videoId: string | null,
}

const initialState: SidebarState = {
  isCollapsed: false,
  isLight : false,
  videoId: null,
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
    },
    setVideoId : (state,action : PayloadAction<string | null>) => {
       state.videoId = action.payload;
    }
  },
})

export const { toggleSidebar,setVideoId } = uiSlice.actions
export default uiSlice.reducer
