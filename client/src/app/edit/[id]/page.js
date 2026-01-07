'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Navbar from '@/components/Navbar';
import EditorP from '@/components/write/EditorP';
import { getarticle } from '@/lib/api';

export default function EditPostPage() {
  const user = useSelector((state) => state.user);
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchPost = async () => {
      try {
        const dt = await getarticle(id);
        setPost(dt.msg);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user, router]);

  if (!user) return null;

  if (loading || !post?.user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1 style={{ fontWeight: 'bold' }}>Loading....</h1>
        <p style={{ fontSize: '24px' }}>You can comment, save, bookmark and download page</p>
      </div>
    );
  }

  return (
    <div className="WritePost">
      <Navbar postpage />
      <EditorP post={post} pflag={true} />
    </div>
  );
}
