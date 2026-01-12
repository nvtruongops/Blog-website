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
          Khám phá những bài viết chất lượng từ cộng đồng. Chia sẻ câu chuyện của bạn ngay hôm nay.
        </p>
      </div>
    </div>
  );
}
