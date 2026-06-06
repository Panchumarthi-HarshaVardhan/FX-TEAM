'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function TrendingSidebar() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await fetch(`${API_URL}/api/posts/trending`);
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success) {
            setTrends(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching trends', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 w-full sticky top-24">
        <div className="h-6 w-32 bg-gray-100 rounded mb-4 animate-pulse"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="mb-4 last:mb-0">
            <div className="h-4 w-24 bg-gray-50 rounded mb-1 animate-pulse"></div>
            <div className="h-3 w-12 bg-gray-50 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4 w-full sticky top-24">
        <h3 className="font-bold text-heading text-lg mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Trending
        </h3>
        <p className="text-sm text-gray-500">No trending topics yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 w-full sticky top-24">
      <h3 className="font-bold text-heading text-lg mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2 text-primary" />
        Trending
      </h3>
      
      <div className="space-y-4">
        {trends.map((trend) => (
          <div key={trend._id} className="relative group">
            <div className="text-xs text-gray-500 mb-0.5">Trending</div>
            <Link 
              href={`/hashtag/${trend._id}`}
              className="font-bold text-heading hover:text-primary transition block"
            >
              #{trend._id}
            </Link>
            <div className="text-xs text-gray-500">{trend.count} posts</div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <Link href="/explore" className="text-primary text-sm font-medium hover:underline">
          Show more
        </Link>
      </div>
    </div>
  );
}
