'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Article from '@/components/article/Article';
import { getarticle, increaseView } from '@/lib/api';

export default function ArticlePage() {
  const router = useRouter();
  const params = useParams();
  const postID = params.postID;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await increaseView(postID);
        const dt = await getarticle(postID);
        if (dt.response?.status === 404 || dt.response?.status === 400) {
          router.push('/404');
          return;
        }
        setPost(dt.msg);
      } catch (error) {
        router.push('/404');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [postID, router]);

  if (loading || !post?.image) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1 style={{ fontWeight: 'bold' }}>Loading....</h1>
        <p style={{ fontSize: '24px' }}>You can comment, save, bookmark and download page</p>
      </div>
    );
  }

  return (
    <div className="ArticlePage">
      <Navbar />
      <Article post={post} __id={postID} />
    </div>
  );
}
