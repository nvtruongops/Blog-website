'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PostCard from '@/components/home/PostCard';
import {
  getUser,
  startfollow,
  checkfollowing,
  unfollow,
  getfollowercount,
  getfollowingcount,
  showmyposts,
} from '@/lib/api';
import styles from './otherProfile.module.css';

export default function ProfileOfOtherUser() {
  const params = useParams();
  const userID = params.userID;
  const user = useSelector((state) => state.user);
  const router = useRouter();
  const [otherUser, setOtherUser] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  // Filter states - passed to Navbar
  const [category, setCategory] = useState('all');
  const [filterBy, setFilterBy] = useState('latest');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (userID === user?.id) {
        router.push('/profile');
        return;
      }

      const data = await getUser(userID);
      setOtherUser(data._doc);

      if (user) {
        const sfcr = await checkfollowing(user.id, userID);
        setIsFollowing(sfcr?.msg === 'ok');
      }

      const followerData = await getfollowercount(userID);
      const followingData = await getfollowingcount(userID);
      setFollowerCount(followerData.data.msg);
      setFollowingCount(followingData.data.msg);

      const postsData = await showmyposts(userID);
      setPosts(postsData.msg || []);
      setLoadingPosts(false);
    };

    fetchUserData();
  }, [userID, user, router]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.toLowerCase().includes(query) ||
          post.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter((post) => post.category === category);
    }

    // Filter by type
    if (filterBy === 'popular') {
      result = result.filter((post) => (post.views || 0) >= 10);
    } else if (filterBy === 'trending') {
      result = result.filter((post) => (post.likes || 0) + (post.views || 0) >= 5);
    }

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
  }, [posts, searchQuery, sortBy, category, filterBy]);

  const handleFollow = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const data = await startfollow(user.id, otherUser._id);
    if (data.msg === 'ok') {
      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }
  };

  const handleUnfollow = async () => {
    const data = await unfollow(user.id, otherUser._id);
    if (data.msg === 'ok') {
      setIsFollowing(false);
      setFollowerCount((prev) => prev - 1);
    }
  };

  return (
    <div className={styles.container}>
      <Navbar 
        showFilters={true}
        category={category}
        setCategory={setCategory}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className={styles.userWrapper}>
        <div className={styles.userImage}>
          <img
            src={otherUser?.picture || '/default-avatar.svg'}
            alt={otherUser?.name}
            onClick={() => window.open(otherUser?.picture, '_blank')}
            referrerPolicy="no-referrer"
          />
          <span className={styles.name}>{otherUser?.name}</span>
        </div>
        <div className={styles.about}>{otherUser?.about}</div>
      </div>

      <div className={styles.followBtn} onClick={isFollowing ? handleUnfollow : handleFollow}>
        {isFollowing ? 'FOLLOWING' : '+FOLLOW'}
      </div>

      <div className={styles.stats}>
        <div>Following: {followingCount}</div>
        <div>Followers: {followerCount}</div>
      </div>

      {/* User's Posts Section */}
      <div className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>
          Posts by {otherUser?.name || 'User'} ({filteredPosts.length})
        </h2>

        {loadingPosts ? (
          <p className={styles.loading}>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className={styles.noPosts}>No posts yet</p>
        ) : filteredPosts.length === 0 ? (
          <p className={styles.noPosts}>No posts found matching your filters</p>
        ) : (
          <div className={styles.postsGrid}>
            {filteredPosts.map((post) => (
              <PostCard post={post} key={post._id} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
