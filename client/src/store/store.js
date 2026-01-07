import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import postReducer from './slices/postSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});
