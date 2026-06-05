'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  MessageCircle,
  Heart,
  Share2,
  Trash2,
  X,
  Send,
  Loader,
  Eye,
  Calendar,
  Upload,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '@/utils/api';

function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
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

export default function FounderTVPage() {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVideosAndStats = async () => {
    try {
      setLoading(true);
      // Fetch videos
      const res = await fetch(`${API_URL}/api/videos`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setVideos(data.data);
      }

      // Fetch dynamic stats
      const statsRes = await fetch(`${API_URL}/api/videos/stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (err) {
      console.error('Error loading discovery data:', err);
      addToast('Failed to load videos and statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndStats();
  }, []);

  // Filter video lists for dynamic feeds
  const latestVideos = [...videos].slice(0, 6);
  
  const mostViewedVideos = [...videos]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 6);

  const mostLikedVideos = [...videos]
    .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
    .slice(0, 6);

  const myUploadedVideos = user
    ? videos.filter(v => v.creator?._id === user._id || v.creator === user._id || v.uploader?._id === user._id || v.uploader === user._id)
    : [];

  const mostViewedVideo = videos.length > 0
    ? [...videos].sort((a, b) => (b.views || 0) - (a.views || 0))[0]
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 font-sans relative overflow-hidden">
      {/* Dynamic Blur Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-600/[0.03] blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[40%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-600/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[15%] w-[40rem] h-[40rem] rounded-full bg-indigo-600/[0.02] blur-[150px] pointer-events-none" />

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        
        {/* HERO SECTION */}
        <section className="text-center py-12 md:py-16 max-w-4xl mx-auto space-y-7 relative">
          {/* Floating Premium Orbs for depth */}
          <div className="absolute top-[5%] left-[15%] w-[18rem] h-[18rem] rounded-full bg-blue-500/[0.04] blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[10%] right-[15%] w-[18rem] h-[18rem] rounded-full bg-purple-500/[0.04] blur-[80px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full border border-slate-200 bg-[rgba(255,255,255,0.75)] backdrop-blur-md text-[13px] font-bold text-blue-600 shadow-[0_10px_30px_rgba(15,23,42,0.03)] hover:shadow-[0_10px_35px_rgba(37,99,235,0.08)] transition duration-300"
          >
            <Sparkles className="w-4 h-4 text-purple-650 animate-spin" style={{ animationDuration: '5s' }} />
            <span>Premium AI Pitch Discovery Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] text-[#0F172A]"
          >
            Founder<span className="bg-gradient-to-r from-[#2563EB] to-[#9333EA] bg-clip-text text-transparent drop-shadow-sm">TV</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed font-semibold"
          >
            AI-powered pitch discovery for founders and investors. Discover disruptive ventures, analyze pitch strategies with AI, and track real VC interest.
          </motion.p>

          {/* Value Proposition Strip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto py-2"
          >
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[rgba(255,255,255,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.8)] shadow-[0_8px_32px_rgba(15,23,42,0.04)] rounded-full text-[11.5px] font-bold text-[#334155] hover:scale-105 transition duration-200">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Startup Pitches</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[rgba(255,255,255,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.8)] shadow-[0_8px_32px_rgba(15,23,42,0.04)] rounded-full text-[11.5px] font-bold text-[#334155] hover:scale-105 transition duration-200">
              <Sparkles className="w-3.5 h-3.5 text-yellow-600 animate-pulse" />
              <span>Get AI Feedback</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[rgba(255,255,255,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.8)] shadow-[0_8px_32px_rgba(15,23,42,0.04)] rounded-full text-[11.5px] font-bold text-[#334155] hover:scale-105 transition duration-200">
              <Briefcase className="w-3.5 h-3.5 text-purple-650" />
              <span>Attract Investors</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[rgba(255,255,255,0.75)] backdrop-blur-md border border-[rgba(255,255,255,0.8)] shadow-[0_8px_32px_rgba(15,23,42,0.04)] rounded-full text-[11.5px] font-bold text-[#334155] hover:scale-105 transition duration-200">
              <Award className="w-3.5 h-3.5 text-rose-500" />
              <span>Showcase Innovation</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 py-1"
          >
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#9333EA] hover:from-[#1d4ed8] hover:to-[#7e22ce] text-white font-bold rounded-2xl shadow-[0_10px_25px_rgba(37,99,235,0.2)] hover:shadow-[0_15px_30px_rgba(37,99,235,0.35)] transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] flex items-center gap-2"
            >
              <Upload className="w-4.5 h-4.5" />
              Publish Pitch Video
            </button>
            <a
              href="#latest-pitches"
              className="px-6 py-3.5 bg-[rgba(255,255,255,0.75)] hover:bg-white text-[#0F172A] font-semibold rounded-2xl border border-[#E5E7EB] shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition transform hover:scale-[1.03] active:scale-[0.97] duration-200 flex items-center gap-2"
            >
              Explore Ventures
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* TRUST BAR */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.33 }}
            className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider max-w-xl mx-auto py-1"
          >
            Helping founders showcase ideas & investors discover opportunities
          </motion.p>

          {/* FEATURED PITCH PREVIEW */}
          {mostViewedVideo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="max-w-xl mx-auto p-4 relative overflow-hidden group cursor-pointer hover:border-[#2563EB]/40 transition duration-300"
              onClick={() => router.push(`/foundertv/${mostViewedVideo._id}`)}
              style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
                borderRadius: '24px'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#2563EB] to-[#9333EA]" />
              
              <div className="flex flex-col sm:flex-row items-center gap-4 text-left">
                <div className="relative w-24 h-24 sm:w-28 sm:h-18 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0">
                  <img
                    src={mostViewedVideo.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-5 h-5 text-white fill-current" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-1 min-w-0 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 animate-pulse" />
                      Featured Pitch
                    </span>
                    <span className="text-[9.5px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                      {mostViewedVideo.category || 'general'}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-[#0F172A] text-sm truncate leading-snug group-hover:text-blue-600 transition-colors">
                    {mostViewedVideo.title || 'Untitled Pitch'}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-[11px] text-[#64748B] font-bold">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {formatViews(mostViewedVideo.views || 0)} Views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {mostViewedVideo.likes?.length || 0} Likes
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0 w-full sm:w-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/foundertv/${mostViewedVideo._id}`);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#9333EA] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1"
                  >
                    <span>Watch Pitch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}


        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-[#64748B]">Syncing with FounderTV directory...</p>
          </div>
        ) : videos.length === 0 ? (
          <section className="max-w-xl mx-auto p-8 rounded-3xl bg-[rgba(255,255,255,0.78)] border border-[rgba(148,163,184,0.25)] backdrop-blur-lg shadow-[0_20px_60px_rgba(15,23,42,0.08)] text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border border-blue-100">
              <Play className="w-10 h-10 text-[#2563EB] ml-1.5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0F172A]">No Pitches Published</h2>
              <p className="text-[#64748B] text-sm mt-2 max-w-sm mx-auto">
                Be the pioneering founder to launch your startup&apos;s pitch video to world-class investors!
              </p>
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="px-6 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#9333EA] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg transition duration-200"
            >
              Upload First Pitch
            </button>
          </section>
        ) : (
          <div className="space-y-20">
            {/* LATEST PITCHES */}
            {latestVideos.length > 0 && (
              <section id="latest-pitches" className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-blue-600 rounded-full" />
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
                    Latest Startup Pitches
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600">Live</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestVideos.map((video, idx) => (
                    <VideoCardItem key={video._id} video={video} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* MOST VIEWED */}
            {mostViewedVideos.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-emerald-600 rounded-full" />
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
                    Trending & Most Viewed
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mostViewedVideos.map((video, idx) => (
                    <VideoCardItem key={video._id} video={video} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* MOST LIKED */}
            {mostLikedVideos.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-rose-600 rounded-full" />
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
                    Investor Choice & Most Liked
                    <Award className="w-5 h-5 text-rose-500 animate-bounce" style={{ animationDuration: '3s' }} />
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mostLikedVideos.map((video, idx) => (
                    <VideoCardItem key={video._id} video={video} index={idx} />
                  ))}
                </div>
              </section>
            )}

            {/* MY UPLOADS */}
            {user && myUploadedVideos.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-purple-650 rounded-full" />
                  <h2 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
                    My Uploaded Pitches
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-[11px] font-bold text-purple-600">Founder Account</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myUploadedVideos.map((video, idx) => (
                    <VideoCardItem key={video._id} video={video} index={idx} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// PREMIUM GLASSMORPHIC VIDEO CARD
function VideoCardItem({ video, index }) {
  const router = useRouter();
  const creatorName = getSafeCreatorName(video);
  const creatorAvatar = getSafeCreatorAvatar(video);
  const hasAnalysis = !!video.pitchAnalysis;
  const interestCount = video.investorInterestCount || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => router.push(`/foundertv/${video._id}`)}
      className="group cursor-pointer rounded-[24px] overflow-hidden border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.78)] backdrop-blur-[18px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-[#2563EB]/40 hover:shadow-[0_20px_60px_rgba(37,99,235,0.12)] flex flex-col h-full"
    >
      {/* Thumbnail Aspect Video */}
      <div className="relative aspect-video overflow-hidden bg-slate-950 flex-shrink-0">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-[1.08] transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition duration-300" />
        
        {/* Play Overlay Hover Effect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
          <div className="w-14 h-14 bg-gradient-to-r from-[#2563EB] to-[#9333EA] rounded-full flex items-center justify-center shadow-lg border border-white/20">
            <Play className="w-6 h-6 text-white fill-current ml-1" />
          </div>
        </div>

        {/* Dynamic Category Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/80 border border-slate-200/60 backdrop-blur-md">
          <span className="text-[10.5px] font-extrabold uppercase text-blue-600 tracking-wider flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-purple-600" />
            {video.category || 'general'}
          </span>
        </div>

        {/* AI Analyzed Badge */}
        {hasAnalysis && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-250 backdrop-blur-md shadow-md">
            <span className="text-[10px] font-black text-emerald-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              AI ANALYZED
            </span>
          </div>
        )}
      </div>

      {/* Card Info Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <h3 className="font-bold text-[17px] text-[#0F172A] leading-snug line-clamp-2 group-hover:text-[#2563EB] transition-colors duration-200">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-[#64748B] text-[13px] line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        <div className="space-y-3.5 pt-1">
          {/* Creator Profile */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-200">
              {creatorAvatar ? (
                <img
                  src={creatorAvatar}
                  className="w-full h-full object-cover"
                  alt=""
                />
              ) : (
                <span className="text-xs font-bold text-[#64748B]">{getInitial(creatorName)}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[13.5px] text-[#0F172A] truncate leading-none">
                {creatorName}
              </p>
              <p className="text-[10.5px] text-[#64748B] mt-1 uppercase font-bold tracking-wider leading-none">
                {video.creator?.headline || 'Startup Founder'}
              </p>
            </div>
          </div>

          {/* Real Metrics Indicators */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3.5">
            <div className="flex items-center gap-3.5 text-[#64748B] text-xs">
              <div className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
                <Eye className="w-4 h-4 text-[#94A3B8]" />
                <span className="font-semibold text-[#334155]">{formatViews(video.views || 0)}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
                <Heart className="w-4 h-4 text-[#94A3B8]" />
                <span className="font-semibold text-[#334155]">{video.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1 hover:text-[#0F172A] transition-colors">
                <MessageCircle className="w-4 h-4 text-[#94A3B8]" />
                <span className="font-semibold text-[#334155]">{video.comments?.length || 0}</span>
              </div>
            </div>

            {/* Investor Interest Indicator Badge */}
            {interestCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-100">
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-[10.5px] font-black text-purple-600">{interestCount} VCs</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
