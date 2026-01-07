'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import axios from 'axios';
import { login } from '@/store/slices/userSlice';

export default function AuthCallback() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('Đang xác thực...');
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
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
          
          // Check if this is first Google login with temp credentials
          if (data.isFirstGoogleLogin && data.tempPassword) {
            setCredentials({
              email: data.email,
              password: data.tempPassword
            });
            setStatus('Đăng nhập thành công! Vui lòng lưu thông tin đăng nhập bên dưới.');
          } else {
            setStatus('Đăng nhập thành công! Đang chuyển hướng...');
            setTimeout(() => router.push('/'), 1000);
          }
        } else {
          setStatus('Đăng nhập thất bại');
          setTimeout(() => router.push('/auth'), 2000);
        }
      } catch (error) {
        setStatus('Đăng nhập thất bại. Vui lòng thử lại.');
        setTimeout(() => router.push('/auth'), 2000);
      }
    };

    checkGoogleAuth();
  }, [dispatch, router]);

  const handleContinue = () => {
    router.push('/');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px'
    }}>
      {!credentials && (
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      <p style={{ fontSize: '18px', color: '#333', textAlign: 'center' }}>{status}</p>
      
      {credentials && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#212529' }}>
            Thông tin đăng nhập của bạn
          </h3>
          <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
            Lưu lại thông tin này để đăng nhập bằng email/password lần sau (hoặc vào Profile để đặt mật khẩu mới):
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>Email:</label>
            <div style={{ 
              background: '#fff', 
              padding: '8px 12px', 
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontFamily: 'monospace'
            }}>
              {credentials.email}
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#6c757d', display: 'block' }}>Mật khẩu tạm:</label>
            <div style={{ 
              background: '#fff', 
              padding: '8px 12px', 
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontFamily: 'monospace'
            }}>
              {credentials.password}
            </div>
          </div>
          
          <p style={{ fontSize: '12px', color: '#dc3545', marginBottom: '16px' }}>
            ⚠️ Thông tin này chỉ hiển thị một lần. Bạn có thể vào Profile để đặt mật khẩu mới.
          </p>
          
          <button 
            onClick={handleContinue}
            style={{
              width: '100%',
              padding: '12px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Đã lưu, tiếp tục
          </button>
        </div>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
