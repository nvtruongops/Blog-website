import styles from './Breaker.module.css';

export default function Breaker({ text }) {
  return (
    <div className={styles.breaker}>
      <h2>{text}</h2>
    </div>
  );
}
