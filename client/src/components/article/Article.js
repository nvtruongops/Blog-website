'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { CiBookmark, CiHeart } from 'react-icons/ci';
import { BsDownload, BsFillBookmarkFill, BsThreeDotsVertical } from 'react-icons/bs';
import Popup from 'reactjs-popup';
import Footer from '../Footer';
import { sanitizeHTML, escapeHTML } from '@/lib/sanitize';
import {
  checklikes, decreastLike, increaseLike, bookmark, createcomment,
  getcomment, deletebookmark, checkbookmark, reportcontent, fetchprof,
  startfollow, checkfollowing, unfollow, getView, likes, deletelikes, getLikes,
  deletepost,
} from '@/lib/api';
import styles from './Article.module.css';

export default function Article({ post, __id }) {
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [postUser, setPostUser] = useState(post.user);

  const date = new Date(post.createdAt);
  const options = { month: 'long', day: 'numeric', year: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);
  // Sanitize post content for safe rendering
  const cleanHtml = sanitizeHTML(post.content);

  useEffect(() => {
    const init = async () => {
      const viewData = await getView(__id);
      setViewCount(viewData.view || 0);

      const likesData = await getLikes(__id);
      setLikeCount(likesData.likes || 0);

      if (post.user && !post.user.name) {
        const prof = await fetchprof(post.user);
        setPostUser({
          picture: prof.msg.picture,
          name: prof.msg.name,
          _id: prof.msg._id,
          about: prof.msg.about,
        });
      }

      if (user) {
        try {
          const followData = await checkfollowing(user.id, post.user._id || post.user);
          setIsFollowing(followData.msg === 'ok');

          const bookmarkData = await checkbookmark(__id, user.id);
          setIsBookmarked(bookmarkData.msg === 'ok');

          const likeData = await checklikes(__id, user.id);
          setIsLiked(likeData.msg === 'ok');
        } catch (error) {
          // Silently handle auth errors - user session may have expired
          if (error.response?.status !== 401) {
            console.error('Error fetching user state:', error);
          }
        }
      }
    };
    init();
  }, [__id, user, post.user]);

  const handleDownload = () => {
    // Escape user-generated content to prevent XSS in print window
    const safeTitle = escapeHTML(post.title);
    const safeAuthorName = escapeHTML(postUser.name);
    const safeCategory = escapeHTML(post.category?.toUpperCase() || '');
    // Use already sanitized content for the body
    const safeContent = sanitizeHTML(post.content);
    
    // Create a printable version of the article
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; margin-bottom: 10px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
          .author { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
          .author img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
          .author-info { font-weight: bold; }
          .main-image { width: 100%; max-height: 400px; object-fit: cover; margin-bottom: 20px; border-radius: 8px; }
          .content { line-height: 1.8; color: #333; }
          .content img { max-width: 100%; height: auto; margin: 10px 0; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="author">
          <img src="${postUser.picture || '/default-avatar.svg'}" alt="${safeAuthorName}" onerror="this.style.display='none'" />
          <div class="author-info">${safeAuthorName}</div>
        </div>
        <h1>${safeTitle}</h1>
        <div class="meta">${formattedDate} | ${safeCategory} | ${viewCount} views | ${likeCount} likes</div>
        <img class="main-image" src="${post.image}" alt="${safeTitle}" onerror="this.style.display='none'" />
        <div class="content">${safeContent}</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for images to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      toast.success('Print dialog opened! Save as PDF to download.');
    } else {
      toast.error('Please allow popups to download');
    }
  };

  const handleLike = async () => {
    if (!user) { router.push('/auth'); return; }
    await increaseLike(__id);
    const data = await likes(__id, user.id);
    if (data.msg === 'ok') {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      toast.success('Liked!');
    }
  };

  const handleUnlike = async () => {
    await decreastLike(__id);
    await deletelikes(__id, user.id);
    setIsLiked(false);
    setLikeCount((prev) => prev - 1);
  };

  const handleBookmark = async () => {
    if (!user) { router.push('/auth'); return; }
    const data = await bookmark(__id, user.id);
    if (data.msg === 'ok') {
      setIsBookmarked(true);
      toast.success('Bookmark Added');
    }
  };

  const handleRemoveBookmark = async () => {
    const data = await deletebookmark(__id, user.id);
    if (data.msg === 'deleted') setIsBookmarked(false);
  };

  const handleFollow = async () => {
    if (!user) { router.push('/auth'); return; }
    // Prevent following yourself
    if (user.id === postUser._id) return;
    await startfollow(user.id, postUser._id);
    setIsFollowing(true);
  };

  const handleUnfollow = async () => {
    await unfollow(user.id, postUser._id);
    setIsFollowing(false);
  };

  const loadComments = async () => {
    const data = await getcomment(__id);
    if (Array.isArray(data)) {
      setComments(data.reverse());
    }
  };

  const handleComment = async () => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }
    if (comment.length <= 0 || comment.length >= 550) {
      alert('Comment must be between 1 and 550 characters');
      return;
    }
    try {
      const data = await createcomment(user.name, user.picture, comment, user.id, __id, user.token);
      if (data.msg === 'ok') {
        setComment('');
        loadComments();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Failed to post comment');
      }
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    await reportcontent(__id, postUser._id, user.id, postUser.name, user.name, reportReason);
    toast.success('Reported');
  };

  const handleEdit = () => {
    router.push(`/edit/${__id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await deletepost(__id, user.id, user.token);
      toast.success('Đã xóa bài viết');
      router.push('/');
    } catch (error) {
      toast.error('Không thể xóa bài viết');
    }
  };

  const isOwner = user && (user.id === postUser._id || user.id === post.user);

  if (!postUser) return <div>Loading...</div>;

  return (
    <div className={styles.wrapper} id="article-content">
      <div className={styles.article}>
        <div className={styles.userInfo}>
          <div className={styles.userImage}>
            <img src={postUser.picture} alt={postUser.name} onClick={() => window.open(postUser.picture, '_blank')} />
          </div>
          <div className={styles.userSide}>
            <Link href={user ? `/profile/${postUser._id}` : '/auth'} className={styles.userName}>
              {postUser.name}
            </Link>
            <span className={styles.userAbout}>&quot;{postUser.about || 'User'}&quot;</span>
          </div>
          {user?.id !== postUser._id && (
            <div className={styles.followBtn} onClick={isFollowing ? handleUnfollow : handleFollow}>
              {isFollowing ? 'Following' : '+Follow'}
            </div>
          )}
          <div className={styles.actions}>
            <BsDownload size={25} onClick={handleDownload} className={styles.icon} />
            {isLiked ? (
              <CiHeart size={25} onClick={handleUnlike} className={styles.iconActive} style={{ color: '#ff00f7' }} />
            ) : (
              <CiHeart size={25} onClick={handleLike} className={styles.icon} />
            )}
            {isBookmarked ? (
              <BsFillBookmarkFill size={25} onClick={handleRemoveBookmark} className={styles.iconActive} />
            ) : (
              <CiBookmark size={25} onClick={handleBookmark} className={styles.icon} />
            )}
            <div className={styles.menuWrapper}>
              <BsThreeDotsVertical
                size={25}
                className={styles.icon}
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && (
                <>
                  <div className={styles.menuOverlay} onClick={() => setShowMenu(false)} />
                  <div className={styles.menu}>
                    {isOwner ? (
                      <>
                        <button className={styles.editBtn} onClick={handleEdit}>
                          Chỉnh sửa
                        </button>
                        <button className={styles.deleteBtn} onClick={handleDelete}>
                          Xóa
                        </button>
                      </>
                    ) : (
                      <Popup trigger={<button className={styles.reportBtn}>Report</button>} modal>
                        <div className={styles.modal}>
                          <h2>Report</h2>
                          <input
                            type="text"
                            placeholder="Enter reason..."
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                          />
                          <button onClick={handleReport}>Submit</button>
                        </div>
                      </Popup>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <h1 className={styles.title}>{post.title}</h1>
        <span className={styles.meta}>
          {formattedDate.toUpperCase()} | {post.category.toUpperCase()} | {viewCount} views | {likeCount} likes
        </span>

        <div className={styles.imageWrapper}>
          <img src={post.image} alt={post.title} />
        </div>

        <div className={styles.content} dangerouslySetInnerHTML={{ __html: cleanHtml }} />

        <hr />

        <div className={styles.comments}>
          <h3 onClick={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}>
            {showComments ? 'Comments:' : 'Show Comments'}
          </h3>

          {showComments && (
            user ? (
              <div>
                <div className={styles.addComment}>
                  <textarea
                    placeholder="Add Comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button onClick={handleComment}>Submit</button>
                </div>
                {comments.length === 0 ? (
                  <p>Be the First One to Comment</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className={styles.commentItem}>
                      <img 
                        src={c.image || '/default-avatar.svg'} 
                        alt={c.name} 
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.target.src = '/default-avatar.svg'; }}
                      />
                      <div>
                        <Link href={`/profile/${c.commentBy}`}>{c.name}</Link>
                        <span>{new Date(c.commentAt).toLocaleDateString()}</span>
                        <p>{c.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p>Sign in to comment</p>
            )
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
