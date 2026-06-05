'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/utils/api';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const urlEmail = searchParams.get('email');
  const router = useRouter();
  const { user, token: authToken, refreshUser } = useAuth();
  
  const [status, setStatus] = useState('input'); // input, loading, success, error
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [mounted, setMounted] = useState(false);

  const emailToVerify = urlEmail || user?.email;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user?.isEmailVerified) {
      router.push('/dashboard');
    }
  }, [user, router, mounted]);

  // Don't render anything until client-side mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        if (e.target.previousSibling) {
          e.target.previousSibling.focus();
        }
      } else {
        setOtp([...otp.map((d, idx) => (idx === index ? '' : d))]);
      }
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setMessage('Please enter a 6-digit OTP');
      setStatus('error');
      return;
    }

    if (!emailToVerify) {
      setMessage('Email address missing. Please login again.');
      setStatus('error');
      return;
    }

    try {
      setStatus('loading');
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, otp: otpValue }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        
        // Save new token
        if (data.user?.token) {
          localStorage.setItem('token', data.user.token);
        }
        
        await refreshUser();
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error during verification.');
    }
  };

  const handleResend = async () => {
    try {
      if (!emailToVerify) return;
      setResending(true);
      setMessage('');
      
      const res = await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailToVerify })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('input');
        setMessage('Verification OTP sent! Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error while resending.');
    } finally {
      setResending(false);
    }
  };

  if (!emailToVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Email Missing</h2>
          <p className="text-gray-600 mb-6">We could not determine your email address.</p>
          <button onClick={() => router.push('/auth/login')} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-8">
          We sent a 6-digit OTP to <strong>{emailToVerify}</strong>
        </p>

        {message && status === 'error' && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6 flex items-center justify-center gap-2">
            <XCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {message && status === 'input' && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {status === 'success' ? (
          <div className="py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Verified!</h3>
            <p className="text-gray-500">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={verifyOtp}>
            <div className="flex justify-center gap-2 mb-8">
              {otp.map((data, index) => {
                return (
                  <input
                    className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    type="text"
                    name="otp"
                    maxLength="1"
                    key={index}
                    value={data}
                    onChange={e => handleChange(e.target, index)}
                    onKeyDown={e => handleBackspace(e, index)}
                  />
                );
              })}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {status === 'loading' ? <Loader className="h-5 w-5 animate-spin" /> : 'Verify OTP'}
            </button>
          </form>
        )}

        {status !== 'success' && (
          <div className="mt-8 text-sm text-gray-500">
            Didn&apos;t receive the email?{' '}
            <button 
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
