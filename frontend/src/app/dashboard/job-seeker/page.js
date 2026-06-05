'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  FileText, 
  DollarSign, 
  Clock, 
  Rocket, 
  CheckCircle2, 
  ExternalLink,
  Award,
  Globe,
  Loader,
  X,
  Users,
  Bookmark,
  Bell,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../../context/ToastContext';
import { API_URL } from '@/utils/api';

// Inline SVG components to replace missing lucide-react brand icons
const Linkedin = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Github = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function JobSeekerDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities', 'applications', 'teams', 'saved', 'notifications'
  const [startups, setStartups] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Dashboard states
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [myTeams, setMyTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [savedStartups, setSavedStartups] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loadingRoleReqs, setLoadingRoleReqs] = useState(true);

  // Role and setup complete protection check
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

    if (user.role !== 'job_seeker') {
      if (user.role === 'founder') {
        router.push('/dashboard/founder');
      } else if (user.role === 'investor') {
        router.push('/dashboard/investor');
      } else {
        router.push('/profile/setup');
      }
    }
  }, [user, loading, router]);

  // Fetch data on mount / tab switch
  useEffect(() => {
    if (user && token) {
      fetchJobsAndStartups();
      fetchApplications();
      fetchTeams();
      fetchSavedStartups();
      fetchNotifications();
      fetchRoleRequests();
    }
  }, [user, token]);

  const fetchJobsAndStartups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/startups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const extracted = json.data.map(item => item.startup || item);
        setStartups(extracted);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/job-seeker/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/job-seeker/role-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRoleRequests(json.data);
      }
    } catch (err) {
      console.error('Error fetching role requests:', err);
    } finally {
      setLoadingRoleReqs(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${API_URL}/api/job-seeker/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMyTeams(json.data);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoadingTeams(false);
    }
  };

  const fetchSavedStartups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/job-seeker/saved-startups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSavedStartups(json.data);
      }
    } catch (err) {
      console.error('Error fetching saved startups:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleWithdraw = async (appId) => {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_URL}/api/job-seeker/applications/${appId}/withdraw`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('Application withdrawn successfully', 'success');
        fetchApplications();
      } else {
        addToast(json.error || 'Failed to withdraw application', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error withdrawing application', 'error');
    }
  };

  const markNotificationRead = async (notifId) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user || user.role !== 'job_seeker') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const profile = user.jobSeekerProfile || user.roleProfile || {};

  // Flatten startup jobs to list them dynamically
  const jobsList = startups.flatMap(startup => 
    (startup.jobs || []).map(job => ({
      ...job,
      startupId: startup._id,
      startupName: startup.name,
      startupLogo: startup.logo,
      startupIndustry: startup.industry,
      founderId: startup.founderId?._id || startup.founderId
    }))
  );

  const appliedJobIds = applications.map(app => app.jobId?._id || app.jobId);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-750 border-yellow-200';
      case 'reviewed': return 'bg-blue-50 text-blue-750 border-blue-200';
      case 'shortlisted': return 'bg-purple-50 text-purple-750 border-purple-200';
      case 'connected': return 'bg-cyan-50 text-cyan-755 border-cyan-200';
      case 'accepted': return 'bg-green-50 text-green-750 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-750 border-red-200';
      case 'hired': return 'bg-emerald-500 text-white border-emerald-500';
      case 'withdrawn': return 'bg-gray-100 text-gray-500 border-gray-250';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgba(15,23,42,0.02)] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-indigo-500" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">Welcome, {user.fullName || user.name} 👋</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Discover early-stage startups and apply to roles matching your skills.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5 shadow-sm font-bold">
              <User className="h-4 w-4" /> Edit Profile
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Left side) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none gap-2 pb-px">
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'opportunities'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Rocket className="h-4 w-4" />
                Opportunities
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'applications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase className="h-4 w-4" />
                My Applications ({applications.length})
              </button>

              <button
                onClick={() => setActiveTab('teams')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'teams'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                My Teams ({myTeams.length})
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'saved'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                Saved Startups ({savedStartups.length})
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'notifications'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bell className="h-4 w-4" />
                Notifications ({notifications.filter(n => !n.isRead).length})
              </button>

              <button
                onClick={() => setActiveTab('role_requests')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition ${
                  activeTab === 'role_requests'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                My Startup Requests ({roleRequests.length})
              </button>
            </div>

            {/* Tab content rendering */}
            
            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                    Open Jobs & Internships
                  </h2>
                  <span className="text-xs font-bold text-slate-400">{jobsList.length} Positions Available</span>
                </div>

                {loadingJobs ? (
                  <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200/60">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : jobsList.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200/65 text-center text-gray-500">
                    No active job listings.
                  </div>
                ) : (
                  jobsList.map((job) => {
                    const hasApplied = appliedJobIds.includes(job._id);
                    return (
                      <div key={job._id} className="bg-white p-6 rounded-2.5xl border border-slate-200/60 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650 overflow-hidden flex-shrink-0">
                              {job.startupLogo ? (
                                <img src={job.startupLogo} alt="Startup logo" className="h-full w-full object-cover" />
                              ) : (
                                job.startupName?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 leading-snug text-base hover:text-primary transition-colors">
                                {job.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <Link href={`/startups/${job.startupId}`} className="hover:underline text-slate-500">
                                  {job.startupName}
                                </Link>
                                <span>•</span>
                                <span className="text-indigo-600">{job.startupIndustry || 'Technology'}</span>
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-705 border border-indigo-100 rounded-full font-black text-[10px] uppercase tracking-wider">
                            {job.roleType || job.type}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">
                          {job.description}
                        </p>

                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {job.requiredSkills.map((skill, index) => (
                              <span key={index} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-slate-450" />
                            {job.salaryMin ? `$${Number(job.salaryMin).toLocaleString()}` : ''}
                            {job.salaryMax ? ` - $${Number(job.salaryMax).toLocaleString()}` : ''}
                            {!job.salaryMin && !job.salaryMax && (job.salary || 'Salary Undisclosed')}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedJob(job)}
                              className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                            >
                              View Details
                            </button>
                            {hasApplied ? (
                              <button
                                disabled
                                className="px-5 py-2 bg-green-50 border border-green-200 text-green-700 font-bold text-xs rounded-xl cursor-default"
                              >
                                Applied ✓
                              </button>
                            ) : (
                              <Link 
                                href={`/startups/${job.startupId}`}
                                className="px-5 py-2 bg-primary hover:bg-blue-650 text-white font-bold text-xs rounded-xl text-center transition shadow-sm"
                              >
                                View startup to Apply
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase">My Submitted Applications</h3>
                
                {loadingApps ? (
                  <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
                ) : applications.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                    <p className="font-semibold">No applications submitted yet.</p>
                    <p className="text-xs mt-1">Browse startups to find open roles and apply.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted font-semibold">
                            Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase rounded-full tracking-wider ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base font-sans">
                          {app.jobId?.title || 'Open Role'}
                        </h4>
                        <p className="text-xs text-primary font-bold">
                          Startup: <span className="underline">{app.startupId?.name}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
                        {['pending', 'reviewed', 'shortlisted'].includes(app.status) && (
                          <button
                            onClick={() => handleWithdraw(app._id)}
                            className="px-3.5 py-1.5 text-xs border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-lg transition"
                          >
                            Withdraw
                          </button>
                        )}

                        {['connected', 'accepted', 'hired'].includes(app.status) && (
                          <Link
                            href={`/messages?userId=${app.founderId?._id || app.founderId}`}
                            className="px-3.5 py-1.5 text-xs bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Message Founder
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase">My Startup Teams</h3>
                
                {loadingTeams ? (
                  <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
                ) : myTeams.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                    <p className="font-semibold">You haven&apos;t joined any startup team yet.</p>
                    <p className="text-xs mt-1">Once a founder accepts your application and hires you, the team details will show here.</p>
                  </div>
                ) : (
                  myTeams.map((team) => (
                    <div key={team._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-650 overflow-hidden flex-shrink-0 text-base">
                          {team.startupId?.logo ? (
                            <img src={team.startupId.logo} alt="Startup logo" className="h-full w-full object-cover" />
                          ) : (
                            team.startupId?.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base font-sans">{team.startupId?.name}</h4>
                          <p className="text-xs text-primary font-bold mt-0.5">
                            Role: {team.teamRole || team.role} • Joined {format(new Date(team.joinedAt || team.createdAt), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Founder: {team.startupId?.founderId?.name || 'Startup Founder'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 md:pt-0 w-full md:w-auto">
                        <Link
                          href={`/messages?userId=${team.startupId?.founderId?._id || team.startupId?.founderId}`}
                          className="flex-1 md:flex-none px-4 py-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border rounded-xl font-bold transition text-center"
                        >
                          Message Founder
                        </Link>
                        
                        <Link
                          href="/messages"
                          className="flex-1 md:flex-none px-4 py-2 text-xs bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition text-center shadow-sm flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Open Group Chat
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'saved' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase">Saved Startups</h3>
                
                {loadingSaved ? (
                  <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
                ) : savedStartups.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-slate-500">
                    <p className="font-semibold">No saved startups yet.</p>
                    <p className="text-xs mt-1">Bookmark startups on the startups discovery page to find them here easily.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {savedStartups.map((startup) => (
                      <div key={startup._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-105 rounded-xl flex items-center justify-center text-primary font-bold text-lg overflow-hidden border">
                              {startup.logo ? (
                                <img src={startup.logo} alt="Startup logo" className="h-full w-full object-cover" />
                              ) : (
                                startup.name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm font-sans">{startup.name}</h4>
                              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {startup.stage}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold line-clamp-2 mt-3 leading-relaxed">
                            {startup.oneLinePitch}
                          </p>
                        </div>
                        
                        <div className="flex justify-end pt-2 border-t mt-2">
                          <Link
                            href={`/startups/${startup._id}`}
                            className="px-3 py-1.5 bg-slate-50 border rounded-lg text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-950 uppercase">Recent Notifications</h3>
                
                {loadingNotifications ? (
                  <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
                ) : notifications.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-gray-500">
                    No new notifications.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        onClick={() => markNotificationRead(notif._id)}
                        className={`p-4 rounded-2xl border transition flex items-start gap-3 cursor-pointer ${
                          notif.isRead 
                            ? 'bg-white border-slate-150 hover:bg-slate-50' 
                            : 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50 shadow-xs'
                        }`}
                      >
                        <div className="h-2 w-2 rounded-full bg-indigo-650 mt-1.5 flex-shrink-0" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }}></div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-800 font-semibold leading-relaxed">{notif.message || notif.content}</p>
                          <span className="text-[10px] text-muted block mt-1">
                            {format(new Date(notif.createdAt), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'role_requests' && (
              <div className="space-y-4 font-sans">
                <h3 className="text-sm font-black text-slate-950 uppercase">My Startup Role Requests</h3>
                
                {loadingRoleReqs ? (
                  <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
                ) : roleRequests.length === 0 ? (
                  <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-gray-500">
                    <Sparkles className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-700">No startup role requests sent yet</p>
                    <p className="text-sm text-gray-400 mt-1">When you apply to join a startup with a custom role, it will show up here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {roleRequests.map((req) => (
                      <div key={req._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {req.requestType} request
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                              req.status === 'accepted' || req.status === 'hired' ? 'bg-green-50 text-green-700 border-green-200' :
                              req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                              req.status === 'connected' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-base mt-1">
                            {req.roleTitle}
                          </h4>
                          <p className="text-xs text-muted mt-0.5 font-semibold">
                            Startup: <span className="font-semibold text-slate-900">{req.startupId?.name}</span> • Sent on {format(new Date(req.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          <Link
                            href={`/startups/${req.startupId?._id}`}
                            className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold border border-slate-200 text-center transition"
                          >
                            View Startup
                          </Link>
                          {['connected', 'accepted', 'hired'].includes(req.status) ? (
                            <Link
                              href="/messages"
                              className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-center transition shadow-sm"
                            >
                              Message
                            </Link>
                          ) : (
                            <button
                              disabled
                              title="Messaging unlocks after founder connects with you or accepts your request."
                              className="flex-1 md:flex-none px-4 py-1.5 text-xs bg-slate-150 text-slate-400 rounded-lg font-bold border border-slate-200 cursor-not-allowed"
                            >
                              Locked
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Profile Status & Socials */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-slate-950 uppercase border-b border-slate-100 pb-3 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                Job Seeker Profile
              </h3>

              <div className="space-y-4 text-xs font-semibold text-slate-600">
                {profile.bio && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bio</span>
                    <p className="text-slate-800 leading-relaxed font-bold font-sans">{profile.bio}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Location</span>
                  <p className="text-slate-900 font-extrabold flex items-center gap-1 font-sans">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {profile.location || 'Not set'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expected Salary</span>
                  <p className="text-slate-900 font-extrabold flex items-center gap-1 font-sans">
                    <DollarSign className="h-3.5 w-3.5 text-slate-400" /> {profile.expectedSalary || 'Negotiable'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Job Type Preference</span>
                  <p className="text-slate-900 font-extrabold flex items-center gap-1 font-sans">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {profile.preferredJobType || 'Full-time'}
                  </p>
                </div>

                {profile.resume && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Resume / CV</span>
                    <a 
                      href={profile.resume} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1 font-sans"
                    >
                      <FileText className="h-4 w-4" /> View Resume <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {user.skills && user.skills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Skills list</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Social Connections */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {profile.linkedin && (
                  <a 
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition text-slate-500 hover:text-indigo-650"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.github && (
                  <a 
                    href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-350 transition text-slate-500 hover:text-slate-800"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {profile.portfolioLink && (
                  <a 
                    href={profile.portfolioLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-350 transition text-slate-500 hover:text-slate-800"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-150 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-950 font-sans">{selectedJob.title}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedJob.startupName} • {selectedJob.startupIndustry}</p>
              </div>
              <button 
                onClick={() => setSelectedJob(null)} 
                className="p-2 hover:bg-slate-50 rounded-xl transition"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto pr-2 flex-1">
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 font-sans">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-slate-400" /> {selectedJob.workMode} ({selectedJob.location || 'Remote'})</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-slate-400" /> {selectedJob.roleType || selectedJob.type}</span>
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4 text-slate-400" /> 
                  {selectedJob.salaryMin ? `$${Number(selectedJob.salaryMin).toLocaleString()}` : ''}
                  {selectedJob.salaryMax ? ` - $${Number(selectedJob.salaryMax).toLocaleString()}` : ''}
                  {!selectedJob.salaryMin && !selectedJob.salaryMax && (selectedJob.salary || 'Undisclosed')}
                </span>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-sans">Role Description</h4>
                <p className="text-xs leading-relaxed text-slate-655 font-semibold font-sans whitespace-pre-wrap">
                  {selectedJob.description}
                </p>
              </div>
              {selectedJob.requiredSkills && selectedJob.requiredSkills.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider font-sans">Desired Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requiredSkills.map((skill, index) => (
                      <span key={index} className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[10px] rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
              <button 
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                Close
              </button>
              {appliedJobIds.includes(selectedJob._id) ? (
                <button
                  disabled
                  className="px-6 py-2.5 bg-green-50 border border-green-200 text-green-700 font-bold text-xs rounded-xl shadow-sm"
                >
                  Applied ✓
                </button>
              ) : (
                <Link 
                  href={`/startups/${selectedJob.startupId}`}
                  onClick={() => setSelectedJob(null)}
                  className="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white rounded-xl text-center font-bold text-xs transition shadow-sm"
                >
                  Apply to Startup Role
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
