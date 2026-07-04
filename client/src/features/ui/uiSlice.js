import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isLeadModalOpen: false,
  selectedLeadId: null,
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openLeadModal: (state, action) => {
      state.isLeadModalOpen = true
      state.selectedLeadId = action.payload
    },
    closeLeadModal: (state) => {
      state.isLeadModalOpen = false
      state.selectedLeadId = null
    },
  },
})

export const { openLeadModal, closeLeadModal } = uiSlice.actions

export default uiSlice.reducer
