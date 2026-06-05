'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader, ThumbsUp, MessageCircle, Share2, Bookmark, Building2, Flag, Send, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';
import FollowButton from '../../../components/FollowButton';

export default function VideoPlayerPage() {
  const params = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVideoData();
    }
  }, [params.id]);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      // Fetch current video
      const res = await fetch(`http://localhost:5000/api/posts/${params.id}`, {
        headers: {
          Authorization: localStorage.getItem('token')
            ? `Bearer ${localStorage.getItem('token')}`
            : ''
        }
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response');
      }

      const data = await res.json();
      
      if (data.success) {
        setPost(data.data);
        setReplies(data.data.replies || []);
      } else {
        setError('Video not found');
      }

      // Fetch related videos (mocked by fetching latest videos for now)
      const relatedRes = await fetch('http://localhost:5000/api/posts?type=video&limit=10');
      const relatedContentType = relatedRes.headers.get('content-type');
      if (relatedContentType && relatedContentType.includes('application/json')) {
        const relatedData = await relatedRes.json();
        if (relatedData.success) {
          setRelatedVideos(relatedData.data.filter(p => p._id !== params.id));
        }
      }

    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsSubmittingReply(false);
        return;
      }

      const res = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent,
          parentPostId: params.id,
          type: 'text'
        })
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setReplyContent('');
          fetchVideoData();
        }
      }
    } catch (err) {
      console.error('Failed to post reply', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLike = async () => {
    if (!post || isLiking) return;
    setIsLiking(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLiking(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setPost(prev => {
            if (!prev) return prev;
            const currentlyLiked = prev.isLikedBy;
            return {
              ...prev,
              likes: data.data.likes,
              isLikedBy: !currentlyLiked,
              likeCount:
                data.data.likeCount != null
                  ? data.data.likeCount
                  : (prev.likes?.length || 0) + (currentlyLiked ? -1 : 1)
            };
          });
        }
      }
    } catch (err) {
      console.error('Error liking post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!post || isSaving) return;
    setIsSaving(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsSaving(false);
        return;
      }

      const res = await fetch(`http://localhost:5000/api/posts/${post._id}/save`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setPost(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              isSavedBy: data.data.isSavedBy,
              saveCount: data.data.saveCount
            };
          });
        }
      }
    } catch (err) {
      console.error('Error saving post', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader className="animate-spin h-8 w-8 text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
            <h2 className="text-xl font-bold text-gray-900">{error || 'Video not found'}</h2>
            <Link href="/watch" className="text-red-600 hover:underline mt-4 inline-block">Back to Watch</Link>
        </div>
      </div>
    );
  }

  const authorName = post.startupId?.name || post.authorId?.name || 'Unknown';
  const authorImage = post.startupId?.logo || post.authorId?.profileImage;
  const isStartup = !!post.startupId;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-4">
                    {post.mediaUrl ? (
                        <video 
                            src={post.mediaUrl} 
                            controls 
                            autoPlay 
                            className="w-full h-full"
                            poster={post.thumbnailUrl}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                            Video unavailable
                        </div>
                    )}
                </div>

                {/* Video Info */}
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{post.content}</h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                        <div className="flex items-center gap-4">
                            <Link href={isStartup ? `/startup/${post.startupId._id}` : (user && (user._id === post.authorId?._id || user.username === post.authorId?.username) ? `/profile` : `/profile/${post.authorId?.username || post.authorId?._id}`)} className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden">
                                    {authorImage ? (
                                        <img src={authorImage} alt={authorName} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                                            {authorName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </Link>
                            <div>
                            <Link href={isStartup ? `/startups/${post.startupId._id}` : (user && (user._id === post.authorId?._id || user.username === post.authorId?.username) ? `/profile` : `/profile/${post.authorId?.username || post.authorId?._id}`)} className="font-bold text-gray-900 hover:text-red-600 transition block">
                                    {authorName}
                                </Link>
                                <span className="text-sm text-gray-500">
                                    {post.authorId?.role === 'founder' ? 'Founder' : 'Member'}
                                </span>
                            </div>
                            {post.authorId?._id && (
                              <div className="ml-2">
                                <FollowButton 
                                  userId={post.authorId._id}
                                  initialIsFollowing={post.authorId.followers?.includes(user?._id)}
                                  className="px-4 py-2 text-xs"
                                />
                              </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                              onClick={handleLike}
                              disabled={isLiking}
                              className={`flex items-center space-x-1 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition ${
                                post.isLikedBy ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''
                              }`}
                            >
                                <ThumbsUp className={`h-5 w-5 ${post.isLikedBy ? 'fill-current' : ''}`} />
                                <span className="font-medium">{post.likeCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
                                <Share2 className="h-5 w-5" />
                                <span className="font-medium">Share</span>
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition ${
                                post.isSavedBy ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : ''
                              }`}
                              title={post.isSavedBy ? 'Saved to watch later' : 'Save to watch later'}
                            >
                                <Bookmark className={`h-5 w-5 ${post.isSavedBy ? 'fill-current' : ''}`} />
                            </button>
                            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition" title="Report">
                              <Flag className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                            <span>{post.metrics?.views || 0} views</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {post.content}
                        </p>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-gray-500" />
                        Comments
                      </h3>

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
                              placeholder="Add a comment..."
                              className="w-full border-none focus:ring-0 resize-none text-sm md:text-base p-2 min-h-[72px]"
                            />
                            <div className="flex justify-end pt-2 border-t border-gray-50">
                              <button
                                onClick={handleReply}
                                disabled={!replyContent.trim() || isSubmittingReply}
                                className="px-4 py-2 bg-red-600 text-white rounded-full text-xs md:text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Comment
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {replies.length > 0 ? (
                          replies.map(reply => (
                            <div key={reply._id} className="pl-4 border-l-2 border-gray-100">
                              <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                    {reply.authorId?.profileImage ? (
                                      <img src={reply.authorId.profileImage} alt={reply.authorId.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                        {reply.authorId?.name?.charAt(0) || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                                      <span className="truncate max-w-[140px]">
                                        {reply.authorId?.name || 'User'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-500">
                                      {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                            No comments yet. Be the first to share your thoughts.
                          </div>
                        )}
                      </div>
                    </div>
                </div>
            </div>

            {/* Sidebar / Recommended */}
            <div className="lg:col-span-1">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Up Next</h3>
                <div className="space-y-4">
                    {relatedVideos.map(video => (
                        <Link key={video._id} href={`/watch/${video._id}`} className="flex gap-2 group">
                            <div className="relative w-40 aspect-video bg-gray-900 rounded-lg overflow-hidden flex-shrink-0">
                                {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : video.mediaUrl ? (
                                    <video src={video.mediaUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Play className="h-6 w-6 text-white opacity-50" />
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 py-0.5 rounded">
                                    {video.videoLength ? `${Math.floor(video.videoLength/60)}:${String(video.videoLength%60).padStart(2, '0')}` : '00:00'}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-red-600 transition">
                                    {video.content}
                                </h4>
                                <div className="text-xs text-gray-500">
                                    <div className="mb-0.5">{video.startupId?.name || video.authorId?.name}</div>
                                    <div>
                                        {formatDistanceToNow(new Date(video.createdAt))} ago
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
