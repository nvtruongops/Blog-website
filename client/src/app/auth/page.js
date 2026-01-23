'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { TfiEmail } from 'react-icons/tfi';
import { CiLock } from 'react-icons/ci';
import { TiUser } from 'react-icons/ti';
import { IoArrowBack } from 'react-icons/io5';
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
        // Redirect based on user role
        if (data.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
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

  const switchTab = (newState) => {
    setState(newState);
    setError('');
    setSuccess('');
    setShowOtp(false);
  };

  return (
    <div className={styles.container}>
      {/* Decorative Elements */}
      <span className={`${styles.decoration} ${styles.decorationLeft}`}>✦</span>
      <span className={`${styles.decoration} ${styles.decorationRight}`}>✦</span>
      <span className={`${styles.decoration} ${styles.decorationBottom}`}>❋</span>
      <span className={`${styles.decoration} ${styles.decorationBottomRight}`}>✦</span>

      <div className={styles.authWrapper}>
        <div className={styles.img}>
          <img src="/logo.png" alt="auth" />
          <span>{state === 'Log In' ? 'Welcome Back' : 'Join Us'}</span>
        </div>

        {/* Tab Navigation */}
        <div className={styles.loginCont}>
          <div
            className={`${styles.tab} ${state === 'Log In' ? styles.tabActive : ''}`}
            onClick={() => switchTab('Log In')}
          >
            Log In
          </div>
          <div
            className={`${styles.tab} ${state === 'Sign Up' ? styles.tabActive : ''}`}
            onClick={() => switchTab('Sign Up')}
          >
            Sign Up
          </div>
        </div>

        {/* Google Sign In */}
        <div className={styles.socialGoogle} onClick={signUpWithGoogle}>
          <img src="/google-icon.svg" alt="Google" />
          <span>{state === 'Log In' ? 'Tiếp tục với Google' : 'Đăng ký với Google'}</span>
        </div>

        <div className={styles.divider}>OR</div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          {state === 'Sign Up' && (
            <div className={styles.input}>
              <TiUser size={18} />
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={name}
                onChange={handleChange}
              />
            </div>
          )}
          <div className={styles.input}>
            <TfiEmail size={16} />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={email}
              onChange={handleChange}
            />
          </div>
          <div className={styles.input}>
            <CiLock size={18} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handleChange}
            />
          </div>
          {showOtp && state === 'Sign Up' && (
            <div className={styles.input}>
              <input
                type="number"
                name="OTP"
                placeholder="Enter OTP code"
                value={otpv}
                onChange={(e) => setOtpv(e.target.value)}
              />
            </div>
          )}
        </form>

        {/* Messages */}
        {error && <span className={styles.error}>{error}</span>}
        {success && <span className={styles.success}>{success}</span>}

        {/* Terms / Forgot Password */}
        {state === 'Sign Up' ? (
          <div className={styles.dialogue}>
            By signing up, you agree to our <b>Terms of Service</b> and <b>Privacy Policy</b>.
          </div>
        ) : (
          <div className={styles.forget}>
            <Link href="/reset-password">Forgot your password?</Link>
          </div>
        )}

        {/* Submit Button */}
        <div
          className={styles.footer}
          onClick={showOtp && state === 'Sign Up' ? verifyOTP : handleSubmit}
        >
          {showOtp && state === 'Sign Up' 
            ? 'Verify OTP' 
            : state === 'Sign Up' 
              ? 'Create Account' 
              : 'Log In'}
        </div>

        {/* Back to Home */}
        <Link href="/" className={styles.backLink}>
          <IoArrowBack size={14} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
