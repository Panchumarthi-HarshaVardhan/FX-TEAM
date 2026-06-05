'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import PostCard from '../../components/PostCard';
import Link from 'next/link';
import { Bookmark, Building, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [bookmarks, setBookmarks] = useState({ posts: [], startups: [] });
  const [activeTab, setActiveTab] = useState('posts');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchBookmarks();
    }
  }, [user, loading, router]);

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/users/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-white rounded-xl w-1/3 mb-6"></div>
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-white rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Bookmark className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'posts' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" /> Posts ({bookmarks.posts.length})
            </button>
            <button
              onClick={() => setActiveTab('startups')}
              className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'startups' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" /> Startups ({bookmarks.startups.length})
            </button>
          </div>

          <div className="space-y-4">
            {activeTab === 'posts' ? (
              bookmarks.posts.length > 0 ? (
                bookmarks.posts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500">No saved posts yet.</p>
                </div>
              )
            ) : (
              bookmarks.startups.length > 0 ? (
                bookmarks.startups.map(startup => (
                  <Link 
                    href={`/startups/${startup._id}`} 
                    key={startup._id}
                    className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={startup.logo || 'https://via.placeholder.com/60'} 
                        alt={startup.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-100" 
                      />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{startup.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-1">{startup.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                            {startup.industry}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500">No saved startups yet.</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
