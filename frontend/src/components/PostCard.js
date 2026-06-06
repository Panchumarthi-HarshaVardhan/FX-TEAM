'use client';
import { API_URL } from '@/utils/api';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pin, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function PostCard({ post: initialPost, darkTheme = false, refreshUser }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [isReposting, setIsReposting] = useState(false);
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [quoteBody, setQuoteBody] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInvestorMenu, setShowInvestorMenu] = useState(false);

  // Theme classes
  const cardBg = darkTheme ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const textColor = darkTheme ? 'text-gray-100' : 'text-heading';
  const subTextColor = darkTheme ? 'text-gray-400' : 'text-gray-500';
  const bodyTextColor = darkTheme ? 'text-gray-300' : 'text-body';
  const iconColor = darkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600';

  const formatContent = (content) => {
    if (!content) return null;
    if (typeof content !== 'string') return String(content);
    
    const parts = content.split(/((?:#|@)\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <Link key={i} href={`/hashtag/${part.slice(1)}`} className="text-primary hover:underline">
            {part}
          </Link>
        );
      }
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <Link key={i} href={`/u/${username}`} className="text-primary font-medium hover:underline">
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return; 

      const res = await fetch(`${API_URL}/api/posts/${post._id}/like`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setPost(prev => ({
            ...prev,
            likes: data.data.likes, // Assuming backend returns updated likes array or we just toggle locally
            isLikedBy: !prev.isLikedBy, // This needs to be handled if backend doesn't return boolean
            likeCount: data.data.likeCount || (prev.likes?.length || 0) + (prev.isLikedBy ? -1 : 1)
          }));
        }
      }
    } catch (err) {
      console.error('Error liking post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async (withQuote = false) => {
    if (isReposting) return;
    setIsReposting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const body = {
        repostOf: post._id,
        quoteBody: withQuote ? quoteBody : undefined
      };

      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(body)
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setPost(prev => ({
            ...prev,
            repostCount: (prev.repostCount || 0) + 1
          }));
          setShowQuoteInput(false);
          setQuoteBody('');
        }
      }
    } catch (err) {
      console.error('Error reposting', err);
    } finally {
      setIsReposting(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_URL}/api/posts/${post._id}/save`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setPost(prev => ({ 
            ...prev, 
            isSavedBy: data.data.isSavedBy, 
            saveCount: data.data.saveCount 
          }));
          // Refresh user to update savedPosts list in context if needed
          if (refreshUser) refreshUser();
        }
      }
    } catch (err) {
      console.error('Error saving post', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${API_URL}/api/users/pin/${post._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          if (refreshUser) refreshUser();
          setShowMenu(false);
        }
      }
    } catch (err) {
      console.error('Error pinning post', err);
    }
  };

  const handleInvestorReact = async (type) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(`${API_URL}/api/posts/${post._id}/react`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ type })
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setShowInvestorMenu(false);
          // Optional: Show success toast or update UI to show reaction
          // For now, just close menu
        }
      }
    } catch (err) {
      console.error('Error reacting to post', err);
    }
  };

  const authorName = (typeof post.startupId?.name === 'string' ? post.startupId.name : null) || 
                     (typeof post.authorId?.name === 'string' ? post.authorId.name : null) || 
                     'Unknown';
  const authorImage = post.startupId?.logo || post.authorId?.profileImage;
  const subText = post.startupId ? 'Startup' : (post.authorId?.role || 'User'); 
  const isVerified = post.startupId ? post.startupId.isVerified : (post.authorId?.verificationBadge === 'founder' || post.authorId?.verificationBadge === 'investor');

  // Link to profile or startup page
  const profileLink = post.startupId?._id 
    ? `/startups/${post.startupId._id}` 
    : (post.authorId?._id 
        ? (user && (user._id === post.authorId._id || user.username === post.authorId.username) 
            ? `/profile` 
            : `/profile/${post.authorId.username || post.authorId._id}`) 
        : '#');

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm border overflow-hidden mb-6`}>
      {/* Repost Header */}
      {post.isRepost && post.repostOf && (
        <div className={`px-4 pt-2 flex items-center text-xs ${subTextColor}`}>
          <Share2 className="h-3 w-3 mr-1" />
          <span>{post.authorId?.name || 'Someone'} reposted</span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href={profileLink}>
            <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative">
              {authorImage ? (
                <img src={authorImage} alt={authorName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold">
                  {authorName.charAt(0)}
                </div>
              )}
            </div>
          </Link>
          <div>
            <div className="flex items-center">
              <Link href={profileLink} className={`font-bold ${textColor} hover:text-primary transition mr-1`}>
                {authorName}
              </Link>
              {isVerified && (
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
            <div className={`flex items-center text-xs ${subTextColor}`}>
              <span className="capitalize">{subText}</span>
              <span className="mx-1">•</span>
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button className={iconColor} onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
              {user && user._id === (post.authorId?._id || post.authorId) && (
                <button 
                  onClick={handlePin}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  {user.pinnedPost === post._id ? 'Unpin from profile' : 'Pin to profile'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Indicator */}
      {post.parentPostId && typeof post.parentPostId === 'object' && post.parentPostId.authorId && (
        <div className="px-4 pb-1 text-sm text-gray-500">
          Replying to <Link href={user && (user._id === post.parentPostId.authorId._id || user.username === post.parentPostId.authorId.username) ? `/profile` : `/profile/${post.parentPostId.authorId.username || post.parentPostId.authorId._id}`} className="text-primary hover:underline">@{post.parentPostId.authorId.username || 'user'}</Link>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <div className={`${bodyTextColor} whitespace-pre-wrap`}>
          {formatContent(post.content)}
        </div>
      </div>

      {/* Reposted Content Preview (if simple repost or quote) */}
      {post.isRepost && post.repostOf && typeof post.repostOf === 'object' && (
        <div className="mx-4 mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-6 w-6 rounded-full bg-gray-300 overflow-hidden">
               {/* Simplified nested author render */}
               {post.repostOf.authorId?.profileImage && <img src={post.repostOf.authorId.profileImage} className="w-full h-full object-cover"/>}
            </div>
            <span className={`text-sm font-bold ${textColor}`}>{typeof post.repostOf.authorId?.name === 'string' ? post.repostOf.authorId.name : 'Unknown'}</span>
            <span className={`text-xs ${subTextColor}`}>{formatDistanceToNow(new Date(post.repostOf.createdAt))} ago</span>
          </div>
          <p className={`text-sm ${bodyTextColor}`}>{post.repostOf.content}</p>
        </div>
      )}

      {/* Media */}
      {post.mediaUrl && (
        <div className="w-full bg-black relative group">
          {post.contentType === 'vtweet' || post.type === 'video' ? (
            <video 
              src={post.mediaUrl} 
              autoPlay={post.contentType === 'vtweet'}
              muted={post.contentType === 'vtweet'}
              loop={post.contentType === 'vtweet'}
              controls={post.contentType !== 'vtweet'}
              className="w-full max-h-[500px] object-contain cursor-pointer" 
              onClick={(e) => {
                  e.preventDefault();
                  if (post.contentType === 'vtweet') {
                      e.target.muted = !e.target.muted;
                  } else {
                      if (e.target.paused) e.target.play();
                      else e.target.pause();
                  }
              }}
            />
          ) : (
            <img 
              src={post.mediaUrl} 
              alt="Post content" 
              className="w-full max-h-[500px] object-cover" 
            />
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className={`px-4 py-3 border-t ${darkTheme ? 'border-gray-800' : 'border-gray-100'} flex items-center justify-between`}>
        <div className="flex space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-2 ${post.isLikedBy ? 'text-red-500' : iconColor} transition`}
          >
            <Heart className={`h-5 w-5 ${post.isLikedBy ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{post.likeCount}</span>
          </button>
          
          <Link href={`/post/${post._id}`} className={`flex items-center space-x-2 ${iconColor} transition`}>
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </Link>

          <div className="relative group">
            <button 
              className={`flex items-center space-x-2 ${iconColor} transition`}
              onClick={() => setShowQuoteInput(!showQuoteInput)}
            >
              <Share2 className="h-5 w-5" />
              <span className="text-sm font-medium">{post.repostCount || 0}</span>
            </button>
            
            {/* Quick Repost Menu */}
            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-white shadow-lg rounded-lg border border-gray-100 p-2 w-32 z-10">
               <button 
                  onClick={() => handleRepost(false)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 text-sm rounded text-gray-700"
               >
                  Repost
               </button>
               <button 
                  onClick={() => setShowQuoteInput(true)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-50 text-sm rounded text-gray-700"
               >
                  Quote
               </button>
            </div>
          </div>
        </div>

        {/* Investor Actions */}
        {user && user.role === 'investor' && (
          <div className="relative">
            <button 
              onClick={() => setShowInvestorMenu(!showInvestorMenu)}
              className={`flex items-center space-x-2 ${iconColor} transition hover:text-green-600`}
              title="Investor Actions"
            >
              <Briefcase className="h-5 w-5" />
            </button>
            
            {showInvestorMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white shadow-lg rounded-lg border border-gray-100 p-2 w-48 z-10">
                <button 
                  onClick={() => handleInvestorReact('interested')}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm rounded text-gray-700 font-medium"
                >
                   Interested
                </button>
                <button 
                  onClick={() => handleInvestorReact('want_to_invest')}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm rounded text-gray-700 font-medium"
                >
                   Want to Invest
                </button>
                <button 
                  onClick={() => handleInvestorReact('request_deck')}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm rounded text-gray-700 font-medium"
                >
                   Request Deck
                </button>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleSave}
          className={`transition ${post.isSavedBy ? 'text-blue-500' : iconColor}`}
        >
          <Bookmark className={`h-5 w-5 ${post.isSavedBy ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Quote Input Area */}
      {showQuoteInput && (
        <div className="px-4 pb-4">
          <textarea
            value={quoteBody}
            onChange={(e) => setQuoteBody(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-2 border rounded-md mb-2 text-sm text-black"
          />
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setShowQuoteInput(false)}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => handleRepost(true)}
              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-blue-600"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
