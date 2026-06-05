'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { user, loading, login, googleLogin } = useAuth();
  const router = useRouter();

  const handleGoogleSuccess = async (tokenResponse) => {
    setIsGoogleLoading(true);
    setError('');
    const res = await googleLogin(tokenResponse.access_token);
    if (!res.success) {
      setError(res.error);
      setIsGoogleLoading(false);
    }
  };

  const gLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError('Google login failed. Please try again.')
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-section px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-heading">Welcome Back</h1>
          <p className="text-body mt-2">Sign in to continue to FounderX</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-heading mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition transform hover:-translate-y-0.5 shadow-md"
          >
            Sign In
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={() => gLogin()}
          disabled={isGoogleLoading}
          className="w-full bg-white text-gray-700 font-bold py-3 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div className="mt-6 text-center text-sm text-body">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-primary font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
