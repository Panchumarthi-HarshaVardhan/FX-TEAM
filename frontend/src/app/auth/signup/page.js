'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Briefcase, Users, User, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'founder' // Default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const { user, loading, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    const res = await register(payload);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-section px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-heading">Join FounderX</h1>
          <p className="text-body mt-2">Choose your role to get started</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-3 gap-2.5 mb-8">
          <button
            type="button"
            onClick={() => handleRoleSelect('job_seeker')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
              formData.role === 'job_seeker'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-650'
                : 'border-gray-100 hover:border-indigo-100 text-body'
            }`}
          >
            <User className="h-6 w-6 mb-2" />
            <span className="text-[11px] font-bold">Job Seeker</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('founder')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
              formData.role === 'founder'
                ? 'border-primary bg-blue-50 text-primary'
                : 'border-gray-100 hover:border-blue-100 text-body'
            }`}
          >
            <Briefcase className="h-6 w-6 mb-2" />
            <span className="text-[11px] font-bold">Founder</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleRoleSelect('investor')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
              formData.role === 'investor'
                ? 'border-secondary bg-green-50 text-secondary'
                : 'border-gray-100 hover:border-green-100 text-body'
            }`}
          >
            <Users className="h-6 w-6 mb-2" />
            <span className="text-[11px] font-bold">Investor</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-heading mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
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

          <div>
            <label className="block text-sm font-medium text-heading mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-heading text-white font-bold py-3 rounded-xl hover:bg-black transition transform hover:-translate-y-0.5 shadow-md"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-body">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
