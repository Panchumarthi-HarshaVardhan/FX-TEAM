'use client';
import { API_URL } from '@/utils/api';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import { Loader } from 'lucide-react';

export default function UsernameRedirect() {
  const { username } = useParams();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const resolveUsername = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/handle/${username}`);
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Received non-JSON response");
        }

        const data = await res.json();

        if (data.success) {
          router.replace(`/profile/${data.data.username}`);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error(err);
        setError('Error resolving username');
      }
    };

    if (username) {
      resolveUsername();
    }
  }, [username, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="pt-24 flex justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h1>
                <p className="text-gray-500">The user @{username} does not exist.</p>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="pt-24 flex justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}
