'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { BsSearch, BsPencilSquare } from 'react-icons/bs';
import { logout } from '@/store/slices/userSlice';
import { clearCookie, searchresult } from '@/lib/api';
import styles from './Navbar.module.css';

export default function Navbar({ postpage }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);
  const [showSearch, setShowSearch] = useState(false);
  const [searchContent, setSearchContent] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const navigateToHome = () => router.push('/');

  const onSearchChange = async () => {
    if (searchContent === '') return;
    const data = await searchresult(searchContent);
    if (data.msg) setSearchResults(data.msg);
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

      <div className={styles.logo} onClick={navigateToHome}>
        <img src="/logo.png" alt="HOME" />
        <span>All Blogs</span>
      </div>

      <div className={styles.search}>
        <div className={styles.searchWrap}>
          <input
            className={styles.input}
            onClick={() => setShowSearch(true)}
            onChange={(e) => { setSearchContent(e.target.value); setShowSearch(true); onSearchChange(); }}
            type="text"
            value={searchContent}
            placeholder="Search..."
          />
          {showSearch && searchResults.length > 0 && (
            <div className={styles.searchResult}>
              <ul className={styles.searchList}>
                {searchResults.map((i, idx) => (
                  <li key={idx} className={styles.listItem}>
                    <img className={styles.searchImg} src={i.pic} alt="" />
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
              <img src={user.picture} alt="" referrerPolicy="no-referrer" />
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
