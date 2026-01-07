import { createSlice } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const getInitialUser = () => {
  if (typeof window !== 'undefined') {
    const userCookie = Cookies.get('user');
    return userCookie ? JSON.parse(userCookie) : null;
  }
  return null;
};

const userSlice = createSlice({
  name: 'user',
  initialState: null,
  reducers: {
    login: (state, action) => action.payload,
    logout: () => null,
    updatePicture: (state, action) => ({
      ...state,
      picture: action.payload.picture,
      about: action.payload.about,
    }),
    verify: (state, action) => ({
      ...state,
      verified: action.payload,
    }),
    setLikes: (state, action) => ({
      ...state,
      likes: action.payload,
    }),
    setBookmarks: (state, action) => ({
      ...state,
      bookmarks: action.payload,
    }),
  },
});

export const { login, logout, updatePicture, verify, setLikes, setBookmarks } = userSlice.actions;
export default userSlice.reducer;
