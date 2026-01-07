'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { TfiEmail } from 'react-icons/tfi';
import { CiLock } from 'react-icons/ci';
import { TiUser } from 'react-icons/ti';
import Link from 'next/link';
import { login } from '@/store/slices/userSlice';
import { checkifverify, sendmail, checkotpv } from '@/lib/api';
import styles from './auth.module.css';

export default function AuthPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [state, setState] = useState('Sign Up');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [otpv, setOtpv] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [user, setUser] = useState({ email: '', password: '', name: '' });

  const { email, password, name } = user;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async () => {
    const temail = email.toLowerCase();

    if (state === 'Log In') {
      if (!temail || !password) {
        setError('All fields are required!');
        return;
      }
      const data = await checkifverify(temail);
      if (data.msg === 'ne') {
        setError('Please Sign Up First');
        return;
      }
      if (data.msg !== 'ok') {
        setError('Please Sign up and Verify Your Email');
        return;
      }
      logIn();
    } else {
      if (!name || !temail || !password) {
        setError('All fields are required!');
        return;
      }
      setError('An OTP has been sent to your mail for verification');
      await sendmail(temail, name);
      setShowOtp(true);
    }
  };

  const logIn = async () => {
    try {
      const temail = email.toLowerCase();
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/login`,
        { temail, password }
      );
      setError('');
      setSuccess('Success!');
      setTimeout(() => {
        dispatch(login(data));
        Cookies.set('user', JSON.stringify(data), { expires: 15 });
        router.push('/');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    }
  };

  const signUp = async () => {
    try {
      const temail = email.toLowerCase();
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/register`,
        { name, temail, password }
      );
      setError('');
      setSuccess(data.message);
      const { message, ...rest } = data;
      setTimeout(() => {
        dispatch(login(rest));
        Cookies.set('user', JSON.stringify(rest), { expires: 15 });
        router.push('/');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }
  };

  const verifyOTP = async () => {
    try {
      const temail = email.toLowerCase();
      const data = await checkotpv(temail, otpv);
      if (data.msg === 'ok') {
        setError('OTP Matched');
        signUp();
      } else {
        setError('OTP do not match');
      }
    } catch (error) {
      setError('ERROR OCCURRED!');
    }
  };

  const signUpWithGoogle = () => {
    window.open(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`, '_self');
  };

  return (
    <div className={styles.container}>
      <div className={styles.authWrapper}>
        <div className={styles.img}>
          <img src="/sp.gif" alt="auth" />
          <span>{state}</span>
        </div>
        <div className={styles.loginCont}>
          <div
            className={styles.tab}
            style={{
              borderBottom: state === 'Log In' ? '2px solid black' : '',
              color: state === 'Log In' ? 'black' : '',
            }}
            onClick={() => { setState('Log In'); setError(''); }}
          >
            Log In
          </div>
          <div
            className={styles.tab}
            style={{
              borderBottom: state === 'Sign Up' ? '2px solid black' : '',
              color: state === 'Sign Up' ? 'black' : '',
            }}
            onClick={() => { setState('Sign Up'); setError(''); }}
          >
            Sign Up
          </div>
        </div>

        <div className={styles.socialGoogle} onClick={signUpWithGoogle}>
          <img src="/google.jpg" alt="google" />
          <span>{state === 'Log In' ? 'Sign In with Google' : 'Sign Up with Google'}</span>
        </div>

        <span>OR</span>

        <form>
          {state === 'Sign Up' && (
            <div className={styles.input}>
              <TiUser size={16} />
              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={name}
                onChange={handleChange}
              />
            </div>
          )}
          <div className={styles.input}>
            <TfiEmail size={14} />
            <input
              type="text"
              name="email"
              placeholder="Enter email"
              value={email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.input}>
            <CiLock size={16} />
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={password}
              onChange={handleChange}
            />
          </div>
          {showOtp && state === 'Sign Up' && (
            <div className={styles.input}>
              <input
                type="number"
                name="OTP"
                placeholder="OTP"
                value={otpv}
                onChange={(e) => setOtpv(e.target.value)}
              />
            </div>
          )}
        </form>

        {error && <span className={styles.error}>{error}</span>}
        {success && <span className={styles.success}>{success}</span>}

        {state === 'Sign Up' ? (
          <div className={styles.dialogue}>
            By signing up, you agree to our <b>terms of service</b> and <b>privacy policy</b>.
          </div>
        ) : (
          <div className={styles.forget}>
            <Link href="/reset-password">Don&apos;t remember your password?</Link>
          </div>
        )}

        <div
          className={styles.footer}
          onClick={showOtp && state === 'Sign Up' ? verifyOTP : handleSubmit}
        >
          {showOtp && state === 'Sign Up' ? 'Verify OTP' : state === 'Sign Up' ? 'SIGN UP FOR FREE' : 'LOG IN'}
        </div>
      </div>
    </div>
  );
}
