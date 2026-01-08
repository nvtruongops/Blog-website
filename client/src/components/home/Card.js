'use client';

import styles from './Card.module.css';

export default function Card() {
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
        <p className={styles.hint}>
          Click the <strong>☰</strong> menu to filter and search posts
        </p>
      </div>
    </div>
  );
}
