'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/utils/api';

export default function FollowButton({ userId, initialIsFollowing = false, onToggle, className = '' }) {
  const { user, token, setUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      console.error('FollowButton: userId is missing');
      return;
    }

    // Get token - fallback to localStorage if context token is null (hydration edge case)
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!user || !authToken) {
      router.push(`/auth/login?redirect=/profile/${userId}`);
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
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
        // Update user following list in AuthContext
        if (setUser && user) {
          const updatedFollowing = newState
            ? [...(user.following || []), userId]
            : (user.following || []).filter(id => id.toString() !== userId.toString());
          setUser({ ...user, following: updatedFollowing });
        }
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
          Connected
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </>
      )}
    </button>
  );
}
