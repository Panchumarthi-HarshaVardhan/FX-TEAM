'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SigninRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-500 font-semibold">Redirecting to login...</div>
    </div>
  );
}
