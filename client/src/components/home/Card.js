'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BsSearch } from 'react-icons/bs';
import styles from './Card.module.css';

const categories = ['all', 'food', 'travelling', 'lifestyle', 'tech'];

export default function Card() {
  const [active, setActive] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={styles.card}>
      {/* Decorative icons */}
      <span className={`${styles.decoration} ${styles.decorationLeft}`}>✦</span>
      <span className={`${styles.decoration} ${styles.decorationRight}`}>✦</span>
      <span className={`${styles.decoration} ${styles.decorationBottom}`}>❋</span>
      
      {/* Hero Title */}
      <div className={styles.hero}>
        <h1>
          Discover Amazing <span>Stories</span>
        </h1>
        <p>
          Explore curated blogs from passionate writers. Share your thoughts and connect with the community.
        </p>
      </div>

      {/* Main Card Frame - Kiểu báo/sách */}
      <div className={styles.mainCard}>
        {/* Search Box */}
        <div className={styles.searchBox}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search blogs, topics, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className={styles.searchBtn}>
            <BsSearch style={{ marginRight: '6px' }} />
            Search
          </button>
        </div>

        {/* Options Row */}
        <div className={styles.options}>
          <div className={styles.optionGroup}>
            <span className={styles.optionLabel}>Filter by:</span>
            <select className={styles.select}>
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>

          <div className={styles.optionGroup}>
            <span className={styles.optionLabel}>Sort:</span>
            <select className={styles.select}>
              <option value="date">Date</option>
              <option value="views">Views</option>
              <option value="likes">Likes</option>
            </select>
          </div>
        </div>

        {/* Categories inside card */}
        <div className={styles.categorySection}>
          <p className={styles.subtitle}>Browse by topics:</p>
          <div className={styles.categories}>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={cat === 'all' ? '/' : `/topic/${cat}`}
                className={`${styles.category} ${active === cat ? styles.active : ''}`}
                onClick={() => setActive(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
