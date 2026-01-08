'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BsSearch, BsPencilSquare, BsList, BsX } from 'react-icons/bs';
import { logout } from '@/store/slices/userSlice';
import { clearCookie, searchresult } from '@/lib/api';
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
  const [showSearch, setShowSearch] = useState(false);
  const [searchContent, setSearchContent] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const navigateToHome = () => router.push('/');

  const onSearchChange = async () => {
    if (searchContent === '') return;
    const data = await searchresult(searchContent);
    if (data.msg) setSearchResults(data.msg);
  };

  const handlePostSearch = () => {
    if (setSearchQuery) {
      setSearchQuery(localSearch);
    }
    setMenuOpen(false);
  };

  const handleCategoryClick = (cat) => {
    if (setCategory) {
      setCategory(cat);
    }
    setMenuOpen(false);
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
    <nav className={styles.navbar}>
      {showSearch && <div className={styles.overlay} onClick={() => setShowSearch(false)} />}
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

      <div className={styles.leftSection}>
        {/* Hamburger Menu - only show on homepage with filters */}
        {showFilters && (
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <BsX size={24} /> : <BsList size={24} />}
          </button>
        )}

        <div className={styles.logo} onClick={navigateToHome}>
          <img src="/logo.png" alt="HOME" />
          <span>All Blogs</span>
        </div>
      </div>

      {/* Filter Menu Dropdown */}
      {showFilters && menuOpen && (
        <div className={styles.filterMenu}>
          <div className={styles.filterSection}>
            <h4>Search Posts</h4>
            <div className={styles.filterSearchBox}>
              <input
                type="text"
                placeholder="Search blogs..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePostSearch()}
              />
              <button onClick={handlePostSearch}>
                <BsSearch />
              </button>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Categories</h4>
            <div className={styles.categoryList}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${category === cat ? styles.active : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h4>Filter & Sort</h4>
            <div className={styles.filterOptions}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Filter:</span>
                <div className={styles.filterButtons}>
                  {['latest', 'popular', 'trending'].map((f) => (
                    <button
                      key={f}
                      className={`${styles.filterBtn} ${filterBy === f ? styles.active : ''}`}
                      onClick={() => setFilterBy(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Sort:</span>
                <div className={styles.filterButtons}>
                  {['date', 'views', 'likes'].map((s) => (
                    <button
                      key={s}
                      className={`${styles.filterBtn} ${sortBy === s ? styles.active : ''}`}
                      onClick={() => setSortBy(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.search}>
        <div className={styles.searchWrap}>
          <input
            className={styles.input}
            onClick={() => setShowSearch(true)}
            onChange={(e) => { setSearchContent(e.target.value); setShowSearch(true); onSearchChange(); }}
            type="text"
            value={searchContent}
            placeholder="Search users..."
          />
          {showSearch && searchResults.length > 0 && (
            <div className={styles.searchResult}>
              <ul className={styles.searchList}>
                {searchResults.map((i, idx) => (
                  <li key={idx} className={styles.listItem}>
                    <img className={styles.searchImg} src={i.pic || '/default-avatar.svg'} alt="" />
                    <Link href={user ? `/profile/${i.id}` : '/auth'}>
                      <p>{i.name}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={styles.searchIcon} onClick={() => { setShowSearch(true); onSearchChange(); }}>
          <BsSearch size={20} />
        </div>
      </div>

      {user ? (
        <div className={styles.links}>
          <Link
            className={styles.write}
            href="/write"
            style={{ visibility: postpage ? 'hidden' : 'visible' }}
          >
            <BsPencilSquare style={{ marginBottom: '-2px' }} />
            <span>Add</span>
          </Link>
          <Link className={styles.userLink} href="/profile">
            <div className={styles.userImage}>
              <img src={user.picture || '/default-avatar.svg'} alt="" referrerPolicy="no-referrer" />
            </div>
          </Link>
          <Link href="" className={styles.logout} onClick={logoutFunction}>
            Log Out
          </Link>
        </div>
      ) : (
        <div className={styles.links}>
          <Link className={styles.addButton} href="/auth">
            <BsPencilSquare style={{ marginBottom: '-2px' }} />
            <span>Add</span>
          </Link>
          <Link href="/auth" className={styles.logout}>
            SignUp | LogIn
          </Link>
        </div>
      )}
    </nav>
  );
}
