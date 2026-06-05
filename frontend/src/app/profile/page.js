'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

export default function ProfileRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.username) {
          router.replace(`/profile/${user.username}`);
        } else {
          router.replace(`/profile/${user._id}`);
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <Loader className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
