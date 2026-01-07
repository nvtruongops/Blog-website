'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import styles from './PostCard.module.css';

export default function PostCard({ post, type }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);

  const date = new Date(post.createdAt);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);

  const handleClick = () => {
    router.push(`/article/${post._id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.imageWrapper}>
        <img src={post.image} alt={post.title} className={styles.image} />
        <span className={styles.category}>{post.category}</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{post.title}</h3>
        <p className={styles.description}>
          {post.description?.length > 100
            ? post.description.substring(0, 100) + '...'
            : post.description}
        </p>
        <div className={styles.meta}>
          <div className={styles.author}>
            <img
              src={post.user?.picture || '/default-avatar.png'}
              alt={post.user?.name}
              className={styles.avatar}
              referrerPolicy="no-referrer"
            />
            <span>{post.user?.name || 'Anonymous'}</span>
          </div>
          <span className={styles.date}>{formattedDate}</span>
        </div>
        <div className={styles.stats}>
          <span>{post.views || 0} views</span>
          <span>{post.likes || 0} likes</span>
        </div>
        {type === 'powner' && (
          <Link
            href={`/edit/${post._id}`}
            className={styles.editBtn}
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  );
}
