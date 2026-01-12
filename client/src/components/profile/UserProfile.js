'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { BeatLoader } from 'react-spinners';
import Navbar from '../Navbar';
import Footer from '../Footer';
import PostCard from '../home/PostCard';
import { updatePicture } from '@/store/slices/userSlice';
import {
  getUser, getfollowercount, getfollowingcount, showbookmarks,
  showmyposts, fetchfollowing, changeabout, showLikemarks,
  uploadImages, uploadProfilePicture, dataURItoBlob,
  setPassword, checkHasPassword, changeUserPassword,
} from '@/lib/api';
import styles from './UserProfile.module.css';

export default function UserProfile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const imgRef = useRef();

  const [image, setImage] = useState('');
  const [about, setAbout] = useState('');
  const [editingAbout, setEditingAbout] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbPic, setDbPic] = useState('');
  const [dbAbout, setDbAbout] = useState('');
  const [dbEmail, setDbEmail] = useState('');
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [loadingSection, setLoadingSection] = useState('');
  
  // Password states
  const [hasPassword, setHasPassword] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUser(user.id);
        if (profile?._doc) {
          setDbPic(profile._doc.picture || user?.picture || '');
          setDbAbout(profile._doc.about || '');
          setAbout(profile._doc.about || '');
          setDbEmail(profile._doc.email || '');
        }
        const followerData = await getfollowercount(user.id);
        const followingData = await getfollowingcount(user.id);
        setFollowerCount(followerData?.data?.msg || 0);
        setFollowingCount(followingData?.data?.msg || 0);
        const passwordCheck = await checkHasPassword(user.id);
        setHasPassword(passwordCheck.hasPassword);
        setIsGoogleUser(passwordCheck.isGoogleUser);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    if (user?.id) fetchProfile();
  }, [user]);

  const handlePhotoChange = (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        setImage(event.target.result);
        setError('');
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !editingAbout) return;
    if (about.length > 120) { setError('Tối đa 120 ký tự'); return; }
    setLoading(true);
    try {
      if (image) {
        const path = `${user.name}/profile_image`;
        const img = dataURItoBlob(image);
        const formData = new FormData();
        formData.append('path', path);
        formData.append('file', img);
        const profileImg = await uploadImages(formData, user.token);
        const data = await uploadProfilePicture(profileImg[0].url, about, user.token);
        Cookies.set('user', JSON.stringify({ ...user, picture: profileImg[0].url, about: data.about }));
        dispatch(updatePicture(data));
      } else {
        await changeabout(about, user.id);
      }
      window.location.reload();
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError(''); setPasswordSuccess('');
    if (newPassword.length < 6) { setPasswordError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Mật khẩu không khớp'); return; }
    setPasswordLoading(true);
    try {
      const result = await setPassword(user.id, newPassword, user.token);
      if (result.success) { setPasswordSuccess('Thành công!'); setHasPassword(true); setNewPassword(''); setConfirmPassword(''); }
      else { setPasswordError(result.error || 'Có lỗi'); }
    } catch { setPasswordError('Có lỗi xảy ra'); }
    setPasswordLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError(''); setChangePasswordSuccess('');
    if (!oldPassword) { setChangePasswordError('Nhập mật khẩu hiện tại'); return; }
    if (changeNewPassword.length < 6) { setChangePasswordError('Mật khẩu mới ít nhất 6 ký tự'); return; }
    if (changeNewPassword !== changeConfirmPassword) { setChangePasswordError('Mật khẩu không khớp'); return; }
    setChangePasswordLoading(true);
    try {
      const result = await changeUserPassword(user.id, oldPassword, changeNewPassword, user.token);
      if (result.success) { setChangePasswordSuccess('Thành công!'); setOldPassword(''); setChangeNewPassword(''); setChangeConfirmPassword(''); }
      else { setChangePasswordError(result.error || 'Có lỗi'); }
    } catch { setChangePasswordError('Có lỗi xảy ra'); }
    setChangePasswordLoading(false);
  };

  const handleToggle = async (section) => {
    if (section === 'liked') {
      if (showLiked) { setShowLiked(false); return; }
      setLoadingSection('liked');
      const data = await showLikemarks(user.id);
      setLikedPosts(data.data.msg || []);
      setShowLiked(true);
    } else if (section === 'bookmarks') {
      if (showBookmarks) { setShowBookmarks(false); return; }
      setLoadingSection('bookmarks');
      const data = await showbookmarks(user.id);
      setBookmarks(data.data.msg || []);
      setShowBookmarks(true);
    } else if (section === 'posts') {
      if (showPosts) { setShowPosts(false); return; }
      setLoadingSection('posts');
      const data = await showmyposts(user.id);
      setPosts(data.msg || []);
      setShowPosts(true);
    } else if (section === 'following') {
      if (showFollowing) { setShowFollowing(false); return; }
      setLoadingSection('following');
      const data = await fetchfollowing(user.id);
      setFollowing(data.msg || []);
      setShowFollowing(true);
    }
    setLoadingSection('');
  };

  const handleDeletePost = (postId) => setPosts((prev) => prev.filter((p) => p._id !== postId));
  const currentPic = image || dbPic || user?.picture || '/default-avatar.svg';

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.profile}>
        <div className={styles.photoSection}>
          <div className={styles.preview}>
            <img src={currentPic} alt="Profile" referrerPolicy="no-referrer" onError={(e) => { e.target.src = '/default-avatar.svg'; }} />
          </div>
          <button onClick={() => imgRef.current.click()}>Thay đổi ảnh</button>
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name || 'User'}</div>
          {dbEmail && <div className={styles.userEmail}>{dbEmail}</div>}
        </div>
        <form onSubmit={handleSubmit}>
          <input ref={imgRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
          <div className={styles.aboutSection}>
            <label>Giới thiệu</label>
            {!editingAbout && dbAbout ? (
              <div className={styles.aboutDisplay}>{dbAbout}<span className={styles.editLink} onClick={() => setEditingAbout(true)}>Sửa</span></div>
            ) : (
              <textarea rows="2" value={about} placeholder="Viết vài dòng về bản thân..." onChange={(e) => setAbout(e.target.value)} maxLength={120} />
            )}
          </div>
          {error && <span className={styles.error}>{error}</span>}
          {(image || editingAbout) && <button type="submit" disabled={loading}>{loading ? <BeatLoader size={8} color="#fff" /> : 'Lưu'}</button>}
        </form>
      </div>

      {isGoogleUser && !hasPassword && (
        <div className={styles.passwordSection}>
          <h3>Đặt mật khẩu</h3>
          <form onSubmit={handleSetPassword}>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Xác nhận" />
            {passwordError && <span className={styles.error}>{passwordError}</span>}
            {passwordSuccess && <span className={styles.success}>{passwordSuccess}</span>}
            <button type="submit" disabled={passwordLoading}>{passwordLoading ? <BeatLoader size={8} color="#fff" /> : 'Đặt mật khẩu'}</button>
          </form>
        </div>
      )}

      {hasPassword && (
        <div className={styles.changePasswordSection}>
          <div className={styles.sectionHeader} onClick={() => setShowChangePassword(!showChangePassword)}>
            <span>Đổi mật khẩu</span><span>{showChangePassword ? '▲' : '▼'}</span>
          </div>
          {showChangePassword && (
            <form onSubmit={handleChangePassword} className={styles.changePasswordForm}>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Mật khẩu hiện tại" />
              <input type="password" value={changeNewPassword} onChange={(e) => setChangeNewPassword(e.target.value)} placeholder="Mật khẩu mới" />
              <input type="password" value={changeConfirmPassword} onChange={(e) => setChangeConfirmPassword(e.target.value)} placeholder="Xác nhận" />
              {changePasswordError && <span className={styles.error}>{changePasswordError}</span>}
              {changePasswordSuccess && <span className={styles.success}>{changePasswordSuccess}</span>}
              <button type="submit" disabled={changePasswordLoading}>{changePasswordLoading ? <BeatLoader size={8} color="#fff" /> : 'Đổi'}</button>
            </form>
          )}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.statItem}><span className={styles.statNumber}>{followingCount}</span><span className={styles.statLabel}>Theo dõi</span></div>
        <div className={styles.statItem}><span className={styles.statNumber}>{followerCount}</span><span className={styles.statLabel}>Người theo dõi</span></div>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => handleToggle('liked')}>
            <span>Bài viết đã thích {showLiked && likedPosts.length > 0 && `(${likedPosts.length})`}</span>
            <span>{loadingSection === 'liked' ? <BeatLoader size={6} color="#2d8a4e" /> : (showLiked ? '▲' : '▼')}</span>
          </div>
          {showLiked && (likedPosts.length === 0 ? <p className={styles.emptyText}>Chưa có</p> : <div className={styles.postsGrid}>{likedPosts.map((p, i) => <PostCard post={p} key={p._id || i} compact />)}</div>)}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => handleToggle('bookmarks')}>
            <span>Đã lưu {showBookmarks && bookmarks.length > 0 && `(${bookmarks.length})`}</span>
            <span>{loadingSection === 'bookmarks' ? <BeatLoader size={6} color="#2d8a4e" /> : (showBookmarks ? '▲' : '▼')}</span>
          </div>
          {showBookmarks && (bookmarks.length === 0 ? <p className={styles.emptyText}>Chưa có</p> : <div className={styles.postsGrid}>{bookmarks.map((p, i) => <PostCard post={p} key={p._id || i} compact />)}</div>)}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => handleToggle('posts')}>
            <span>Bài viết của bạn {showPosts && posts.length > 0 && `(${posts.length})`}</span>
            <span>{loadingSection === 'posts' ? <BeatLoader size={6} color="#2d8a4e" /> : (showPosts ? '▲' : '▼')}</span>
          </div>
          {showPosts && (posts.length === 0 ? <p className={styles.emptyText}>Chưa có</p> : <div className={styles.postsGrid}>{posts.map((p, i) => <PostCard post={p} key={p._id || i} type="powner" onDelete={handleDeletePost} compact />)}</div>)}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader} onClick={() => handleToggle('following')}>
            <span>Đang theo dõi {showFollowing && following.length > 0 && `(${following.length})`}</span>
            <span>{loadingSection === 'following' ? <BeatLoader size={6} color="#2d8a4e" /> : (showFollowing ? '▲' : '▼')}</span>
          </div>
          {showFollowing && (following.length === 0 ? <p className={styles.emptyText}>Chưa theo dõi ai</p> : <div className={styles.followingList}>{following.map((f, i) => <div key={i} className={styles.followItem} onClick={() => router.push(`/profile/${f.pid}`)}><img src={f.pic || '/default-avatar.svg'} alt={f.name} onError={(e) => { e.target.src = '/default-avatar.svg'; }} /><span>{f.name}</span></div>)}</div>)}
        </div>
      </div>
      <Footer />
    </div>
  );
}
