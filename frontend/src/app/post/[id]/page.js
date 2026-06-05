'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import PostCard from '../../../components/PostCard';
import { Loader, ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${id}`, {
        headers: {
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        },
        credentials: 'include'
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Received non-JSON response");
      }

      const data = await res.json();
      if (data.success) {
        setPost(data.data);
        setReplies(data.data.replies || []); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent,
          parentPostId: id,
          type: 'text'
        })
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setReplyContent('');
          fetchPost();
        }
      } else if (res.ok) {
        setReplyContent('');
        fetchPost();
      } else {
        throw new Error("Received non-JSON response");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-24 px-4 pb-20">
        <Link href="/" className="flex items-center text-gray-500 hover:text-primary mb-4 transition">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : !post ? (
          <div className="text-center py-10 text-gray-500">Post not found</div>
        ) : (
          <div>
            {/* Main Post */}
            <PostCard post={post} />
            
            {/* Reply Input */}
            {user && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm flex items-start space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                      {user.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Post your reply"
                    className="w-full border-none focus:ring-0 resize-none text-lg p-2 min-h-[80px]"
                  />
                  <div className="flex justify-end pt-2 border-t border-gray-50">
                    <button 
                      onClick={handleReply}
                      disabled={!replyContent.trim() || isSubmitting}
                      className="px-4 py-2 bg-primary text-white rounded-full font-bold text-sm hover:bg-blue-600 transition disabled:opacity-50 flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Thread Line / Replies Section */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-heading mb-4">Replies</h3>
              <div className="space-y-4">
                {replies.length > 0 ? (
                  replies.map(reply => (
                    <div key={reply._id} className="pl-4 border-l-2 border-gray-100">
                      <PostCard post={reply} />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    No replies yet. Be the first to reply!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
