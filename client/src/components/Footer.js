import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.info}>
        <p>&copy; 2021-2025 @ Made By <a href="https://github.com/nvtruongops" target="_blank" rel="noopener noreferrer">nvtruongops</a></p>
        <p>For any issue kindly send mail to <a href="mailto:nvtruongops@gmail.com">nvtruongops@gmail.com</a></p>
      </div>
    </footer>
  );
}
