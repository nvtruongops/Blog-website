'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Navbar from '@/components/Navbar';
import Editor from '@/components/write/Editor';

export default function WritePage() {
  const user = useSelector((state) => state.user);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait a bit for Redux to load user from cookie
    const timer = setTimeout(() => {
      const userCookie = Cookies.get('user');
      if (!userCookie && !user) {
        router.push('/auth');
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="WritePost">
      <Navbar postpage />
      <Editor />
    </div>
  );
}
