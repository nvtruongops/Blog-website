'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { login } from '@/store/slices/userSlice';
import styles from './callback.module.css';

export default function AuthCallback() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Đang xác thực...');
  const [isSuccess, setIsSuccess] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkGoogleAuth = async () => {
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/login/success`,
          {},
          { withCredentials: true }
        );

        if (data.id) {
          dispatch(login(data));
          Cookies.set('user', JSON.stringify(data), { expires: 15 });
          
          setIsSuccess(true);
          setStatus('Đăng nhập thành công!');
          
          // Redirect based on user role
          setTimeout(() => {
            if (data.role === 'admin') {
              router.push('/admin');
            } else {
              router.push('/');
            }
          }, 1500);
        } else {
          setStatus('Đăng nhập thất bại');
          setTimeout(() => router.push('/auth'), 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('Đăng nhập thất bại. Vui lòng thử lại.');
        setTimeout(() => router.push('/auth'), 2000);
      }
    };

    checkGoogleAuth();
  }, [dispatch, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {!isSuccess ? (
          <div className={styles.spinner} />
        ) : (
          <div className={styles.checkmark}>✓</div>
        )}
        <p className={styles.status}>{status}</p>
        {isSuccess && (
          <p className={styles.hint}>
            Bạn có thể vào Profile để đặt mật khẩu đăng nhập bằng email.
          </p>
        )}
      </div>
    </div>
  );
}
