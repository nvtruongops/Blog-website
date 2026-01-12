'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { BeatLoader } from 'react-spinners';
import { deletepost } from '@/lib/api';
import styles from './PostCard.module.css';

export default function PostCard({ post, type, onDelete, compact }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const date = new Date(post.createdAt);
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const formattedDate = date.toLocaleDateString('vi-VN', options);

  const isOwner = user && (post.user?._id === user.id || post.user === user.id);

  const handleClick = () => {
    if (!showConfirm) {
      router.push(`/article/${post._id}`);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const result = await deletepost(post._id, user.id, user.token);
      if (result.msg === 'ok') {
        if (onDelete) {
          onDelete(post._id);
        } else {
          window.location.reload();
        }
      } else {
        alert('Không thể xóa bài viết');
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
    setDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`} onClick={handleClick}>
      <div className={styles.imageWrapper}>
        <img src={post.image} alt={post.title} className={styles.image} />
        <span className={styles.category}>{post.category}</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{post.title}</h3>
        {!compact && (
          <p className={styles.description}>
            {post.description?.length > 80
              ? post.description.substring(0, 80) + '...'
              : post.description}
          </p>
        )}
        <div className={styles.meta}>
          {!compact && (
            <div className={styles.author}>
              <img
                src={post.user?.picture || '/default-avatar.svg'}
                alt={post.user?.name}
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
              <span>{post.user?.name || 'Anonymous'}</span>
            </div>
          )}
          <span className={styles.date}>{formattedDate}</span>
        </div>
        {!compact && (
          <div className={styles.stats}>
            <span>{post.views || 0} views</span>
            <span>{post.likes || 0} likes</span>
          </div>
        )}
        
        {/* Action buttons for post owner */}
        {(type === 'powner' || isOwner) && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <Link href={`/edit/${post._id}`} className={styles.editBtn}>
              Edit
            </Link>
            {!showConfirm ? (
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
              >
                Delete
              </button>
            ) : (
              <div className={styles.confirmDelete}>
                <span>Xác nhận xóa?</span>
                <button
                  className={styles.confirmYes}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <BeatLoader size={8} color="#fff" /> : 'Xóa'}
                </button>
                <button
                  className={styles.confirmNo}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirm(false);
                  }}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
