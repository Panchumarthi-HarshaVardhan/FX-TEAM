'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (!user.isEmailVerified) {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
      return;
    }

    // Redirect based on role
    if (user.role === 'admin') {
      router.replace('/dashboard/admin');
    } else if (user.role === 'investor') {
      router.replace('/dashboard/investor');
    } else if (user.role === 'job_seeker') {
      router.replace('/dashboard/job-seeker');
    } else {
      router.replace('/dashboard/founder');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
