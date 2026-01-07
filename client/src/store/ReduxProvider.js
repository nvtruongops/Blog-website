'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { store } from './store';
import { login } from './slices/userSlice';

function InitUser({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        if (userData && userData.id && userData.token) {
          dispatch(login(userData));
          // Refresh cookie expiry on each visit to keep user logged in
          Cookies.set('user', userCookie, { expires: 15 });
        }
      } catch (e) {
        // Invalid cookie, clear it
        Cookies.remove('user');
      }
    }
  }, [dispatch]);

  return children;
}

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <InitUser>{children}</InitUser>
    </Provider>
  );
}
