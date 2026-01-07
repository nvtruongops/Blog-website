'use client';

import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PuffLoader } from 'react-spinners';
import PostCard from './PostCard';
import { getAllPost } from '@/lib/api';
import styles from './Posts.module.css';

export default function Posts({ category }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await getAllPost(page, category);
      if (data.msg && data.msg.length > 0) {
        setPosts((prev) => [...prev, ...data.msg]);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchPosts();
  }, [category]);

  if (loading && posts.length === 0) {
    return (
      <div className={styles.loader}>
        <PuffLoader color="black" />
      </div>
    );
  }

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={fetchPosts}
      hasMore={hasMore}
      loader={
        <div className={styles.loader}>
          <PuffLoader color="#000" size={40} />
        </div>
      }
      endMessage={
        posts.length > 0 && (
          <p className={styles.endMessage}>
            <b>No More Posts!</b>
          </p>
        )
      }
    >
      <div className={styles.container}>
        {posts.map((post, i) => (
          <PostCard post={post} key={post._id || i} />
        ))}
      </div>
    </InfiniteScroll>
  );
}
