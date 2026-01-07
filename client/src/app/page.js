'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import Navbar from '@/components/Navbar';
import Card from '@/components/home/Card';
import Breaker from '@/components/home/Breaker';
import Posts from '@/components/home/Posts';
import Footer from '@/components/Footer';
import { login } from '@/store/slices/userSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    // Kiểm tra user từ cookie khi load trang
    const userCookie = Cookies.get('user');
    if (!user && userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        dispatch(login(userData));
      } catch (err) {
        console.error('Parse user cookie failed:', err);
      }
    }
  }, [user, dispatch]);

  return (
    <div className="HomePage">
      <Navbar user={user} />
      <Card />
      <Breaker text="Featured Post" />
      <Posts category="all" />
      <Footer />
    </div>
  );
}
