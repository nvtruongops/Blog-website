'use client';

import { useEffect, useState, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { PuffLoader } from 'react-spinners';
import PostCard from './PostCard';
import { getAllPost } from '@/lib/api';
import styles from './Posts.module.css';

export default function Posts({ category, filterBy = 'latest', sortBy = 'date', searchQuery = '' }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await getAllPost(page, category);
      if (data.msg && data.msg.length > 0) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newPosts = data.msg.filter((p) => !existingIds.has(p._id));
          return [...prev, ...newPosts];
        });
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
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const data = await getAllPost(1, category);
        if (data.msg && data.msg.length > 0) {
          setPosts(data.msg);
          setPage(2);
          setHasMore(true);
        } else {
          setPosts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [category]);

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query) ||
          post.user?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterBy === 'popular') {
      result = result.filter((post) => (post.views || 0) >= 10);
    } else if (filterBy === 'trending') {
      // Trending = high engagement in recent posts (likes + views)
      result = result.filter((post) => (post.likes || 0) + (post.views || 0) >= 5);
    }
    // 'latest' shows all posts

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        case 'date':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return result;
  }, [posts, filterBy, sortBy, searchQuery]);

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
        {filteredAndSortedPosts.length > 0 ? (
          filteredAndSortedPosts.map((post, i) => (
            <PostCard post={post} key={post._id || i} />
          ))
        ) : (
          !loading && (
            <p className={styles.noResults}>
              No posts found {searchQuery && `for "${searchQuery}"`}
            </p>
          )
        )}
      </div>
    </InfiniteScroll>
  );
}
