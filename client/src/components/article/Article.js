'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import DOMPurify from 'isomorphic-dompurify';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { CiBookmark, CiHeart } from 'react-icons/ci';
import { BsDownload, BsFillBookmarkFill, BsThreeDotsVertical } from 'react-icons/bs';
import Popup from 'reactjs-popup';
import Footer from '../Footer';
import {
  checklikes, decreastLike, increaseLike, bookmark, createcomment,
  getcomment, deletebookmark, checkbookmark, reportcontent, fetchprof,
  startfollow, checkfollowing, unfollow, getView, likes, deletelikes, getLikes,
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
  const cleanHtml = DOMPurify.sanitize(post.content, { FORCE_BODY: true });

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
        const followData = await checkfollowing(user.id, post.user._id || post.user);
        setIsFollowing(followData.msg === 'ok');

        const bookmarkData = await checkbookmark(__id, user.id);
        setIsBookmarked(bookmarkData.msg === 'ok');

        const likeData = await checklikes(__id, user.id);
        setIsLiked(likeData.msg === 'ok');
      }
    };
    init();
  }, [__id, user, post.user]);

  const handleDownload = () => {
    htmlToImage.toPng(document.getElementById('article-content'), { quality: 1.0 })
      .then((dataUrl) => {
        const pdf = new jsPDF();
        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('ALLBlogs.pdf');
      });
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
    await startfollow(user.id, postUser._id);
    setIsFollowing(true);
  };

  const handleUnfollow = async () => {
    await unfollow(user.id, postUser._id);
    setIsFollowing(false);
  };

  const loadComments = async () => {
    const data = await getcomment(postUser._id);
    if (data[data.length - 1]?.msg === 'ok') {
      data.pop();
      data.reverse();
      setComments(data);
    }
  };

  const handleComment = async () => {
    if (comment.length <= 0 || comment.length >= 550) {
      alert('Comment must be between 1 and 550 characters');
      return;
    }
    const data = await createcomment(user.name, user.picture, comment, user.id, postUser._id);
    if (data.msg === 'ok') {
      setComment('');
      loadComments();
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    await reportcontent(__id, postUser._id, user.id, postUser.name, user.name, reportReason);
    toast.success('Reported');
  };

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
          <div className={styles.followBtn} onClick={isFollowing ? handleUnfollow : handleFollow}>
            {isFollowing ? 'Following' : '+Follow'}
          </div>
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
                onMouseEnter={() => setShowMenu(true)}
                onMouseLeave={() => setShowMenu(false)}
              />
              {showMenu && (
                <div className={styles.menu} onMouseEnter={() => setShowMenu(true)} onMouseLeave={() => setShowMenu(false)}>
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
                </div>
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
                      <img src={c.image} alt={c.name} />
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
