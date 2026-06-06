'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pin, Briefcase, EyeOff, AlertTriangle, X, Copy, Check, Loader, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getSafeInitial } from '../utils/helpers';

export default function PostCard({ post: initialPost, darkTheme = false, refreshUser }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  useEffect(() => {
    setPost(initialPost);
  }, [initialPost]);
  const [isReposting, setIsReposting] = useState(false);
  const [showQuoteInput, setShowQuoteInput] = useState(false);
  const [quoteBody, setQuoteBody] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showInvestorMenu, setShowInvestorMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Comments and Share popup state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`http://localhost:3000/api/posts/${post._id}`, {
        headers: {
          'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.data.replies || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState) {
      fetchComments();
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || submittingComment) return;
    setSubmittingComment(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentContent,
          parentPostId: post._id,
          type: 'text'
        })
      });

      const data = await res.json();
      if (data.success) {
        setCommentContent('');
        setComments(prev => [...prev, data.data]);
        setPost(prev => ({
          ...prev,
          commentCount: (prev.commentCount || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };


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

      const res = await fetch(`http://localhost:3000/api/posts/${post._id}/like`, {
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

      const res = await fetch(`http://localhost:3000/api/posts`, {
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
      const res = await fetch(`http://localhost:3000/api/posts/${post._id}/save`, {
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
      
      const res = await fetch(`http://localhost:3000/api/users/pin/${post._id}`, {
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

      const res = await fetch(`http://localhost:3000/api/posts/${post._id}/react`, {
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

  const handleReport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`http://localhost:3000/api/posts/${post._id}/report`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reportReason })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Thank you for reporting. We will review this post.');
        setShowReportModal(false);
        setReportReason('');
        setIsHidden(true);
      } else {
        alert(data.error || 'Failed to report post');
      }
    } catch (err) {
      console.error('Error reporting post:', err);
    }
  };

  const handleInterestedAction = async () => {
    setShowMenu(false);
    if (user && user.role === 'investor') {
      await handleInvestorReact('interested');
    } else {
      await handleLike();
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
    : (post.authorId?.username ? `/profile/${post.authorId.username}` : (post.authorId?._id ? `/profile/${post.authorId._id}` : '#'));

  if (isHidden) return null;

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
                  {getSafeInitial(authorName)}
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
              {user && (
                <>
                  <button 
                    onClick={handleInterestedAction}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Interested
                  </button>
                  <button 
                    onClick={() => {
                      setIsHidden(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <EyeOff className="h-4 w-4 mr-2 text-gray-500" />
                    Not Interested
                  </button>
                  <button 
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Report Post
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Indicator */}
      {post.parentPostId && typeof post.parentPostId === 'object' && post.parentPostId.authorId && (
        <div className="px-4 pb-1 text-sm text-gray-500">
          Replying to <Link href={`/profile/${post.parentPostId.authorId.username}`} className="text-primary hover:underline">@{post.parentPostId.authorId.username}</Link>
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
          
          <button 
            onClick={handleToggleComments}
            className={`flex items-center space-x-2 ${showComments ? 'text-primary' : iconColor} transition`}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.commentCount || 0}</span>
          </button>

          <div className="relative group">
            <button 
              className={`flex items-center space-x-2 ${iconColor} transition`}
              onClick={() => setShowShareModal(true)}
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
                  👋 Interested
                </button>
                <button 
                  onClick={() => handleInvestorReact('want_to_invest')}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm rounded text-gray-700 font-medium"
                >
                  💰 Want to Invest
                </button>
                <button 
                  onClick={() => handleInvestorReact('request_deck')}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm rounded text-gray-700 font-medium"
                >
                  📊 Request Deck
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

      {/* Comments section */}
      {showComments && (
        <div className={`border-t ${darkTheme ? 'border-gray-800' : 'border-gray-100'} p-4 ${darkTheme ? 'bg-gray-900/30' : 'bg-gray-50/50'}`}>
          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="flex gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold text-xs">
                    {getSafeInitial(user.name)}
                  </div>
                )}
              </div>
              <div className="flex-1 relative flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Post your reply..."
                  className={`w-full px-4 py-1.5 pr-10 border rounded-full text-sm outline-none transition focus:ring-2 focus:ring-primary ${
                    darkTheme 
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' 
                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  disabled={submittingComment}
                />
                <button
                  type="submit"
                  disabled={!commentContent.trim() || submittingComment}
                  className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold hover:bg-blue-600 transition flex items-center gap-1 disabled:opacity-50"
                >
                  {submittingComment ? (
                    <Loader className="animate-spin h-3 w-3" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Reply
                </button>
              </div>
            </form>
          ) : (
            <p className={`text-sm text-center mb-4 ${subTextColor}`}>
              Please{' '}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                log in
              </Link>{' '}
              to reply.
            </p>
          )}

          {/* Comment List */}
          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader className="animate-spin h-5 w-5 text-primary" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {comments.map((comment) => {
                const commentAuthorName = comment.authorId?.name || 'Unknown';
                const commentAuthorImage = comment.authorId?.profileImage;
                const commentUsername = comment.authorId?.username || '';
                const commentProfileLink = comment.authorId?.username 
                  ? `/profile/${comment.authorId.username}` 
                  : (comment.authorId?._id ? `/profile/${comment.authorId._id}` : '#');
                const commentIsVerified = comment.authorId?.verificationBadge === 'founder' || comment.authorId?.verificationBadge === 'investor';

                return (
                  <div key={comment._id} className="flex gap-2.5 items-start text-sm">
                    <Link href={commentProfileLink} className="mt-0.5">
                      <div className="h-7 w-7 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
                        {commentAuthorImage ? (
                          <img src={commentAuthorImage} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold text-[10px]">
                            {getSafeInitial(commentAuthorName)}
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className={`flex-1 rounded-2xl px-3.5 py-2.5 border ${
                      darkTheme 
                        ? 'bg-gray-800/80 border-gray-800/50 text-gray-100' 
                        : 'bg-white border-gray-200 text-gray-900 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1">
                          <Link href={commentProfileLink} className={`font-bold hover:text-primary transition ${textColor}`}>
                            {commentAuthorName}
                          </Link>
                          {commentIsVerified && (
                            <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                          <span className={`text-[10px] ${subTextColor}`}>
                            @{commentUsername}
                          </span>
                        </div>
                        <span className={`text-[10px] ${subTextColor}`}>
                          {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className={`${bodyTextColor} leading-relaxed break-words`}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`text-center py-4 text-xs border border-dashed rounded-xl ${
              darkTheme ? 'border-gray-800' : 'border-gray-200'
            } ${subTextColor}`}>
              No replies yet. Be the first to start the conversation!
            </div>
          )}
        </div>
      )}


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
      
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Report Post</h3>
            <p className="text-gray-500 text-sm mb-4">Please provide a reason for reporting this post. This helps us keep the FounderX community safe.</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting (e.g. spam, inappropriate content, false information)..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm mb-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-black"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-bold shadow-md hover:shadow-lg"
                disabled={!reportReason.trim()}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share this post
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Social Grid */}
            <div className="p-6 grid grid-cols-3 gap-4">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.content?.substring(0, 100)}... - ${window.location.origin}/post/${post._id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-50 transition group"
              >
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition duration-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">WhatsApp</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/post/${post._id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition group"
              >
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition duration-300">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Facebook</span>
              </a>

              <button
                onClick={() => {
                  handleCopyLink();
                  window.open('https://www.instagram.com', '_blank');
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-pink-50 transition group"
              >
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition duration-300">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700">Instagram</span>
              </button>
            </div>
            
            {/* Copy Link Section */}
            <div className="px-6 pb-6 pt-2">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Post Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/post/${post._id}`}
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none text-gray-800 overflow-ellipsis"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* FounderX quick actions */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  handleRepost(false);
                }}
                className="px-4 py-2 border border-gray-250 text-gray-700 rounded-xl hover:bg-gray-100 transition text-xs font-semibold"
              >
                Quick Repost
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShowQuoteInput(true);
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-xs font-bold"
              >
                Quote Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
