'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './reset.module.css';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [foundSend, setFoundSend] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSearchClick = async () => {
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/findOutUser`,
        { email }
      );
      setFoundUser(data[0]);
    } catch (error) {
      alert(error.response?.data?.message || 'User not found');
    }
  };

  const sendCode = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sendResetPasswordCode`,
        { email: foundUser.email }
      );
      setFoundSend(true);
    } catch (error) {
      console.error(error.message);
    }
  };

  const validate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/validateResetCode`,
        { email: foundUser.email, code }
      );
      if (data.message === 'ok') {
        setFoundSend(false);
        setOpen(true);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pass.length <= 8) {
      alert('PASSWORD LENGTH SHOULD BE MORE THAN 8');
      return;
    }
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/changePassword`,
        { email: foundUser.email, password: pass }
      );
      if (data.message === 'ok') {
        alert('Password Changed');
        setTimeout(() => router.push('/'), 2000);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <label htmlFor="email-input">Email address:</label>
      <input
        type="email"
        id="email-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <button onClick={handleSearchClick} className={styles.button}>
        Search
      </button>

      {foundUser ? (
        <div className={styles.results}>
          <p>Name: {foundUser.name}</p>
          <p>Email: {foundUser.email}</p>
          <img className={styles.img} src={foundUser.picture} alt="" />
          <button onClick={sendCode} className={styles.button}>Send Code</button>
        </div>
      ) : (
        <p className={styles.noResults}>No user found with that email address.</p>
      )}

      {foundSend && (
        <form>
          <label>Code Has been Sent to your email</label>
          <input
            type="text"
            value={code}
            placeholder="CODE"
            onChange={(e) => setCode(e.target.value)}
            className={styles.input}
          />
          <button onClick={validate} className={styles.button}>Verify</button>
        </form>
      )}

      {open && (
        <form>
          <label>Enter Your new Password</label>
          <input
            type="password"
            value={pass}
            placeholder="NEW PASSWORD"
            onChange={(e) => setPass(e.target.value)}
            className={styles.input}
          />
          <button onClick={changePassword} className={styles.button}>Confirm</button>
        </form>
      )}
    </div>
  );
}
