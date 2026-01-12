'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BsSearch, BsPencilSquare, BsX } from 'react-icons/bs';
import { logout } from '@/store/slices/userSlice';
import { clearCookie } from '@/lib/api';
import styles from './Navbar.module.css';

const categories = ['all', 'food', 'travelling', 'lifestyle', 'tech'];

export default function Navbar({ 
  postpage, 
  showFilters = false,
  category,
  setCategory,
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const navigateToHome = () => router.push('/');

  const handlePostSearch = () => {
    if (setSearchQuery) {
      setSearchQuery(localSearch);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (setSearchQuery) setSearchQuery('');
  };

  const logoutFunction = async (e) => {
    e.preventDefault();
    try {
      await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logout`, { withCredentials: true });
      Cookies.set('user', '');
      Cookies.remove('sessionId');
      clearCookie('sessionId');
      dispatch(logout());
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.leftSection}>
          <div className={styles.logo} onClick={navigateToHome}>
            <img src="/logo.png" alt="HOME" />
            <span>All Blogs</span>
          </div>
        </div>

        {/* Search bar */}
        <div className={styles.search}>
          <div className={styles.searchWrap}>
            <div className={styles.searchIcon}>
              <BsSearch size={16} />
            </div>
            <input
              className={styles.input}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePostSearch()}
              type="text"
              value={localSearch}
              placeholder="Tìm kiếm bài viết..."
            />
            {localSearch && (
              <button 
                className={styles.clearSearch} 
                onClick={handleClearSearch}
                type="button"
              >
                <BsX size={18} />
              </button>
            )}
          </div>
          {showFilters && (
            <button className={styles.searchButton} onClick={handlePostSearch}>
              Tìm
            </button>
          )}
        </div>

        {user ? (
          <div className={styles.links}>
            <Link
              className={styles.write}
              href="/write"
              style={{ visibility: postpage ? 'hidden' : 'visible' }}
            >
              <BsPencilSquare style={{ marginBottom: '-2px' }} />
              <span>Viết bài</span>
            </Link>
            <Link className={styles.userLink} href="/profile">
              <div className={styles.userImage}>
                <img src={user.picture || '/default-avatar.svg'} alt="" referrerPolicy="no-referrer" />
              </div>
            </Link>
            <Link href="" className={styles.logout} onClick={logoutFunction}>
              Đăng xuất
            </Link>
          </div>
        ) : (
          <div className={styles.links}>
            <Link className={styles.addButton} href="/auth">
              <BsPencilSquare style={{ marginBottom: '-2px' }} />
              <span>Viết bài</span>
            </Link>
            <Link href="/auth" className={styles.logout}>
              Đăng nhập
            </Link>
          </div>
        )}
      </nav>

      {/* Filter Bar - hiển thị ngay dưới navbar */}
      {showFilters && (
        <div className={styles.filterBar}>
          <div className={styles.filterBarContent}>
            {/* Categories */}
            <div className={styles.categoryTabs}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryTab} ${category === cat ? styles.active : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat === 'all' ? 'Tất cả' :
                   cat === 'food' ? 'Ẩm thực' : 
                   cat === 'travelling' ? 'Du lịch' : 
                   cat === 'lifestyle' ? 'Lifestyle' : 
                   'Công nghệ'}
                </button>
              ))}
            </div>

            {/* Filter & Sort */}
            <div className={styles.filterSort}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Lọc:</span>
                {['latest', 'popular', 'trending'].map((f) => (
                  <button
                    key={f}
                    className={`${styles.filterBtn} ${filterBy === f ? styles.active : ''}`}
                    onClick={() => setFilterBy(f)}
                  >
                    {f === 'latest' ? 'Mới nhất' : f === 'popular' ? 'Phổ biến' : 'Xu hướng'}
                  </button>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Sắp xếp:</span>
                {['date', 'views', 'likes'].map((s) => (
                  <button
                    key={s}
                    className={`${styles.filterBtn} ${sortBy === s ? styles.active : ''}`}
                    onClick={() => setSortBy(s)}
                  >
                    {s === 'date' ? 'Ngày' : s === 'views' ? 'Lượt xem' : 'Lượt thích'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
