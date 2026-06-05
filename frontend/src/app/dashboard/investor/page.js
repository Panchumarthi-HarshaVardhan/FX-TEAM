'use client';

import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import SendInterestRequestModal from '../../../components/SendInterestRequestModal';
import Link from 'next/link';
import InvestorPortal from '../../../components/dashboard/InvestorPortal';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  Sparkles, 
  Users, 
  Zap, 
  Clock, 
  PlayCircle, 
  MessageSquare,
  Target,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Rocket,
  DollarSign,
  BarChart2,
  Filter,
  Plus,
  Check,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '@/utils/api';

// Investor Analytics Component
function InvestorAnalytics({ analytics }) {
  const metricItems = [
    { icon: Heart, label: 'Watchlist', value: analytics.savedStartups, color: 'text-red-500' },
    { icon: PlayCircle, label: 'Pitches Reviewed', value: analytics.pitchesReviewed, color: 'text-primary' },
    { icon: Sparkles, label: 'AI Matches', value: analytics.aiMatches, color: 'text-purple-600' },
    { icon: Users, label: 'Founder Connections', value: analytics.founderConnections, color: 'text-blue-600' },
    { icon: BarChart2, label: 'Industries Tracked', value: analytics.industriesTracked, color: 'text-green-600' },
    { icon: Eye, label: 'Startups Viewed', value: analytics.startupsViewed, color: 'text-yellow-600' }
  ];

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        Investor Analytics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricItems.map((item, i) => (
          <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
            <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
            <div className="text-xl font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Investment Assistant Component
function AIInvestmentAssistant({ recommendations }) {
  const [currentRec, setCurrentRec] = useState(0);

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        FounderX AI Investment Assistant
      </h3>

      {recommendations.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-blue-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-foreground">{recommendations[currentRec].name}</h4>
              <p className="text-sm text-muted">{recommendations[currentRec].tagline}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{recommendations[currentRec].aiScore}</div>
              <div className="text-xs text-muted">AI Score</div>
            </div>
          </div>
          <p className="text-sm text-foreground mb-4">{recommendations[currentRec].reason}</p>
          <div className="flex gap-3">
            <button className="btn-primary text-sm px-4 py-2">View Startup</button>
            <button className="btn-secondary text-sm px-4 py-2">Save</button>
            <button className="btn-secondary text-sm px-4 py-2">Request Intro</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {recommendations.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentRec(i)}
              className={`h-2 w-2 rounded-full transition-all ${i === currentRec ? 'bg-primary w-4' : 'bg-gray-300'}`}
            ></button>
          ))}
        </div>
        <button className="text-primary text-sm font-medium flex items-center gap-1">
          View all recommendations <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Watchlist Button Component
function WatchlistButton({ startupId, isSaved, onToggle }) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        const res = await fetch(`${API_URL}/api/watchlist/remove/${startupId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          onToggle(startupId, false);
          addToast('Removed from Watchlist', 'success');
        }
      } else {
        const res = await fetch(`${API_URL}/api/watchlist/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ startupId })
        });
        const data = await res.json();
        if (data.success) {
          onToggle(startupId, true);
          addToast('Added to Watchlist', 'success');
        }
      }
    } catch (error) {
      console.error(error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
        isSaved
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/30'
      }`}
    >
      {loading ? (
        <span className="animate-pulse">Loading...</span>
      ) : isSaved ? (
        <>
          <Check className="h-4 w-4" />
          Added
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Watchlist
        </>
      )}
    </motion.button>
  );
}

// Startup Card Component with Real Functionality
function StartupCard({ startup, onInterested, onView, isSaved, isRequested, onToggleWatchlist }) {
  const { token } = useAuth();

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-primary font-bold">
          {startup.name[0]}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">{startup.aiScore || 85}</div>
          <div className="text-xs text-muted">AI Score</div>
        </div>
      </div>
      <div className="mb-3">
        <h4 className="font-bold text-foreground">{startup.name}</h4>
        <p className="text-sm text-muted">{startup.tagline || startup.oneLinePitch}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
          {startup.stage}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
          {startup.industry}
        </span>
        {startup.monthlyGrowth && (
          <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {startup.monthlyGrowth}% MoM
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted mb-4">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {startup.metrics?.investorInterest || startup.investorInterest || 0} interested
        </span>
        <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-semibold">
          Raising Funds
        </span>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onInterested(startup)}
          className={`flex-1 text-xs py-2 rounded-xl font-semibold transition ${
            isRequested 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'btn-primary'
          }`}
          disabled={isRequested}
        >
          {isRequested ? 'Requested' : 'Interested'}
        </button>
        <WatchlistButton
          startupId={startup._id}
          isSaved={isSaved}
          onToggle={onToggleWatchlist}
        />
        <button 
          onClick={() => onView(startup)}
          className="btn-secondary text-xs py-2 px-3"
        >
          View
        </button>
      </div>
    </motion.div>
  );
}

// Startup Deal Flow Component
function StartupDealFlow({ startups, onInterested, onView, savedStartups, requestedStartups, onToggleWatchlist }) {
  const sections = [
    { title: 'Trending Startups', icon: TrendingUp, startups: startups.slice(0, 2) },
    { title: 'Fast Growing', icon: Rocket, startups: startups.slice(2, 4) }
  ];

  return (
    <div className="space-y-8">
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <section.icon className="h-5 w-5 text-primary" />
            {section.title}
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {section.startups.map((startup) => (
              <StartupCard
                key={startup._id}
                startup={startup}
                onInterested={onInterested}
                onView={onView}
                isSaved={savedStartups.includes(startup._id)}
                isRequested={requestedStartups.includes(startup._id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Pitch Feed Component
function PitchFeed({ pitches }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <PlayCircle className="h-5 w-5 text-primary" />
        Founder Pitch Feed
      </h3>
      <div className="space-y-4">
        {pitches.map((pitch) => (
          <div key={pitch._id} className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="h-12 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{pitch.startupName}</h4>
                <p className="text-xs text-muted mb-2">by {pitch.founderName}</p>
                <p className="text-sm text-foreground mb-2">{pitch.summary}</p>
                <p className="text-xs text-primary font-semibold">{pitch.traction}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <PlayCircle className="h-3 w-3" />
                Watch Pitch
              </button>
              <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Save
              </button>
              <button className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trending Insights Component
function TrendingInsights({ insights }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Trending Market Insights
      </h3>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-primary">{insight.hashtag}</span>
              <span className="text-xs text-muted">{insight.count} startups</span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
              insight.trend === 'Hot' ? 'bg-red-50 text-red-700' :
              insight.trend === 'Rising' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {insight.trend}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Investor Activity Feed Component
function InvestorActivityFeed({ activity }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Your Activity
      </h3>
      <div className="space-y-3">
        {activity.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${
              item.type === 'save' ? 'bg-red-50' :
              item.type === 'view' ? 'bg-blue-50' :
              item.type === 'contact' ? 'bg-green-50' :
              'bg-purple-50'
            }`}>
              {item.type === 'save' && <Heart className="h-4 w-4 text-red-500" />}
              {item.type === 'view' && <Eye className="h-4 w-4 text-blue-600" />}
              {item.type === 'contact' && <MessageSquare className="h-4 w-4 text-green-600" />}
              {item.type === 'review' && <PlayCircle className="h-4 w-4 text-purple-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{item.title}</p>
              <p className="text-xs text-muted mt-1">
                {item.date.toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Demo data
const demoData = {
  analytics: {
    savedStartups: 12,
    pitchesReviewed: 47,
    aiMatches: 5,
    founderConnections: 23,
    industriesTracked: 4,
    startupsViewed: 189
  },
  savedStartups: [
    { _id: '1', name: 'Nexus AI', industry: 'AI/ML', oneLinePitch: 'AI-powered pitch deck generator', fundingRequired: 2000000, raisingFunds: true },
    { _id: '2', name: 'BlockVault', industry: 'Fintech', oneLinePitch: 'Blockchain treasury management', fundingRequired: 750000, raisingFunds: true },
    { _id: '3', name: 'GreenLeaf', industry: 'GreenTech', oneLinePitch: 'Carbon footprint tracking', fundingRequired: 5000000, raisingFunds: true }
  ],
  aiRecommendations: [
    {
      _id: '1',
      name: 'NeuroFlow',
      tagline: 'AI-powered mental health platform',
      industry: 'Healthcare',
      stage: 'Seed',
      monthlyGrowth: 34,
      investorInterest: 56,
      aiScore: 94,
      reason: 'Matches your AI SaaS investment interests and shows strong user traction'
    },
    {
      _id: '2',
      name: 'CloudSync',
      tagline: 'Enterprise data synchronization',
      industry: 'SaaS',
      stage: 'Series A',
      monthlyGrowth: 28,
      investorInterest: 41,
      aiScore: 88,
      reason: 'Strong product-market fit in a growing SaaS market'
    }
  ],
  dealFlowStartups: [
    {
      _id: '1',
      name: 'Nexus AI',
      tagline: 'AI-powered pitch deck generator',
      industry: 'AI/ML',
      stage: 'Seed',
      monthlyGrowth: 24,
      investorInterest: 42,
      aiScore: 87,
      oneLinePitch: 'AI-powered pitch deck generator'
    },
    {
      _id: '2',
      name: 'BlockVault',
      tagline: 'Blockchain treasury management',
      industry: 'Fintech',
      stage: 'Pre-seed',
      monthlyGrowth: 18,
      investorInterest: 35,
      aiScore: 81,
      oneLinePitch: 'Blockchain-based treasury management for startups'
    },
    {
      _id: '3',
      name: 'GreenLeaf',
      tagline: 'Carbon footprint tracking',
      industry: 'GreenTech',
      stage: 'Series A',
      monthlyGrowth: 31,
      investorInterest: 48,
      aiScore: 89,
      oneLinePitch: 'Carbon footprint tracking platform'
    },
    {
      _id: '4',
      name: 'HealthSync',
      tagline: 'Patient data synchronization',
      industry: 'Healthcare',
      stage: 'Seed',
      monthlyGrowth: 22,
      investorInterest: 38,
      aiScore: 84,
      oneLinePitch: 'Patient data synchronization platform'
    }
  ],
  pitchFeed: [
    {
      _id: '1',
      startupName: 'Nexus AI',
      founderName: 'Sarah Chen',
      summary: 'AI-powered pitch deck generator with 24% MoM growth',
      traction: '1,247 users, $45K MRR'
    },
    {
      _id: '2',
      startupName: 'BlockVault',
      founderName: 'Marcus Johnson',
      summary: 'Blockchain-based treasury management for startups',
      traction: '892 users, 18% MoM growth'
    }
  ],
  trendingInsights: [
    { hashtag: '#AI', trend: 'Hot', count: 234 },
    { hashtag: '#FinTech', trend: 'Rising', count: 189 },
    { hashtag: '#SaaS', trend: 'Steady', count: 176 },
    { hashtag: '#ClimateTech', trend: 'Hot', count: 152 },
    { hashtag: '#HealthcareAI', trend: 'Rising', count: 134 }
  ],
  activityFeed: [
    { type: 'save', title: 'Saved Nexus AI to watchlist', date: new Date(Date.now() - 3600000 * 2) },
    { type: 'view', title: 'Viewed BlockVault startup profile', date: new Date(Date.now() - 3600000 * 5) },
    { type: 'contact', title: 'Contacted Sarah Chen (Nexus AI)', date: new Date(Date.now() - 86400000 * 1) },
    { type: 'review', title: 'Reviewed 5 startup pitches', date: new Date(Date.now() - 86400000 * 2) }
  ]
};

export default function InvestorDashboard() {
  const { user, setUser, loading, token } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [data, setData] = useState(demoData);
  const [savedStartups, setSavedStartups] = useState([]);
  const [requestedStartups, setRequestedStartups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [openToInvest, setOpenToInvest] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('overview'); // 'overview' or 'portal'

  // Sync with user's profile open_to_invest setting
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!user.profileCompleted && !user.isProfileComplete) {
      router.push('/profile/setup');
      return;
    }

    if (user.role !== 'investor') {
      if (user.role === 'founder') {
        router.push('/dashboard/founder');
      } else if (user.role === 'user' || user.role === 'job_seeker') {
        router.push('/dashboard/user');
      } else {
        router.push('/profile/setup');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.roleProfile) {
      setOpenToInvest(user.roleProfile.open_to_invest !== false);
    }
  }, [user]);

  const handleToggleOpenToInvest = async () => {
    if (!token || togglingOpen) return;
    setTogglingOpen(true);
    try {
      const nextVal = !openToInvest;
      const res = await fetch(`${API_URL}/api/investor/toggle-open`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ open_to_invest: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        setOpenToInvest(nextVal);
        addToast(nextVal ? 'You are now open to invest!' : 'Investor discovery is now hidden.', 'success');
        
        // Update user state locally
        const updatedUser = {
          ...user,
          roleProfile: {
            ...user.roleProfile,
            open_to_invest: nextVal
          }
        };
        setUser(updatedUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        addToast(data.error || 'Failed to toggle status', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error toggling investor status', 'error');
    } finally {
      setTogglingOpen(false);
    }
  };

  // Fetch watchlist on mount
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSavedStartups(data.data.map(s => s._id));
        }
      } catch (error) {
        console.error('Watchlist fetch error:', error);
      }
    };
    fetchWatchlist();
  }, [token]);

  const handleInterested = (startup) => {
    setSelectedStartup(startup);
    setModalOpen(true);
  };

  const handleToggleWatchlist = (startupId, isSaved) => {
    if (isSaved) {
      setSavedStartups(prev => [...prev, startupId]);
    } else {
      setSavedStartups(prev => prev.filter(id => id !== startupId));
    }
  };

  const handleView = (startup) => {
    router.push(`/startups/${startup._id}`);
  };

  const handleModalClose = (success) => {
    if (success && selectedStartup) {
      setRequestedStartups(prev => [...prev, selectedStartup._id]);
    }
    setModalOpen(false);
    setSelectedStartup(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center font-bold text-2xl text-green-600 border-4 border-white shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'I'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-heading">Investor Dashboard</h1>
                  {user?.isEmailVerified && (
                    <span title="Email Verified" className="p-1 bg-blue-100 text-blue-600 rounded-full">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  )}
                  {user?.investorVerificationStatus === 'approved' && (
                    <span title="Identity Verified" className="p-1 bg-green-100 text-green-600 rounded-full">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                  )}
                </div>
                <p className="text-body mt-1">Welcome back, {user?.name}. Discover, track, and invest in the next generation of startups.</p>
              </div>
            </div>
            {/* Availability Toggle Switch */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status:</span>
              <button
                onClick={handleToggleOpenToInvest}
                disabled={togglingOpen}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border ${
                  openToInvest 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <div className={`h-2 w-2 rounded-full ${openToInvest ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {openToInvest ? 'Open to Invest Now' : 'Not Open / Hidden'}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/startups" className="btn-primary flex items-center gap-1">
              <Rocket className="h-4 w-4" />
              Explore Startups
            </Link>
            <Link href="/dashboard/investor/watchlist" className="btn-secondary flex items-center gap-1">
              <Heart className="h-4 w-4" />
              Watchlist
            </Link>
          </div>
        </div>

        {/* Main Tab Selector */}
        <div className="flex border-b border-gray-200 mb-8 gap-2">
          <button
            onClick={() => setActiveMainTab('overview')}
            className={`px-4 py-2 border-b-2 font-bold text-sm transition-all ${
              activeMainTab === 'overview' ? 'border-primary text-primary font-sans' : 'border-transparent text-slate-500 hover:text-slate-700 font-sans'
            }`}
          >
            Explore Startups
          </button>
          <button
            onClick={() => setActiveMainTab('portal')}
            className={`px-4 py-2 border-b-2 font-bold text-sm transition-all ${
              activeMainTab === 'portal' ? 'border-primary text-primary font-sans' : 'border-transparent text-slate-500 hover:text-slate-700 font-sans'
            }`}
          >
            Investment Portfolio Portal
          </button>
        </div>

        {activeMainTab === 'overview' ? (
          <>
            <InvestorAnalytics analytics={data.analytics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
            <StartupDealFlow 
              startups={data.dealFlowStartups} 
              onInterested={handleInterested}
              onToggleWatchlist={handleToggleWatchlist}
              onView={handleView}
              savedStartups={savedStartups}
              requestedStartups={requestedStartups}
            />
          </div>
          
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="card p-6 bg-white border border-gray-150 rounded-2xl shadow-sm">
              <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 uppercase tracking-wide mb-4">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="flex flex-col gap-2.5">
                {user && user.investorVerificationStatus !== 'approved' && (
                  <Link
                    href="/dashboard/verification-center"
                    className="flex items-center justify-between p-3 bg-green-50/50 hover:bg-green-50 border border-green-100 rounded-xl transition text-xs font-bold text-green-700"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      {user.investorVerificationStatus === 'pending' ? 'Verification Pending' : 'Get Verified Badge'}
                    </span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
                <Link
                  href="/inbox"
                  className="flex items-center justify-between p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition text-xs font-bold text-blue-700"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Open Mailbox
                  </span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <AIInvestmentAssistant recommendations={data.aiRecommendations} />
            <PitchFeed pitches={data.pitchFeed} />
            <TrendingInsights insights={data.trendingInsights} />
            <InvestorActivityFeed activity={data.activityFeed} />
          </div>
        </div>
          </>
        ) : (
          <InvestorPortal />
        )}
      </main>

      {/* Send Interest Request Modal */}
      <SendInterestRequestModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        startup={selectedStartup}
      />
    </div>
  );
}
