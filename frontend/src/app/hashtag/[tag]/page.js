'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import PostCard from '../../../components/PostCard';
import { Hash, ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function HashtagPage() {
  const params = useParams();
  const { tag } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tag) {
      fetchPosts();
    }
  }, [tag, user]); // Re-fetch when user changes to update like status

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Allow public access to hashtags
      const res = await fetch(`http://localhost:3000/api/posts/hashtag/${tag}`, {
        headers
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setPosts(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching hashtag posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <Hash className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
                <p className="text-gray-500">{posts.length} posts</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-white rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-gray-500">No posts found with #{tag}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
