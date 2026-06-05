'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Calendar,
  Eye,
  Trash2,
  X,
  Send,
  Sparkles,
  Award,
  Users,
  Briefcase,
  Layers,
  ArrowLeft,
  Building,
  CheckCircle,
  Copy,
  Download,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { API_URL } from '@/utils/api';

function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const getInitial = (value) => {
  if (!value || typeof value !== "string") return "U";
  return value.charAt(0).toUpperCase();
};

const getSafeCreatorName = (video) => {
  return (
    video?.creator?.name ||
    video?.creator?.username ||
    video?.uploader?.name ||
    video?.uploader?.username ||
    "Unknown Creator"
  );
};

const getSafeCreatorAvatar = (video) => {
  return video?.creator?.profileImage || video?.creator?.avatar || video?.uploader?.profileImage || video?.uploader?.avatar || null;
};

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [video, setVideo] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interaction States
  const [newComment, setNewComment] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  // AI Pitch Analyzer States
  const [analyzing, setAnalyzing] = useState(false);

  // AI Launch Post States
  const [generatingPost, setGeneratingPost] = useState(false);
  const [postDrafts, setPostDrafts] = useState(null);
  const [activePostTab, setActivePostTab] = useState('linkedin'); // linkedin, twitter, description

  // Investor Interest States
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);

  const fetchVideoData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_URL}/api/videos/${params.id}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setVideo(data.data);
        
        // Fetch startup if exists
        const creatorId = data.data.creator?._id || data.data.creator;
        if (creatorId) {
          fetchStartupInfo(creatorId);
        }

        // Fetch user's existing investor interest
        if (user && user.role === 'investor') {
          checkExistingInterest(data.data._id);
        }
      } else {
        setError('Video not found');
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStartupInfo = async (founderId) => {
    try {
      const res = await fetch(`${API_URL}/api/startups?founderId=${founderId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const item = data.data[0];
        setStartup(item.startup || item);
      }
    } catch (err) {
      console.error('Error fetching founder startup:', err);
    }
  };

  const checkExistingInterest = async (videoId) => {
    try {
      // Find dynamic interest checks
      const res = await fetch(`${API_URL}/api/videos/dashboard/investor-interests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const found = data.data.some(i => i.videoId?._id === videoId && i.investorId?._id === user._id);
        setHasExpressedInterest(found);
      }
    } catch (err) {
      console.error('Error checking investor interest status:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchVideoData();
    }
  }, [params.id, user]);

  // Video view increment
  useEffect(() => {
    if (params.id) {
      fetch(`${API_URL}/api/videos/${params.id}/view`, { method: 'POST' })
        .catch(err => console.error('Error incrementing views:', err));
    }
  }, [params.id]);

  const handleLikeToggle = async () => {
    if (!token || !user) {
      addToast('Please login to like this pitch', 'error');
      return;
    }
    if (isLiking || !video) return;

    setIsLiking(true);
    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setVideo(prev => ({ ...prev, likes: data.data.likes }));
        addToast(data.data.isLiked ? 'Pitch liked!' : 'Like removed', 'success');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      addToast('Error saving like action', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!token || !user) {
      addToast('Please login to comment', 'error');
      return;
    }
    if (!newComment.trim() || isCommenting || !video) return;

    setIsCommenting(true);
    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setVideo(prev => ({ ...prev, comments: data.data }));
        setNewComment('');
        addToast('Comment posted successfully!', 'success');
      } else {
        addToast(data.error || 'Failed to post comment', 'error');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      addToast('Error posting comment', 'error');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShareVideo = () => {
    const videoLink = window.location.href;
    navigator.clipboard.writeText(videoLink)
      .then(() => {
        addToast('Pitch link copied to clipboard!', 'success');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        addToast('Failed to copy link', 'error');
      });
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to delete this pitch video?')) return;
    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Video deleted successfully', 'success');
        router.push('/foundertv');
      } else {
        addToast(data.error || 'Failed to delete video', 'error');
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      addToast('Error deleting video', 'error');
    }
  };

  // AI PITCH ANALYZER HANDLER
  const handleAnalyzePitch = async () => {
    if (!token || !user) {
      addToast('Please login to analyze pitches', 'error');
      return;
    }
    setAnalyzing(true);
    addToast('AI Coach is evaluating pitch and product metadata...', 'info');

    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setVideo(data.data);
        addToast('AI Pitch Analysis generated successfully!', 'success');
      } else {
        addToast(data.error || 'Failed to analyze pitch', 'error');
      }
    } catch (err) {
      console.error('Error analyzing pitch:', err);
      addToast('Error triggering AI analysis', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  // AI LAUNCH POST GENERATOR HANDLER
  const handleGenerateLaunchPost = async () => {
    if (!token || !user) {
      addToast('Please login to generate launch posts', 'error');
      return;
    }
    setGeneratingPost(true);
    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}/generate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPostDrafts(data.data);
        addToast('AI Launch Post copywriting complete!', 'success');
      } else {
        addToast(data.error || 'Failed to generate copy drafts', 'error');
      }
    } catch (err) {
      console.error('Error generating launch posts:', err);
      addToast('Error generating post copy', 'error');
    } finally {
      setGeneratingPost(false);
    }
  };

  // INVESTOR INTEREST MESSAGE SUBMISSION
  const handleExpressInterest = async () => {
    if (!token || !user) {
      addToast('Please login to contact founders', 'error');
      return;
    }
    if (user.role !== 'investor') {
      addToast('Only accredited investor profiles can log interest records.', 'error');
      return;
    }
    if (!interestMessage.trim()) {
      addToast('Connection introduction message is required', 'error');
      return;
    }

    setSubmittingInterest(true);
    try {
      const res = await fetch(`${API_URL}/api/videos/${video._id}/interest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: interestMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setHasExpressedInterest(true);
        setInterestModalOpen(false);
        setInterestMessage('');
        addToast('Connection request sent! Founder has been notified.', 'success');
        
        // Refresh local count
        setVideo(prev => ({
          ...prev,
          investorInterestCount: (prev.investorInterestCount || 0) + 1
        }));
      } else {
        addToast(data.error || 'Failed to log investor interest', 'error');
      }
    } catch (err) {
      console.error('Error sending investor interest request:', err);
      addToast('Error logging investor interest', 'error');
    } finally {
      setSubmittingInterest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin h-10 w-10 text-blue-650" />
          <p className="text-[#64748B] font-semibold text-sm">Syncing pitch video details...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h2 className="text-2xl font-black text-[#0F172A]">{error || 'Video pitch not found'}</h2>
          <Link href="/foundertv" className="px-5 py-2.5 bg-white hover:bg-slate-50 rounded-xl text-sm font-semibold transition border border-[#E5E7EB] inline-block text-[#64748B]">
            Back to FounderTV Discover
          </Link>
        </div>
      </div>
    );
  }

  const creatorName = getSafeCreatorName(video);
  const creatorAvatar = getSafeCreatorAvatar(video);
  const hasAnalysis = !!video?.pitchAnalysis;
  const isFounder = user && (video?.creator?._id === user?._id || video?.creator === user?._id || video?.uploader?._id === user?._id || video?.uploader === user?._id);

  const title = video?.title || "Untitled Video";
  const description = video?.description || "No description available";
  const views = video?.views || 0;
  const likesCount = Array.isArray(video?.likes) ? video.likes.length : video?.likeCount || 0;
  const commentsCount = Array.isArray(video?.comments) ? video.comments.length : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 font-sans relative overflow-hidden">
      {/* Blurred background blobs */}
      <div className="absolute top-[10%] left-[-15%] w-[40rem] h-[40rem] rounded-full bg-blue-600/[0.03] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-600/[0.03] blur-[130px] pointer-events-none" />

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/foundertv')}
          className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] transition font-semibold text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to FounderTV Discover
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLS: PLAYER & STANDARD PANEL */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Real Video Player */}
            <div className="aspect-video bg-black rounded-[24px] overflow-hidden shadow-lg border border-[#E5E7EB] relative group">
              <video
                src={video.videoUrl || video.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={video.thumbnailUrl}
              />
            </div>

            {/* Title, Actions, Likes, Description */}
            <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-6">
              
              {/* Header Details */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-100 border border-[#E5E7EB]">
                      {creatorAvatar ? (
                        <img src={creatorAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-sm text-[#0F172A]">{getInitial(creatorName)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[16px] text-[#0F172A] leading-none">{creatorName}</h3>
                      <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-wider mt-1.5">{video.creator?.headline || 'Startup Founder'}</p>
                    </div>
                  </div>

                  {/* Core Engagement Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLikeToggle}
                      disabled={isLiking}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-xs transition transform hover:scale-[1.03] active:scale-[0.97] duration-150 ${
                        video?.likes?.includes(user?._id)
                          ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30 shadow-md font-bold'
                          : 'bg-white text-[#64748B] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#0F172A]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${video?.likes?.includes(user?._id) ? 'fill-current' : ''}`} />
                      {likesCount}
                    </button>

                    <button
                      onClick={handleShareVideo}
                      className="px-4 py-2.5 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] font-bold text-xs rounded-xl transition transform hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Link
                    </button>

                    {isFounder && (
                      <button
                        onClick={handleDeleteVideo}
                        className="p-2.5 bg-white border border-[#E5E7EB] hover:bg-rose-50 hover:text-rose-600 text-[#64748B] rounded-xl transition"
                        title="Delete Pitch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] leading-tight tracking-tight">
                  {title}
                </h1>
              </div>

              {/* View/Date Metadata and Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5E7EB] space-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#94A3B8]" />
                    {formatViews(views)} views
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#94A3B8]" />
                    {formatDate(video.createdAt)}
                  </span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">
                    {video.category || 'general'}
                  </span>
                </div>
                {description && (
                  <p className="text-[#334155] text-sm leading-relaxed whitespace-pre-wrap">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Comment Section Panel */}
            <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-6">
              <h3 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                Pitch Discussions ({commentsCount})
              </h3>

              {/* New Comment Form */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={user ? 'Ask a question or offer constructive feedback...' : 'Log in to join the conversation'}
                  disabled={!user || isCommenting}
                  className="flex-1 px-4 py-3 bg-white border border-[#CBD5E1] rounded-xl outline-none text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] disabled:opacity-50 transition"
                />
                <button
                  type="submit"
                  disabled={!user || !newComment.trim() || isCommenting}
                  className="px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center"
                >
                  {isCommenting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

              {/* Comments list */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {commentsCount === 0 ? (
                  <div className="text-center py-10 rounded-xl border border-dashed border-[#E5E7EB] bg-slate-50">
                    <p className="text-sm font-bold text-[#94A3B8]">No questions or comments yet. Start the conversation!</p>
                  </div>
                ) : (
                  video?.comments?.map((comment, idx) => (
                    <div key={comment._id || idx} className="flex gap-3 bg-white border border-[#E5E7EB] p-4 rounded-2xl">
                      <div className="w-8.5 h-8.5 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 border border-[#E5E7EB] flex-shrink-0">
                        {comment.user?.profileImage || comment.user?.avatar ? (
                          <img src={comment.user.profileImage || comment.user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-xs font-bold text-[#64748B]">{getInitial(comment.user?.name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-xs text-[#0F172A]">{comment.user?.name || 'Anonymous'}</span>
                          <span className="text-[10px] text-[#94A3B8] font-medium">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-[#334155]">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COL: AI DISCOVERY SUITE PANELS */}
          <div className="lg:col-span-1 space-y-6">

            {/* FEATURE 2: INVESTOR INTEREST PANEL */}
            {user && user.role === 'investor' && (
              <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#2563EB]" />
                    Investor Connect
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-550/10 border border-purple-500/25 text-[10px] font-black text-purple-600">
                    {video.investorInterestCount || 0} Expressed
                  </span>
                </div>
                
                <p className="text-xs leading-relaxed text-[#64748B]">
                  Accredited investors can express direct connection interest to the founder regarding this startup venture.
                </p>

                {hasExpressedInterest ? (
                  <div className="bg-emerald-550/10 border border-emerald-500/20 text-emerald-600 p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                    You have logged investment interest in this startup.
                  </div>
                ) : (
                  <button
                    onClick={() => setInterestModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white font-bold text-xs rounded-xl shadow-lg transition transform hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    I&apos;m Interested in Startup
                  </button>
                )}
              </div>
            )}

            {/* FEATURE 1: AI PITCH ANALYSIS PANEL */}
            <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-5">
              <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                AI Pitch Analysis
              </h3>

              {!hasAnalysis ? (
                <div className="space-y-4 text-center py-4">
                  <p className="text-xs leading-relaxed text-[#64748B]">
                    This startup pitch video does not have an active VC evaluation report. Let our AI analyze the pitch strategy.
                  </p>
                  <button
                    onClick={handleAnalyzePitch}
                    disabled={analyzing}
                    className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#9333EA] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze Pitch with AI
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Readiness Score Visual Gauge */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-[#E5E7EB] flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Investor Readiness</p>
                      <h4 className="text-2xl font-black text-[#0F172A] mt-1">
                        {video.pitchAnalysis.investorReadinessScore} <span className="text-sm font-bold text-[#94A3B8]">/ 100</span>
                      </h4>
                    </div>
                    
                    {/* Ring progress indicator */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-[#2563EB]" strokeDasharray={`${video.pitchAnalysis.investorReadinessScore}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute text-[10.5px] font-black text-[#0F172A]">
                        {video.pitchAnalysis.investorReadinessScore}%
                      </span>
                    </div>
                  </div>

                  {/* Analysis Subsections */}
                  <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                    <div className="space-y-1">
                      <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Summary</span>
                      <p className="text-[12.5px] leading-relaxed text-[#334155]">{video.pitchAnalysis.summary}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Business Model</span>
                      <p className="text-[12.5px] leading-relaxed text-[#334155]">{video.pitchAnalysis.businessModel}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Target Audience</span>
                      <p className="text-[12.5px] leading-relaxed text-[#334155]">{video.pitchAnalysis.targetUsers}</p>
                    </div>

                    {/* Core Strengths */}
                    {video.pitchAnalysis.strengths?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Core Strengths</span>
                        <ul className="space-y-1 text-[12px] leading-relaxed text-[#334155]">
                          {video.pitchAnalysis.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold mt-0.5">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {video.pitchAnalysis.weaknesses?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Weaknesses</span>
                        <ul className="space-y-1 text-[12px] leading-relaxed text-[#334155]">
                          {video.pitchAnalysis.weaknesses.map((weak, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold mt-0.5">•</span>
                              <span>{weak}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {video.pitchAnalysis.suggestions?.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">Coaching Advice</span>
                        <ul className="space-y-1 text-[12px] leading-relaxed text-[#334155]">
                          {video.pitchAnalysis.suggestions.map((sug, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-blue-500 font-bold mt-0.5">•</span>
                              <span>{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Re-analyze Button */}
                  <button
                    onClick={handleAnalyzePitch}
                    disabled={analyzing}
                    className="w-full py-2 border border-[#E5E7EB] hover:bg-slate-50 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {analyzing ? <Loader className="w-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    Re-Run AI Pitch Coach
                  </button>
                </div>
              )}
            </div>

            {/* FEATURE 3: AI SOCIAL POST GENERATOR */}
            <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-4">
              <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                <Send className="w-4.5 h-4.5 text-[#2563EB]" />
                Launch Post Copywriter
              </h3>

              {!postDrafts ? (
                <div className="space-y-3.5">
                  <p className="text-xs leading-relaxed text-[#64748B]">
                    Draft high-conversion marketing copies for LinkedIn, X/Twitter, and hashtags using video data.
                  </p>
                  <button
                    onClick={handleGenerateLaunchPost}
                    disabled={generatingPost}
                    className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#9333EA] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                  >
                    {generatingPost ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Writing posts...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Generate Launch Post
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-[#E5E7EB]">
                    {['linkedin', 'twitter', 'description'].map(t => (
                      <button
                        key={t}
                        onClick={() => setActivePostTab(t)}
                        className={`py-1.5 text-[10.5px] font-black uppercase tracking-wider rounded-lg transition ${
                          activePostTab === t
                            ? 'bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white shadow-md'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Active Content */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-[#E5E7EB] min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                    <p className="text-[12px] leading-relaxed text-[#334155] whitespace-pre-wrap select-all font-mono">
                      {activePostTab === 'linkedin' ? postDrafts.linkedin
                       : activePostTab === 'twitter' ? postDrafts.twitter
                       : `${postDrafts.description}\n\n${postDrafts.hashtags}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const copyTxt = activePostTab === 'linkedin' ? postDrafts.linkedin
                                      : activePostTab === 'twitter' ? postDrafts.twitter
                                      : `${postDrafts.description}\n\n${postDrafts.hashtags}`;
                        navigator.clipboard.writeText(copyTxt);
                        addToast(`${activePostTab.toUpperCase()} copy copied!`, 'success');
                      }}
                      className="flex-1 py-2 border border-[#E5E7EB] hover:bg-slate-50 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 text-[#0F172A]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Draft
                    </button>
                    
                    <button
                      onClick={handleGenerateLaunchPost}
                      disabled={generatingPost}
                      className="px-3 py-2 border border-[#E5E7EB] hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] rounded-xl transition"
                      title="Rewrite social copy drafts"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FEATURE 4: DYNAMIC STARTUP PROFILE PANEL */}
            {startup && (
              <div className="bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] border border-[rgba(148,163,184,0.25)] shadow-[0_20px_60px_rgba(15,23,42,0.08)] rounded-[24px] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-50 border border-[#E5E7EB] rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {startup.logo ? (
                      <img src={startup.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-6 h-6 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[15px] leading-tight text-[#0F172A]">{startup.name}</h3>
                    {startup.website && (
                      <a href={startup.website} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 hover:underline">
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#E5E7EB] pt-3.5">
                  <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                    <div className="bg-slate-50 p-3 border border-[#E5E7EB] rounded-xl">
                      <span className="text-[9.5px] font-black text-[#64748B] uppercase tracking-wider">Industry</span>
                      <p className="font-bold text-[#0F172A] mt-1">{startup.industry}</p>
                    </div>
                    <div className="bg-slate-50 p-3 border border-[#E5E7EB] rounded-xl">
                      <span className="text-[9.5px] font-black text-[#64748B] uppercase tracking-wider">Stage</span>
                      <p className="font-bold text-[#0F172A] mt-1 capitalize">{startup.stage.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <p className="text-[12px] leading-relaxed text-[#475569] italic">
                    &quot;{startup.oneLinePitch}&quot;
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                    <span className="text-[9.5px] font-black text-[#64748B] uppercase tracking-wider">Startup Summary</span>
                    <p className="text-[11.5px] leading-relaxed text-[#475569] mt-1 line-clamp-4">
                      {startup.description}
                    </p>
                  </div>
                  
                  {startup.fundingRequired > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold px-1 text-slate-550">
                      <span>Capital Required:</span>
                      <span className="text-[#0F172A]">${startup.fundingRequired.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* INVESTOR CONNECTION INTRO MODAL */}
      <AnimatePresence>
        {interestModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setInterestModalOpen(false)} />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-[#0F172A] text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[#2563EB]" />
                  Express VC Connection
                </h4>
                <button
                  onClick={() => setInterestModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-[#64748B] hover:text-[#0F172A] transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-[#64748B]">
                  Write a professional connection request to **{creatorName}**. This connects your profiles directly in database notifications.
                </p>

                <textarea
                  rows={4}
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  placeholder={`Hi ${creatorName.split(' ')[0]}, I am an accredited investor on FounderX. I reviewed your pitch for "${title}" and would love to connect to discuss investment possibilities...`}
                  className="w-full px-4.5 py-3.5 bg-slate-50 border border-[#CBD5E1] rounded-xl outline-none resize-none text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB]"
                />

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => setInterestModalOpen(false)}
                    className="px-4 py-2 border border-[#E5E7EB] hover:bg-slate-50 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={!interestMessage.trim() || submittingInterest}
                    className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#9333EA] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    {submittingInterest ? 'Connecting...' : 'Submit connection request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
