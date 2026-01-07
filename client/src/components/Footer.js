import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3>Products</h3>
          <ul>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Customer</a></li>
            <li><a href="#">Docs</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Request a Demo</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <h3>About Us</h3>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Our Team</a></li>
            <li><a href="#">Our Mission</a></li>
            <li><a href="#">Our Vision</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <h3>Resources</h3>
          <ul>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Whitepapers</a></li>
            <li><a href="#">Webinars</a></li>
            <li><a href="#">Case Studies</a></li>
            <li><a href="#">FAQs</a></li>
          </ul>
        </div>
        <div className={styles.column}>
          <h3>Connect With Us</h3>
          <ul>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">LinkedIn</a></li>
            <li><a href="#">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className={styles.info}>
        <p>&copy; 2021-2025 @ Made By <a href="#">[author]</a></p>
        <p>For any issue kindly send mail to <a href="mailto:contact@example.com">contact@example.com</a></p>
      </div>
    </footer>
  );
}
