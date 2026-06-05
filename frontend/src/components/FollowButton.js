'use client';

import { useState } from 'react';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

export default function FollowButton({ userId, initialIsFollowing = false, onToggle, className = '' }) {
  const { user, token } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      console.error('FollowButton: userId is missing');
      return;
    }

    // Check authentication
    if (!user || !token) {
      // Optional: Add toast here "Please login to follow"
      router.push(`/auth/login?redirect=/profile/${userId}`); // Improved redirect
      return;
    }

    if (userId === user._id) return; // Cannot follow self

    if (loading) return;

    setLoading(true);
    
    // Optimistic update
    const previousState = isFollowing;
    const newState = !previousState;
    setIsFollowing(newState);

    try {
      const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      } else {
        if (onToggle) onToggle(newState);
      }
    } catch (error) {
      console.error('Follow error:', error.message || error);
      setIsFollowing(previousState);
    } finally {
      setLoading(false);
    }
  };

  if (user && user._id === userId) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-white text-gray-900 border border-gray-300 shadow-sm hover:bg-gray-50 hover:border-gray-400'
          : 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </button>
  );
}
