'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UserProfile from '@/components/profile/UserProfile';

export default function ProfilePage() {
  const user = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) return null;

  return <UserProfile />;
}
