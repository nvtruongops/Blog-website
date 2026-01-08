'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import { BeatLoader, PuffLoader } from 'react-spinners';
import InfiniteScroll from 'react-infinite-scroll-component';
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
  
  // Password states
  const [hasPassword, setHasPassword] = useState(true);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Change password states (for users who already have password)
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
          setDbPic(profile._doc.picture || '');
          setDbAbout(profile._doc.about || '');
          setAbout(profile._doc.about || '');
          setDbEmail(profile._doc.email || '');
        }

        const followerData = await getfollowercount(user.id);
        const followingData = await getfollowingcount(user.id);
        setFollowerCount(followerData?.data?.msg || 0);
        setFollowingCount(followingData?.data?.msg || 0);
        
        // Check if user needs to set password
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
        setDbPic('');
        setError('');
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !about) return;

    if (!image) {
      await changeabout(about, user.id);
      window.location.reload();
      return;
    }

    if (about.length > 120) {
      setError('Maximum 120 characters allowed');
      return;
    }

    setLoading(true);
    try {
      const path = `${user.name}/profile_image`;
      const img = dataURItoBlob(image);
      const formData = new FormData();
      formData.append('path', path);
      formData.append('file', img);

      const profileImg = await uploadImages(formData, user.token);
      const data = await uploadProfilePicture(profileImg[0].url, about, user.token);

      Cookies.set('user', JSON.stringify({ ...user, picture: profileImg[0].url, about: data.about }));
      dispatch(updatePicture(data));
      window.location.reload();
    } catch (error) {
      setLoading(false);
      setError(error.response?.data?.message || 'Error updating profile');
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setPasswordLoading(true);
    try {
      const result = await setPassword(user.id, newPassword, user.token);
      if (result.success) {
        setPasswordSuccess('Đặt mật khẩu thành công! Bạn có thể đăng nhập bằng email/password.');
        setHasPassword(true);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setPasswordError('Có lỗi xảy ra, vui lòng thử lại');
    }
    setPasswordLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    
    if (!oldPassword) {
      setChangePasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    
    if (changeNewPassword.length < 6) {
      setChangePasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    
    if (changeNewPassword !== changeConfirmPassword) {
      setChangePasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setChangePasswordLoading(true);
    try {
      const result = await changeUserPassword(user.id, oldPassword, changeNewPassword, user.token);
      if (result.success) {
        setChangePasswordSuccess('Đổi mật khẩu thành công!');
        setOldPassword('');
        setChangeNewPassword('');
        setChangeConfirmPassword('');
        setTimeout(() => setShowChangePassword(false), 2000);
      } else {
        setChangePasswordError(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      setChangePasswordError('Có lỗi xảy ra, vui lòng thử lại');
    }
    setChangePasswordLoading(false);
  };

  const handleLoadBookmarks = async () => {
    const data = await showbookmarks(user.id);
    setBookmarks(data.data.msg || []);
    setShowBookmarks(true);
  };

  const handleLoadLiked = async () => {
    const data = await showLikemarks(user.id);
    setLikedPosts(data.data.msg || []);
    setShowLiked(true);
  };

  const handleLoadPosts = async () => {
    const data = await showmyposts(user.id);
    setPosts(data.msg || []);
    setShowPosts(true);
  };

  const handleDeletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handleLoadFollowing = async () => {
    const data = await fetchfollowing(user.id);
    setFollowing(data.msg || []);
    setShowFollowing(!showFollowing);
  };

  return (
    <div className={styles.container}>
      <Navbar />
      <div className={styles.profile}>
        <div className={styles.photoSection}>
          <div className={styles.preview}>
            <img src={dbPic || image || '/default-avatar.svg'} alt="Profile" referrerPolicy="no-referrer" />
          </div>
          <button onClick={() => { imgRef.current.click(); setDbPic(''); }}>
            Change or Add an Image
          </button>
        </div>

        {/* User Info Section */}
        <div className={styles.userInfo}>
          {dbEmail && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoValue}>{dbEmail}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <input ref={imgRef} type="file" accept="image/*" onChange={handlePhotoChange} hidden />
          <label>About Me:</label>
          {dbAbout ? (
            <div className={styles.aboutDisplay}>{dbAbout}</div>
          ) : (
            <textarea
              rows="5"
              value={about}
              placeholder="Write something..."
              onChange={(e) => { setAbout(e.target.value); setDbAbout(''); }}
            />
          )}
          {error && <span className={styles.error}>{error}</span>}
          <div className={styles.changeBio} onClick={() => { setDbAbout(''); setAbout(dbAbout); }}>
            Change Bio
          </div>
          <button type="submit" disabled={loading}>
            {loading ? <BeatLoader size={10} /> : 'Save'}
          </button>
        </form>
      </div>

      {/* Password Section for Google Users who haven't set password */}
      {isGoogleUser && !hasPassword && (
        <div className={styles.passwordSection}>
          <h3>Đặt mật khẩu</h3>
          <p className={styles.passwordNote}>
            Bạn đăng nhập bằng Google. Đặt mật khẩu để có thể đăng nhập bằng email/password.
          </p>
          <form onSubmit={handleSetPassword}>
            <div className={styles.inputGroup}>
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Xác nhận mật khẩu:</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
              />
            </div>
            {passwordError && <span className={styles.error}>{passwordError}</span>}
            {passwordSuccess && <span className={styles.success}>{passwordSuccess}</span>}
            <button type="submit" disabled={passwordLoading}>
              {passwordLoading ? <BeatLoader size={10} /> : 'Đặt mật khẩu'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Section for all users who have password */}
      {hasPassword && (
        <div className={styles.changePasswordSection}>
          <div 
            className={styles.changePasswordToggle}
            onClick={() => {
              setShowChangePassword(!showChangePassword);
              setChangePasswordError('');
              setChangePasswordSuccess('');
            }}
          >
            <span>Đổi mật khẩu</span>
            <span className={styles.toggleIcon}>{showChangePassword ? '▲' : '▼'}</span>
          </div>
          
          {showChangePassword && (
            <form onSubmit={handleChangePassword} className={styles.changePasswordForm}>
              <div className={styles.inputGroup}>
                <label>Mật khẩu hiện tại:</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Mật khẩu mới:</label>
                <input
                  type="password"
                  value={changeNewPassword}
                  onChange={(e) => setChangeNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Xác nhận mật khẩu mới:</label>
                <input
                  type="password"
                  value={changeConfirmPassword}
                  onChange={(e) => setChangeConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
              {changePasswordError && <span className={styles.error}>{changePasswordError}</span>}
              {changePasswordSuccess && <span className={styles.success}>{changePasswordSuccess}</span>}
              <button type="submit" disabled={changePasswordLoading}>
                {changePasswordLoading ? <BeatLoader size={10} /> : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className={styles.stats}>
        <div>Following: {followingCount}</div>
        <div>Followers: {followerCount}</div>
      </div>

      <div className={styles.sections}>
        <Section title="Liked Posts" onClick={handleLoadLiked} show={showLiked} items={likedPosts} />
        <Section title="Bookmarks" onClick={handleLoadBookmarks} show={showBookmarks} items={bookmarks} />
        <Section 
          title="Your Posts" 
          onClick={handleLoadPosts} 
          show={showPosts} 
          items={posts} 
          type="powner" 
          onDelete={handleDeletePost}
        />

        <div className={styles.section}>
          <h2 onClick={handleLoadFollowing}>People You Follow:</h2>
          {showFollowing && (
            following.length === 0 ? (
              <p>You are not following anyone</p>
            ) : (
              <div className={styles.followingList}>
                {following.map((f, i) => (
                  <div 
                    key={i} 
                    className={styles.followItem}
                    onClick={() => router.push(`/profile/${f.pid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={f.pic} alt={f.name} />
                    <span>{f.name}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, onClick, show, items, type, onDelete }) {
  return (
    <div className={styles.section}>
      <h2 onClick={onClick}>{title}:</h2>
      {show ? (
        items.length === 0 ? (
          <p>No {title.toLowerCase()}</p>
        ) : (
          <div className={styles.postsGrid}>
            {items.map((post, i) => (
              <PostCard 
                post={post} 
                key={post._id || i} 
                type={type} 
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      ) : (
        <p>Click above to show {title.toLowerCase()}</p>
      )}
    </div>
  );
}
