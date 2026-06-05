'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import ConfirmationModal from '../../../components/ConfirmationModal';
import FollowButton from '../../../components/FollowButton';
import ShareButton from '../../../components/ShareButton';
import SendInterestRequestModal from '../../../components/SendInterestRequestModal';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { 
  Eye, 
  User, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  Edit3, 
  LogOut, 
  Video, 
  Heart, 
  MessageCircle, 
  Layers, 
  Plus, 
  Award,
  Globe,
  Loader,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '@/utils/api';

function formatViews(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function ProfilePageClient({ username }) {
  const { user: currentUser, loading: authLoading, logout, token, refreshUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  // Profile User State
  const [profileUser, setProfileUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  // Activity & Startups State
  const [videos, setVideos] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingStartups, setLoadingStartups] = useState(true);

  // Private View State (Owner only)
  const [views, setViews] = useState([]);
  const [loadingViews, setLoadingViews] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Guest actions state
  const [localIsFollowing, setLocalIsFollowing] = useState(false);
  const [localFollowersCount, setLocalFollowersCount] = useState(0);
  const [mutuals, setMutuals] = useState([]);
  const [loadingMutuals, setLoadingMutuals] = useState(false);
  const [canChat, setCanChat] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedStartupForInterest, setSelectedStartupForInterest] = useState(null);

  const isOwner = currentUser && profileUser && currentUser._id === profileUser._id;

  // Set share URL client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, [profileUser]);

  // 1. Fetch Profile User details on mount/username change
  useEffect(() => {
    const fetchProfileUser = async () => {
      setLoadingProfile(true);
      setError('');
      try {
        const res = await fetch(`${API_URL}/api/users/handle/${username}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProfileUser(json.data);
        } else {
          setError(json.error || 'User not found');
        }
      } catch (err) {
        console.error('Error fetching profile user:', err);
        setError('Failed to load user profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    if (username) {
      fetchProfileUser();
    }
  }, [username, API_URL]);

  // 2. Fetch Owner/Guest specific details once profileUser is resolved
  useEffect(() => {
    if (!profileUser) return;

    // Fetch activity and startups (publicly accessible)
    fetchActivityAndStartups(profileUser._id);

    if (currentUser && token) {
      if (isOwner) {
        // Owner logic
        fetchProfileViews();
      } else {
        // Guest logic
        fetchMutuals(profileUser._id);
        checkChatAccess(profileUser._id);
        recordView(profileUser._id);
      }
    }

    // Sync followers status
    const isFollowing = currentUser && profileUser.followers 
      ? profileUser.followers.some(f => (f._id || f) === currentUser._id) 
      : false;
    setLocalIsFollowing(isFollowing);
    setLocalFollowersCount(profileUser.followers?.length || 0);

  }, [profileUser, currentUser, token, isOwner]);

  const fetchProfileViews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile-views`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setViews(json.data);
      }
    } catch (err) {
      console.error('Failed to load profile views:', err);
    } finally {
      setLoadingViews(false);
    }
  };

  const fetchMutuals = async (targetId) => {
    setLoadingMutuals(true);
    try {
      const res = await fetch(`${API_URL}/api/users/${targetId}/mutuals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMutuals(json.data);
      }
    } catch (err) {
      console.error('Failed to load mutual connections:', err);
    } finally {
      setLoadingMutuals(false);
    }
  };

  const checkChatAccess = async (targetId) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/can-chat/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setCanChat(json.canChat);
      }
    } catch (err) {
      console.error('Failed to check chat access:', err);
    }
  };

  const recordView = async (targetId) => {
    try {
      await fetch(`${API_URL}/api/users/${targetId}/view`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to record profile view:', err);
    }
  };

  const fetchActivityAndStartups = async (targetUserId) => {
    setLoadingActivity(true);
    setLoadingStartups(true);
    try {
      const videosRes = await fetch(`${API_URL}/api/videos`);
      const videosData = await videosRes.json();
      if (videosData.success && Array.isArray(videosData.data)) {
        const userVideos = videosData.data.filter(
          v => v.creator?._id === targetUserId || v.creator === targetUserId || v.uploader?._id === targetUserId || v.uploader === targetUserId
        );
        setVideos(userVideos);
      }
    } catch (err) {
      console.error('Failed to fetch founder activity:', err);
    } finally {
      setLoadingActivity(false);
    }

    try {
      const startupsRes = await fetch(`${API_URL}/api/startups?founderId=${targetUserId}`);
      const startupsData = await startupsRes.json();
      if (startupsData.success && Array.isArray(startupsData.data)) {
        setStartups(startupsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch founder startups:', err);
    } finally {
      setLoadingStartups(false);
    }
  };

  const handleFollowToggle = (newState) => {
    setLocalIsFollowing(newState);
    setLocalFollowersCount(prev => newState ? prev + 1 : prev - 1);
  };

  const handleMessage = () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    router.push(`/messages?userId=${profileUser._id}`);
  };

  if (loadingProfile || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center text-center px-4">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <X className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-slate-500 text-sm max-w-sm">
            {error || `The user @${username} does not exist or has deleted their account.`}
          </p>
          <Link href="/" className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition">
            Go Back Home
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dynamic activity metrics
  const totalPitches = videos.length;
  const totalViewsReceived = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalLikesReceived = videos.reduce((sum, v) => sum + (v.likes?.length || 0), 0);
  const totalCommentsReceived = videos.reduce((sum, v) => sum + (v.comments?.length || 0), 0);
  const hasActivity = totalPitches > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-20 font-sans relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-600/[0.02] blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-600/[0.02] blur-[120px] pointer-events-none" />

      <Navbar />
      
      {/* Cover Header Banner */}
      <div className="bg-white border-b border-slate-200/60 relative">
        <div className="h-44 md:h-56 bg-gradient-to-r from-[#1E3A8A] via-[#312E81] to-[#4C1D95] relative overflow-hidden">
          {profileUser.coverImage && (
            <img src={profileUser.coverImage} alt="" className="w-full h-full object-cover opacity-80" />
          )}
          {/* subtle mesh decoration */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative -mt-16 md:-mt-20 mb-6 flex flex-col md:flex-row items-center md:items-end justify-between text-center md:text-left gap-6">
            
            {/* Avatar & Details info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
              <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-white p-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-slate-200/50 overflow-hidden flex-shrink-0 relative z-10">
                {profileUser.profileImage ? (
                  <img src={profileUser.profileImage} alt={profileUser.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="h-full w-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-4xl rounded-full border border-blue-150">
                    {(profileUser.name || profileUser.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="space-y-1.5 md:mb-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-slate-900 leading-none">
                    {profileUser.name}
                  </h1>
                  {profileUser.isVerified && (
                    <div className="text-blue-500" title="Verified Founder">
                      <ShieldCheck className="h-6 w-6 fill-blue-50" />
                    </div>
                  )}
                  {profileUser.founderScore > 0 && (
                     <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100" title="Founder Score">
                       <Award className="h-4 w-4 text-yellow-600" />
                       <span className="text-sm font-bold text-yellow-700">{profileUser.founderScore}</span>
                     </div>
                  )}
                  <span className={`px-3 py-1 text-[10.5px] font-black uppercase tracking-wider rounded-full border ${
                    profileUser.role === 'founder' 
                      ? 'bg-blue-50 border-blue-100 text-blue-600' 
                      : profileUser.role === 'investor'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    {profileUser.role}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-500 max-w-lg">
                  {profileUser.headline || profileUser.bio || (isOwner ? "No headline set. Click edit profile to add details!" : "Active Member")}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-2">
              {isOwner ? (
                <>
                  <button 
                    onClick={() => router.push('/profile/edit')}
                    className="px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5 text-xs transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    Edit Profile Settings
                  </button>
                  <ShareButton title={`Check out ${profileUser.name} on FounderX`} url={shareUrl} />
                  <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl shadow-sm transition"
                    title="Sign out"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </>
              ) : (
                <>
                  <ShareButton title={`Check out ${profileUser.name} on FounderX`} url={shareUrl} />
                  <button 
                    onClick={handleMessage}
                    disabled={!canChat}
                    className={`p-2.5 border rounded-xl shadow-sm transition ${canChat ? 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700' : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'}`}
                    title={canChat ? "Send Message" : "Need mutual follow, same startup team, or accepted investment request to message"}
                  >
                    <MessageCircle className="h-4.5 w-4.5" />
                  </button>
                  <FollowButton 
                    userId={profileUser._id} 
                    initialIsFollowing={localIsFollowing} 
                    onToggle={handleFollowToggle}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold font-sans shadow-md"
                  />
                  {currentUser && currentUser.role === 'founder' && profileUser.role === 'job_seeker' && (
                    <button
                      onClick={() => setInviteModalOpen(true)}
                      className="px-4.5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl hover:shadow-md transition text-xs font-sans"
                    >
                      Invite to Team
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Profile Completion/Join banner */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200/50 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(37,99,235,0.03)] backdrop-blur-md">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-base font-black text-slate-900 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                Join FounderX Professional Network
              </h3>
              <p className="text-xs font-semibold text-slate-500 max-w-xl">
                Create an account to connect with co-founders, verify your skills, and pitch to active investors.
              </p>
            </div>
            <button
              onClick={() => router.push('/auth/register')}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition transform hover:scale-[1.03]"
            >
              Sign Up Free
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT SIDEBAR COLUMN: ABOUT CARD & PROFILE VIEWS / MUTUAL CONNECTIONS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* ABOUT SECTION CARD */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
              <h3 className="text-md font-black tracking-tight text-slate-955 uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                About
              </h3>
              
              <div className="space-y-4.5 text-xs font-semibold text-slate-600">
                {profileUser.bio && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bio / Headline</span>
                    <p className="text-slate-800 text-xs leading-relaxed font-semibold">{profileUser.bio}</p>
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">User Handle</span>
                  <p className="text-slate-955 font-bold text-xs">@{profileUser.username || 'unknown'}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Role Profile</span>
                  <p className="text-slate-955 font-bold text-xs uppercase tracking-wide">{profileUser.role}</p>
                </div>

                {profileUser.location && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</span>
                    <p className="text-slate-955 font-bold text-xs flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {typeof profileUser.location === 'object' 
                        ? `${profileUser.location.city || ''}${profileUser.location.city && profileUser.location.country ? ', ' : ''}${profileUser.location.country || ''}`
                        : profileUser.location}
                    </p>
                  </div>
                )}

                {/* verified skills list */}
                {profileUser.skills && profileUser.skills.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-55">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Verified Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profileUser.skills.map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profileUser.industry && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary Industry</span>
                    <p className="text-slate-955 font-bold text-xs">{profileUser.industry}</p>
                  </div>
                )}

                {/* Followers and Following counts */}
                <div className="flex items-center gap-4 pt-2.5 border-t border-slate-105">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-405">Followers</div>
                    <div className="text-sm font-black text-slate-950">{localFollowersCount}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-405">Following</div>
                    <div className="text-sm font-black text-slate-950">{profileUser.following?.length || 0}</div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-[10.5px]">Joined {profileUser.createdAt ? format(new Date(profileUser.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* OWNER-ONLY PROFILE VIEWS OR GUEST-ONLY MUTUAL CONNECTIONS */}
            {isOwner ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.03)] overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5 uppercase">
                      <Eye className="h-4.5 w-4.5 text-blue-600" />
                      Profile Views
                    </h3>
                    <p className="text-[10.5px] text-slate-500 mt-1 font-semibold">
                      Last 30 days history
                    </p>
                  </div>
                  <div className="text-2xl font-black text-blue-600">
                    {views.length}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                  {loadingViews ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading history...</div>
                  ) : views.length > 0 ? (
                    views.map((view, index) => {
                      const viewer = view.viewerId || {};
                      const viewerName = typeof viewer.name === 'string' ? viewer.name : 'Accredited Member';
                      const viewerRole = typeof viewer.role === 'string' ? viewer.role : 'member';
                      const viewerUsername = typeof viewer.username === 'string' ? viewer.username : '';
                      const viewerImage = typeof viewer.profileImage === 'string' ? viewer.profileImage : null;
                      const viewerId = viewer._id || `unknown-${index}`;
                      
                      return (
                        <div key={index} className="p-4 hover:bg-slate-50/50 transition flex items-center justify-between gap-3">
                          <Link href={`/profile/${viewerUsername || viewerId}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {viewerImage ? (
                                <img src={viewerImage} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-slate-500">{viewerName.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{viewerName}</p>
                              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                                {viewerRole} {viewerUsername && `• @${viewerUsername}`}
                              </p>
                            </div>
                          </Link>
                          <div className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                            {view.timestamp ? format(new Date(view.timestamp), 'MMM d') : ''}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-1">
                      <p>No profile views recorded.</p>
                      <p className="text-[10px] text-slate-400 font-normal">Share your ventures to attract attention!</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              currentUser && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.03)] overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-955 flex items-center gap-1.5 uppercase">
                      <Users className="h-4.5 w-4.5 text-blue-600" />
                      Mutual Connections
                    </h3>
                    <p className="text-[10.5px] text-slate-500 mt-1 font-semibold">
                      People you both follow
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
                    {loadingMutuals ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold">Loading connections...</div>
                    ) : mutuals.length > 0 ? (
                      mutuals.map((mutual) => (
                        <div key={mutual._id} className="p-4 hover:bg-slate-50/50 transition flex items-center gap-3">
                          <Link href={`/profile/${mutual.username || mutual._id}`} className="flex items-center gap-2.5 flex-1 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {mutual.profileImage ? (
                                <img src={mutual.profileImage} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-slate-500">{(mutual.name || 'U').charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate leading-none mb-1">{mutual.name}</p>
                              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                                {mutual.role} {mutual.username && `• @${mutual.username}`}
                              </p>
                            </div>
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-1">
                        <p>No mutual connections yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

          </div>

          {/* RIGHT MAIN SECTION: ABOUT (EXTENDED), ACTIVITY, STARTUPS, EXPERIENCE & Q&A */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* EXTENDED ABOUT CARD */}
            {profileUser.about && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-4">
                <h3 className="text-md font-black tracking-tight text-slate-955 uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  About
                </h3>
                <p className="text-xs leading-relaxed text-slate-650 font-medium whitespace-pre-wrap">
                  {profileUser.about}
                </p>
              </div>
            )}

            {/* FOUNDER ACTIVITY FEED */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <h3 className="text-md font-black tracking-tight text-slate-955 uppercase flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Activity Feed
                </h3>
                <span className="text-[10.5px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                  Real Metrics
                </span>
              </div>

              {loadingActivity ? (
                <div className="flex justify-center py-10">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : !hasActivity ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
                    <Video className="w-5 h-5 text-blue-600 ml-0.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-900">No activity yet</p>
                    {isOwner ? (
                      <p className="text-[10.5px] text-slate-500 font-semibold max-w-xs mx-auto mb-2">Publish your first startup pitch video on FounderTV to display real metrics and traction here!</p>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 font-semibold max-w-xs mx-auto">This user has not posted any pitch videos yet.</p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => router.push('/upload')}
                      className="px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md transition"
                    >
                      Upload Pitch Video
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-955">{totalPitches}</div>
                      <div className="text-[9.5px] font-black text-slate-408 uppercase tracking-widest leading-none">Total Pitches</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-955">{formatViews(totalViewsReceived)}</div>
                      <div className="text-[9.5px] font-black text-slate-408 uppercase tracking-widest leading-none">Total Views</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-955">{totalLikesReceived}</div>
                      <div className="text-[9.5px] font-black text-slate-408 uppercase tracking-widest leading-none">Likes Gained</div>
                    </div>
                    <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200/50 text-center space-y-1 hover:shadow-sm transition">
                      <div className="text-2xl font-black text-slate-955">{totalCommentsReceived}</div>
                      <div className="text-[9.5px] font-black text-slate-408 uppercase tracking-widest leading-none">Comments</div>
                    </div>
                  </div>

                  {/* Uploaded videos list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Recent Uploads</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {videos.slice(0, 4).map(vid => (
                        <div 
                          key={vid._id}
                          onClick={() => router.push(`/foundertv/${vid._id}`)}
                          className="group border border-slate-200 rounded-2xl p-3 bg-white hover:border-blue-600/30 hover:shadow-md transition duration-200 cursor-pointer flex items-center gap-3.5"
                        >
                          <div className="w-18 h-18 sm:w-20 sm:h-13 bg-slate-905 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-white fill-current opacity-80 group-hover:scale-110 transition" />
                            </div>
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h5 className="font-extrabold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {vid.title}
                            </h5>
                            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{formatViews(vid.views || 0)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{vid.likes?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MY STARTUP VENTURES */}
            {loadingStartups ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] flex justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : startups.length > 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-md font-black tracking-tight text-slate-950 uppercase flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Startup Ventures
                  </h3>
                  {isOwner && (
                    <Link 
                      href="/startups/create"
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add New
                    </Link>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {startups.map(startup => (
                    <div 
                      key={startup._id}
                      className="group border border-slate-200 p-5 rounded-2.5xl bg-white hover:border-blue-600/30 hover:shadow-md transition duration-300 flex flex-col justify-between h-full"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3.5">
                          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-slate-500 shadow-sm overflow-hidden">
                            {startup.logo ? (
                              <img src={startup.logo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              (startup.name || 'S').charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                              {startup.name}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                              {startup.industry || 'Tech Startup'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-550 line-clamp-3 font-semibold">
                          {startup.oneLinePitch || startup.description || 'No pitch description provided.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9.5px] font-black uppercase tracking-wider text-blue-600">
                          {startup.stage || 'Pre-seed'}
                        </span>
                        <div className="flex items-center gap-2">
                          {currentUser && currentUser.role === 'investor' && !isOwner && (
                            <button
                              onClick={() => {
                                setSelectedStartupForInterest(startup);
                                setInterestModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10.5px] uppercase rounded-lg transition"
                            >
                              Send Interest
                            </button>
                          )}
                          <Link 
                            href={`/s/${startup.slug || startup._id}`}
                            className="text-[10px] font-black text-slate-900 hover:text-blue-600 uppercase tracking-wider transition"
                          >
                            View Showcase →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* EXPERIENCE TIMELINE */}
            {profileUser.experience && profileUser.experience.filter(exp => exp !== null && exp !== undefined).length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
                <h3 className="text-md font-black tracking-tight text-slate-955 uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Experience
                </h3>
                <div className="space-y-6">
                  {profileUser.experience
                    .filter(exp => exp !== null && exp !== undefined)
                    .map((exp, i) => (
                      <div key={exp._id || exp.id || i} className="flex gap-4">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-slate-900">{exp.title}</h4>
                          <div className="text-xs font-bold text-slate-500">{exp.company} {exp.location && `• ${exp.location}`}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">
                            {exp.startDate ? format(new Date(exp.startDate), 'MMM yyyy') : ''} - 
                            {exp.current ? ' Present' : (exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : '')}
                          </div>
                          {exp.description && (
                            <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}


          </div>

        </div>

      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          logout();
          setIsLogoutModalOpen(false);
        }}
        title="Sign out from FounderX"
        message="Are you sure you want to log out? You will need to sign in again to access your account dashboard."
        confirmText="Sign out"
        cancelText="Cancel"
      />

      <InviteTeamModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        recipient={profileUser}
      />

      <SendInterestRequestModal
        isOpen={interestModalOpen}
        onClose={() => {
          setInterestModalOpen(false);
          setSelectedStartupForInterest(null);
        }}
        startup={selectedStartupForInterest}
      />
    </div>
  );
}

function InviteTeamModal({ isOpen, onClose, recipient }) {
  const { user, token } = useAuth();
  const [startups, setStartups] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState('');
  const [role, setRole] = useState('co-founder');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyStartups = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_URL}/api/startups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const myStartups = json.data.filter(s => s.founderId === user?._id || s.founderId?._id === user?._id);
          setStartups(myStartups);
          if (myStartups.length > 0) {
            setSelectedStartupId(myStartups[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching startups for invite:', err);
      }
    };
    if (isOpen && user && token) {
      fetchMyStartups();
    }
  }, [isOpen, user, token, API_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStartupId) {
      alert('Please select a startup first. You must own a startup to invite team members!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/team-invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: selectedStartupId,
          recipientId: recipient._id,
          role,
          message
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Team invitation sent successfully!');
        onClose();
      } else {
        alert(data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending team invitation.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">Invite {recipient.name || recipient.fullName || recipient.username} to Team</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Startup</label>
            {startups.length > 0 ? (
              <select
                value={selectedStartupId}
                onChange={(e) => setSelectedStartupId(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white text-sm"
                required
              >
                {startups.map((s, index) => (
                  <option key={s._id || s.id || index} value={s._id || s.id || index}>{s.name || 'Unnamed Startup'}</option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg font-medium">
                No startups found. You must create a startup profile to invite members.
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2.5 border rounded-xl bg-white text-sm"
              required
            >
              <option value="co-founder">Co-founder</option>
              <option value="team-member">Team member</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why you want them on your team..."
              className="w-full p-3 border rounded-xl text-sm h-24"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || startups.length === 0}
            className="w-full btn-primary py-2.5 rounded-xl font-bold font-sans disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}
