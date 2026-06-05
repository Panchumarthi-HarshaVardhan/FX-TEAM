'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from './ToastContext';
import { API_URL } from '@/utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      try {
        return savedUser ? JSON.parse(savedUser) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (user && !user.isEmailVerified && user.role !== 'admin' && pathname?.startsWith('/dashboard')) {
      router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, pathname, router]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
  }, [user]);

  const checkUserLoggedIn = useCallback(async (signal) => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${storedToken}`,
          Accept: 'application/json'
        },
        credentials: 'include',
        signal
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          if (data._id && !storedToken && typeof window !== 'undefined') {
            const tokenFromBody = data.token;
            if (tokenFromBody) {
              localStorage.setItem('token', tokenFromBody);
              setToken(tokenFromBody);
            }
          } else if (storedToken) {
            setToken(storedToken);
          }
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          setToken(null);
          setUser(null);
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Auth check failed', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    const controller = new AbortController();
    checkUserLoggedIn(controller.signal);
    return () => controller.abort();
  }, [checkUserLoggedIn]);

  // Login
  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      const data = contentType && contentType.includes('application/json') ? await res.json() : {};

      if (res.ok && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        setToken(data.token);
        setUser(data);
        
        // Redirect to correct dashboard based on role or setup page
        if (!data.isEmailVerified && data.role !== 'admin') {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } else {
          const needsSetup = !data.profileCompleted && !data.isProfileComplete && data.role !== 'admin';
          if (needsSetup) {
            router.push('/profile/setup');
          } else {
            if (data.role === 'admin') {
              router.push('/dashboard/admin');
            } else if (data.role === 'investor') {
              router.push('/dashboard/investor');
            } else if (data.role === 'job_seeker') {
              router.push('/dashboard/job-seeker');
            } else {
              router.push('/dashboard/founder');
            }
          }
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login request failed', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const contentType = res.headers.get('content-type');
      const data = contentType && contentType.includes('application/json') ? await res.json() : {};

      if (res.ok && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        setToken(data.token);
        setUser(data);
        
        // Redirect to correct dashboard based on role or setup page
        if (!data.isEmailVerified && data.role !== 'admin') {
          router.push('/verify-email');
        } else {
          const needsSetup = !data.profileCompleted && !data.isProfileComplete && data.role !== 'admin';
          if (needsSetup) {
            router.push('/profile/setup');
          } else {
            if (data.role === 'admin') {
              router.push('/dashboard/admin');
            } else if (data.role === 'investor') {
              router.push('/dashboard/investor');
            } else if (data.role === 'job_seeker') {
              router.push('/dashboard/job-seeker');
            } else {
              router.push('/dashboard/founder');
            }
          }
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Register request failed', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Google Auth
  const googleLogin = async (googleToken, role) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ token: googleToken, role }),
      });

      const contentType = res.headers.get('content-type');
      const data = contentType && contentType.includes('application/json') ? await res.json() : {};

      if (res.ok && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        setToken(data.token);
        setUser(data);
        
        // Redirect to correct dashboard based on role or setup page
        if (!data.isEmailVerified && data.role !== 'admin') {
          router.push('/verify-email');
        } else {
          const needsSetup = !data.profileCompleted && !data.isProfileComplete && data.role !== 'admin';
          if (needsSetup) {
            router.push('/profile/setup');
          } else {
            if (data.role === 'admin') {
              router.push('/dashboard/admin');
            } else if (data.role === 'investor') {
              router.push('/dashboard/investor');
            } else if (data.role === 'job_seeker') {
              router.push('/dashboard/job-seeker');
            } else {
              router.push('/dashboard/founder');
            }
          }
        }
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Google authentication failed' };
      }
    } catch (error) {
      console.error('Google auth request failed', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout
  const logout = (redirect = true, message = 'Logged out successfully') => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (message) addToast(message, 'success');
    if (redirect) router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, register, googleLogin, loading, refreshUser: checkUserLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
