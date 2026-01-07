'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getUser,
  startfollow,
  checkfollowing,
  unfollow,
  getfollowercount,
  getfollowingcount,
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
    };

    fetchUserData();
  }, [userID, user, router]);

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
      <Navbar />
      <div className={styles.userWrapper}>
        <div className={styles.userImage}>
          <img
            src={otherUser?.picture || '/default-avatar.svg'}
            alt={otherUser?.name}
            onClick={() => window.open(otherUser?.picture, '_blank')}
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

      <Footer />
    </div>
  );
}
