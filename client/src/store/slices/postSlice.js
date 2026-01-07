import { createSlice } from '@reduxjs/toolkit';

const postSlice = createSlice({
  name: 'posts',
  initialState: [],
  reducers: {
    setPosts: (state, action) => {
      if (Array.isArray(action.payload)) {
        return [...state, ...action.payload];
      }
      return [...state, action.payload];
    },
    clearPosts: () => [],
  },
});

export const { setPosts, clearPosts } = postSlice.actions;
export default postSlice.reducer;
