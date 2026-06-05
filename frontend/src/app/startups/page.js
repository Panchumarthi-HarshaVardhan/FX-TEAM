'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  TrendingUp, 
  Rocket,
  Sparkles,
  Loader,
  Calendar,
  DollarSign,
  Clock,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SendInterestRequestModal from '../../components/SendInterestRequestModal';
import { API_URL } from '@/utils/api';

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== 'string' || src.trim() === '') return null;
  return src;
};

const renderLocation = (location) => {
  if (!location) return 'Remote';
  if (typeof location === 'string') return location;
  return location.remote ? 'Remote' : `${location.city || ''}${location.city && location.country ? ', ' : ''}${location.country || ''}`;
};

// Startup Card Component
function StartupCard({ startup, onFollow, onSave, onViewJobs, onShowInterest, onMessageFounder, currentUser }) {
  const logoSrc = getSafeImageSrc(startup.logo);
  const founderName = startup.founderId?.name || startup.founder?.name || 'Unknown Founder';
  
  const permissions = startup.permissions || {};
  const isFollowing = permissions.canFollowed;
  const isSaved = permissions.canSaved;
  const hasJobs = startup.jobs && startup.jobs.length > 0;
  
  const [loadingAction, setLoadingAction] = useState(null);

  const handleFollowClick = async (e) => {
    e.preventDefault();
    setLoadingAction('follow');
    await onFollow(startup._id, isFollowing);
    setLoadingAction(null);
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    setLoadingAction('save');
    await onSave(startup._id, isSaved);
    setLoadingAction(null);
  };

  return (
    <div className="card p-0 overflow-hidden h-full flex flex-col group hover:shadow-lg transition bg-white rounded-3xl border border-slate-200/60 shadow-sm">
      {/* Card Header with Logo */}
      <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
        <div className="absolute top-4 right-4 flex gap-1.5">
          {permissions.canSave && (
            <button 
              onClick={handleSaveClick} 
              disabled={loadingAction === 'save'}
              className={`p-1.5 rounded-lg border transition shadow-sm ${
                isSaved 
                  ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' 
                  : 'bg-white/80 backdrop-blur-sm text-slate-400 border-slate-200 hover:text-amber-500'
              }`}
              title={isSaved ? "Unsave Startup" : "Save Startup"}
            >
              ★
            </button>
          )}
          <span className="px-2.5 py-1 bg-white/80 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-600 rounded-lg shadow-sm">
            {startup.stage}
          </span>
        </div>
        <div className="absolute -bottom-6 left-6">
          <div className="h-16 w-16 rounded-xl bg-white shadow-md p-1 border border-gray-150 flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt={startup.name} className="h-full w-full object-contain rounded-lg" />
            ) : (
              <div className="h-full w-full bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl">
                {startup.name?.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-8 px-6 pb-6 flex-1 flex flex-col">
        <div className="mb-1">
          <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition line-clamp-1">{startup.name}</h3>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mt-0.5">{startup.industry}</p>
        </div>
        
        <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-2 mb-4 mt-2 flex-1">
          {startup.oneLinePitch}
        </p>

        <div className="space-y-1.5 mb-4 text-xs">
          <p className="text-slate-400 font-semibold">
            Founder: <span className="font-bold text-slate-700">{founderName}</span>
          </p>
          
          <div className="flex items-center text-slate-400 font-semibold gap-4">
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <span className="truncate max-w-[120px]">{renderLocation(startup.location)}</span>
            </div>
            <span className="text-slate-400">
              {(startup.followers?.length || 0)} followers
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-100 mb-4">
          <div className="flex items-center text-slate-555">
            <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
            <span>{startup.views || 0} views</span>
          </div>
          <span className="text-primary font-bold">
            {startup.fundingRequired > 0 && currentUser?.role !== 'user' && currentUser?.role !== 'job_seeker' ? `$${(startup.fundingRequired / 1000).toFixed(0)}K needed` : 'Bootstrapped'}
          </span>
        </div>

        {/* Actions Section */}
        <div className="space-y-2 mt-auto">
          <div className="flex gap-2">
            <Link 
              href={`/startups/${startup._id}`} 
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition text-center"
            >
              View Startup
            </Link>
            
            {permissions.canFollow && (
              <button 
                onClick={handleFollowClick}
                disabled={loadingAction === 'follow'}
                className={`flex-1 font-bold text-xs rounded-xl transition border ${
                  isFollowing
                    ? 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 shadow-sm'
                }`}
              >
                {loadingAction === 'follow' ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {permissions.canViewJobs && hasJobs && (
              <button 
                onClick={() => onViewJobs(startup)}
                className="flex-1 px-3 py-2 bg-emerald-50 border border-emerald-150 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition"
              >
                View Jobs ({startup.jobs.length})
              </button>
            )}

            {permissions.canInvest && currentUser?.role !== 'user' && currentUser?.role !== 'job_seeker' && (
              <button 
                onClick={() => onShowInterest(startup)}
                className="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition"
              >
                Show Interest
              </button>
            )}
          </div>

          {permissions.canManage && (
            <div className="flex gap-2 pt-1">
              <Link 
                href={`/dashboard/founder`} 
                className="flex-1 px-3 py-2 bg-amber-50 border border-amber-150 text-amber-700 font-bold text-xs rounded-xl hover:bg-amber-100 transition text-center"
              >
                Manage Startup
              </Link>
            </div>
          )}

          {/* Messaging Block */}
          {currentUser && (currentUser._id.toString() !== startup.founderId?._id?.toString() && currentUser._id.toString() !== startup.founderId?.toString()) && (
            <div className="pt-1">
              {permissions.canMessageFounder ? (
                <button 
                  onClick={() => onMessageFounder(startup.founderId?._id || startup.founderId)}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-150 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition"
                >
                  Message Founder
                </button>
              ) : (
                <div className="group/tooltip relative">
                  <button 
                    disabled 
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed"
                  >
                    Message Founder 🔒
                  </button>
                  <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-slate-900 text-white text-[10px] font-medium p-2.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition duration-150 text-center leading-normal z-20">
                    Messaging unlocks after your application is accepted or when both users follow each other.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Startup Section Component
function StartupSection({ title, icon: Icon, startups, onFollow, onSave, onViewJobs, onShowInterest, onMessageFounder, currentUser }) {
  if (startups.length === 0) return null;
  
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="h-6 w-6 text-indigo-600" />}
        <h2 className="text-xl font-black text-slate-950 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {startups.map(startup => (
          <StartupCard 
            key={startup._id} 
            startup={startup} 
            onFollow={onFollow}
            onSave={onSave}
            onViewJobs={onViewJobs}
            onShowInterest={onShowInterest}
            onMessageFounder={onMessageFounder}
            currentUser={currentUser}
          />
        ))}
      </div>
    </section>
  );
}

export default function StartupsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [sortFilter, setSortFilter] = useState('recently_created');
  
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, token } = useAuth();

  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);

  // Job Modal states
  const [jobsModalOpen, setJobsModalOpen] = useState(false);
  const [activeStartupJobs, setActiveStartupJobs] = useState(null);
  const [applyingJob, setApplyingJob] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  
  // Custom job application form matching Job Seeker requirements
  const [applicationForm, setApplicationForm] = useState({
    resume: '',
    coverLetter: '',
    portfolioLink: '',
    github: '',
    linkedin: '',
    expectedSalary: '',
    availabilityDate: '',
    reasonToJoin: ''
  });
  const [submittingApp, setSubmittingApp] = useState(false);

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
    'SaaS', 'AI/ML', 'Blockchain', 'CleanTech', 'FoodTech', 
    'Fashion', 'Real Estate', 'Transportation', 'Other'
  ];

  // Debouncing search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Debouncing location filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocationFilter(locationFilter);
    }, 400);
    return () => clearTimeout(handler);
  }, [locationFilter]);

  // Fetch startups on state updates
  useEffect(() => {
    fetchStartups();
  }, [token, debouncedSearchTerm, industryFilter, stageFilter, debouncedLocationFilter, verifiedFilter, sortFilter]);

  // Fetch applications
  useEffect(() => {
    if (token && (user?.role === 'user' || user?.role === 'job_seeker')) {
      fetchAppliedJobs();
    }
  }, [token, user]);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const queryParams = new URLSearchParams();
      if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);
      if (industryFilter && industryFilter !== 'All') queryParams.append('industry', industryFilter);
      if (stageFilter && stageFilter !== 'All') queryParams.append('stage', stageFilter);
      if (debouncedLocationFilter) queryParams.append('location', debouncedLocationFilter);
      if (verifiedFilter) queryParams.append('verified', 'true');
      if (sortFilter) queryParams.append('sort', sortFilter);

      const res = await fetch(`${API_URL}/api/startups?${queryParams.toString()}`, { headers });
      const data = await res.json();
      if (data.success) {
        setStartups(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch startups');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch startups');
    } finally {
      setLoading(false);
    }
  };

  const handleAiFilterSubmit = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/startups/ai-filter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: aiQuery })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const filters = data.data;
        
        // Update all filter states
        if (filters.industry) {
          const matchedInd = industries.find(ind => ind.toLowerCase() === filters.industry.toLowerCase()) || filters.industry;
          setIndustryFilter(matchedInd);
        } else {
          setIndustryFilter('All');
        }
        
        setStageFilter(filters.stage || 'All');
        setLocationFilter(filters.location || '');
        setVerifiedFilter(!!filters.verified);
        setSortFilter(filters.sort || 'recently_created');
        setSearchTerm(filters.search || '');
        
        setIsFilterActive(true);
        addToast('AI filters applied successfully!', 'success');
      } else {
        addToast(data.error || 'AI filter failed. Falling back to keyword search.', 'warning');
        setSearchTerm(aiQuery);
      }
    } catch (err) {
      console.error(err);
      addToast('AI filter service unavailable. Falling back to keyword search.', 'warning');
      setSearchTerm(aiQuery);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAiMode = () => {
    setIsAiMode(!isAiMode);
    if (!isAiMode) {
      setAiQuery(searchTerm);
    } else {
      setSearchTerm(aiQuery);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setIndustryFilter('All');
    setStageFilter('All');
    setLocationFilter('');
    setVerifiedFilter(false);
    setSortFilter('recently_created');
    setIsAiMode(false);
    setAiQuery('');
    setIsFilterActive(false);
    addToast('Filters cleared', 'success');
  };


  const fetchAppliedJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        const ids = json.data.map(app => app.jobId?._id || app.jobId);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      console.error('Error fetching applications status:', err);
    }
  };

  const handleFollow = async (startupId, isFollowing) => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/startups/${startupId}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast(isFollowing ? 'Unfollowed startup' : 'Following startup!', 'success');
        fetchStartups();
      } else {
        addToast(data.error || 'Failed to update follow status', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update follow status', 'error');
    }
  };

  const handleSave = async (startupId, isSaved) => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`${API_URL}/api/startups/${startupId}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast(isSaved ? 'Startup unsaved' : 'Startup saved to bookmarks!', 'success');
        fetchStartups();
      } else {
        addToast(data.error || 'Failed to update save status', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to update save status', 'error');
    }
  };

  const handleMessageFounder = (founderId) => {
    // Fixed query param from 'recipient' to 'userId' for correct redirection
    router.push(`/messages?userId=${founderId}`);
  };

  const handleShowInterest = (startup) => {
    setSelectedStartup(startup);
    setInterestModalOpen(true);
  };

  const handleOpenJobs = (startup) => {
    setActiveStartupJobs(startup);
    setJobsModalOpen(true);
    setApplyingJob(null);
  };

  const handleApplyClick = (job) => {
    setApplyingJob(job);
    
    // Prefill application form using job seeker profile data if present
    const profile = user?.jobSeekerProfile || {};
    setFormValues(profile);
  };

  const setFormValues = (profile) => {
    setApplicationForm({
      resume: profile.resume || '',
      coverLetter: '',
      portfolioLink: profile.portfolioLink || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      expectedSalary: profile.expectedSalary || '',
      availabilityDate: '',
      reasonToJoin: ''
    });
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setSubmittingApp(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs/${applyingJob._id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(applicationForm)
      });
      const data = await res.json();
      if (data.success) {
        addToast('Application submitted successfully!', 'success');
        setApplyingJob(null);
        setJobsModalOpen(false);
        fetchAppliedJobs();
      } else {
        addToast(data.error || 'Failed to submit application', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to submit application', 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const isSearchOrFilterActive = 
    searchTerm.trim() !== '' ||
    industryFilter !== 'All' ||
    stageFilter !== 'All' ||
    locationFilter.trim() !== '' ||
    verifiedFilter ||
    isFilterActive;

  const filteredStartups = startups;

  // Sorting logics:
  const trendingStartups = [...startups]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  const newLaunches = [...startups]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  const aiRecommended = [...startups]
    .sort((a, b) => (b.metrics?.investorInterest || 0) - (a.metrics?.investorInterest || 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        
        {/* Header & Search / Filters Card */}
        <div className="flex flex-col mb-8 gap-6 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgba(15,23,42,0.02)]">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Discover the next unicorn 🚀</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Find and connect with promising startups and apply to roles matching your skills.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full md:w-[600px] gap-2 items-center">
              <div className="relative flex-1 w-full font-semibold">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isAiMode ? "Ask AI: e.g. 'show verified AI startups'..." : "Search startups by name, founder, industry, or pitch..."}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-semibold"
                  value={isAiMode ? aiQuery : searchTerm}
                  onChange={(e) => {
                    if (isAiMode) {
                      setAiQuery(e.target.value);
                    } else {
                      setSearchTerm(e.target.value);
                      setIsFilterActive(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isAiMode) handleAiFilterSubmit();
                    }
                  }}
                  suppressHydrationWarning={true}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={toggleAiMode}
                  suppressHydrationWarning={true}
                  className={`flex-1 sm:flex-initial px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                    isAiMode 
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className={`h-4 w-4 ${isAiMode ? 'animate-pulse' : ''}`} />
                  {isAiMode ? 'AI Mode' : 'AI Filter'}
                </button>
                {isAiMode && (
                  <button
                    onClick={handleAiFilterSubmit}
                    disabled={aiLoading}
                    suppressHydrationWarning={true}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-sm transition whitespace-nowrap"
                  >
                    {aiLoading ? 'Thinking...' : 'Apply'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center">
            {/* Industry Dropdown */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Industry</label>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition outline-none"
                value={industryFilter}
                suppressHydrationWarning={true}
                onChange={(e) => {
                  setIndustryFilter(e.target.value);
                  setIsFilterActive(true);
                }}
              >
                <option value="All">All Industries</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Stage Dropdown */}
            <div className="flex flex-col min-w-[120px]">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Stage</label>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition outline-none"
                value={stageFilter}
                suppressHydrationWarning={true}
                onChange={(e) => {
                  setStageFilter(e.target.value);
                  setIsFilterActive(true);
                }}
              >
                <option value="All">All Stages</option>
                <option value="idea">Idea Stage</option>
                <option value="mvp">MVP / Prototype</option>
                <option value="first_customer">First Customer</option>
                <option value="revenue">Generating Revenue</option>
                <option value="funded">Funded</option>
              </select>
            </div>

            {/* Location Input */}
            <div className="flex flex-col min-w-[150px] flex-1 sm:flex-initial">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Location</label>
              <input
                type="text"
                placeholder="e.g. Remote, Mumbai..."
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition outline-none"
                value={locationFilter}
                suppressHydrationWarning={true}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setIsFilterActive(true);
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex flex-col min-w-[150px]">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Sort By</label>
              <select
                className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition outline-none"
                value={sortFilter}
                suppressHydrationWarning={true}
                onChange={(e) => {
                  setSortFilter(e.target.value);
                  setIsFilterActive(true);
                }}
              >
                <option value="recently_created">Recently Created</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_followed">Most Followed</option>
              </select>
            </div>

            {/* Verified Checkbox */}
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <input
                type="checkbox"
                id="verifiedFilter"
                suppressHydrationWarning={true}
                className="w-4 h-4 text-primary bg-slate-50 border-slate-200 rounded focus:ring-primary/20"
                checked={verifiedFilter}
                onChange={(e) => {
                  setVerifiedFilter(e.target.checked);
                  setIsFilterActive(true);
                }}
              />
              <label htmlFor="verifiedFilter" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                Verified Only
              </label>
            </div>

            {/* Clear Filters Button */}
            {(industryFilter !== 'All' || stageFilter !== 'All' || locationFilter !== '' || sortFilter !== 'recently_created' || verifiedFilter || searchTerm !== '' || isAiMode || isFilterActive) && (
              <button
                onClick={clearAllFilters}
                suppressHydrationWarning={true}
                className="mt-4 sm:mt-0 ml-auto px-4 py-2 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60">
            <h3 className="text-sm font-extrabold text-red-500">{error}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">Please try again later.</p>
          </div>
        ) : startups.length === 0 && !isSearchOrFilterActive ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60">
            <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              No public startups yet. Be the first founder to launch.
            </h3>
          </div>
        ) : isSearchOrFilterActive ? (
          filteredStartups.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60">
              <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                No startups found
              </h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filters</p>
              <button 
                onClick={clearAllFilters}
                className="mt-4 px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Search className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-black text-slate-950 uppercase tracking-wide">Search Results ({filteredStartups.length})</h2>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStartups.map(startup => (
                  <StartupCard 
                    key={startup._id} 
                    startup={startup} 
                    onFollow={handleFollow}
                    onSave={handleSave}
                    onViewJobs={handleOpenJobs}
                    onShowInterest={handleShowInterest}
                    onMessageFounder={handleMessageFounder}
                    currentUser={user}
                  />
                ))}
              </div>
            </section>
          )
        ) : (
          <>
            <StartupSection 
              title="Trending Startups" 
              icon={TrendingUp} 
              startups={trendingStartups} 
              onFollow={handleFollow}
              onSave={handleSave}
              onViewJobs={handleOpenJobs}
              onShowInterest={handleShowInterest}
              onMessageFounder={handleMessageFounder}
              currentUser={user}
            />

            <StartupSection 
              title="New Launches" 
              icon={Rocket} 
              startups={newLaunches} 
              onFollow={handleFollow}
              onSave={handleSave}
              onViewJobs={handleOpenJobs}
              onShowInterest={handleShowInterest}
              onMessageFounder={handleMessageFounder}
              currentUser={user}
            />

            <StartupSection 
              title="AI Recommended" 
              icon={Sparkles} 
              startups={aiRecommended} 
              onFollow={handleFollow}
              onSave={handleSave}
              onViewJobs={handleOpenJobs}
              onShowInterest={handleShowInterest}
              onMessageFounder={handleMessageFounder}
              currentUser={user}
            />

            {/* All Startups section when no search/filters are active */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Rocket className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-950 uppercase tracking-wide">All Startups ({startups.length})</h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {startups.map(startup => (
                  <StartupCard 
                    key={startup._id} 
                    startup={startup} 
                    onFollow={handleFollow}
                    onSave={handleSave}
                    onViewJobs={handleOpenJobs}
                    onShowInterest={handleShowInterest}
                    onMessageFounder={handleMessageFounder}
                    currentUser={user}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <SendInterestRequestModal 
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        startup={selectedStartup}
      />

      {/* Jobs & Apply Modal */}
      {jobsModalOpen && activeStartupJobs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-150 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950">Jobs at {activeStartupJobs.name}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{activeStartupJobs.industry} • {renderLocation(activeStartupJobs.location)}</p>
              </div>
              <button 
                onClick={() => setJobsModalOpen(false)} 
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {!applyingJob ? (
                (activeStartupJobs.jobs || []).map((job) => {
                  const hasApplied = appliedJobIds.includes(job._id);
                  return (
                    <div key={job._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{job.title}</h4>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">{job.roleType || job.type} • {job.location || 'Remote'}</p>
                        </div>
                        {job.salary && (
                          <span className="text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-sm">
                            {job.salary}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                          {job.description}
                        </p>
                      )}
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {job.skills.map((skill, index) => (
                            <span key={index} className="px-2 py-0.5 bg-white border border-slate-150 text-slate-600 font-bold text-[9px] rounded-lg">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        {hasApplied ? (
                          <button
                            disabled
                            className="px-4 py-1.5 bg-green-50 text-green-700 border border-green-205 font-bold text-xs rounded-xl cursor-not-allowed flex items-center gap-1"
                          >
                            ✓ Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApplyClick(job)}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <p className="text-xs text-indigo-900 font-bold">Applying for: <span className="text-slate-900">{applyingJob.title}</span></p>
                    <button 
                      type="button" 
                      onClick={() => setApplyingJob(null)}
                      className="text-[10px] text-indigo-600 font-extrabold hover:underline mt-1 block font-sans"
                    >
                      ← Back to job listings
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Resume Link</label>
                    <input
                      type="text"
                      required
                      placeholder="Resume URL link (Google Drive, Dropbox etc.)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                      value={applicationForm.resume}
                      onChange={(e) => setApplicationForm({...applicationForm, resume: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Expected Stipend/Salary</label>
                      <input
                        type="text"
                        placeholder="e.g. $500/mo, $50,000/yr"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                        value={applicationForm.expectedSalary}
                        onChange={(e) => setApplicationForm({...applicationForm, expectedSalary: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Availability Date</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none font-sans"
                        value={applicationForm.availabilityDate}
                        onChange={(e) => setApplicationForm({...applicationForm, availabilityDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Portfolio</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                        value={applicationForm.portfolioLink}
                        onChange={(e) => setApplicationForm({...applicationForm, portfolioLink: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">GitHub</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                        value={applicationForm.github}
                        onChange={(e) => setApplicationForm({...applicationForm, github: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">LinkedIn</label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                        value={applicationForm.linkedin}
                        onChange={(e) => setApplicationForm({...applicationForm, linkedin: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Why do you want to join this startup?</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Brief statement on your interest and fit..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                      value={applicationForm.reasonToJoin}
                      onChange={(e) => setApplicationForm({...applicationForm, reasonToJoin: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 font-sans">Cover Letter / Message (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Add any extra details or comments..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                      value={applicationForm.coverLetter}
                      onChange={(e) => setApplicationForm({...applicationForm, coverLetter: e.target.value})}
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setApplyingJob(null)}
                      className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:bg-slate-300"
                    >
                      {submittingApp ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
