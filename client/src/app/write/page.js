'use client';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Editor from '@/components/write/Editor';

export default function WritePage() {
  const user = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="WritePost">
      <Navbar postpage />
      <Editor />
    </div>
  );
}
