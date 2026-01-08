'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Cookies from 'js-cookie';
import Navbar from '@/components/Navbar';
import Breaker from '@/components/home/Breaker';
import Posts from '@/components/home/Posts';
import Footer from '@/components/Footer';
import { login } from '@/store/slices/userSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  
  // Filter states
  const [category, setCategory] = useState('all');
  const [filterBy, setFilterBy] = useState('latest');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userCookie = Cookies.get('user');
    if (!user && userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        dispatch(login(userData));
      } catch (err) {
        console.error('Parse user cookie failed:', err);
      }
    }
  }, [user, dispatch]);

  return (
    <div className="HomePage">
      <Navbar 
        showFilters={true}
        category={category}
        setCategory={setCategory}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div style={{ marginTop: '70px' }}>
        <Breaker text="Featured Post" />
        <Posts 
          category={category} 
          filterBy={filterBy}
          sortBy={sortBy}
          searchQuery={searchQuery}
        />
      </div>
      <Footer />
    </div>
  );
}
