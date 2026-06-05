'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../context/ToastContext';
import Navbar from '../../../components/Navbar';
import { 
  Users, 
  TrendingUp, 
  Flag, 
  ShieldCheck, 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  Check, 
  X, 
  Loader, 
  AlertCircle, 
  FileText, 
  Video, 
  CheckCircle,
  ExternalLink,
  Info,
  Search,
  Filter,
  Trash2,
  LockKeyhole,
  CheckCircle2,
  Building,
  DollarSign,
  Menu,
  XCircle,
  Edit2
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const router = useRouter();

  // Navigation states
  const [activeMenu, setActiveMenu] = useState('dashboard'); // dashboard, users, startups, investors, applications, posts, reports, analytics, settings
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile'); // profile, password, config, notifications, theme, logout

  // Live Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // User Management States
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userVerifiedFilter, setUserVerifiedFilter] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  // Startup Management States
  const [startupsList, setStartupsList] = useState([]);
  const [loadingStartups, setLoadingStartups] = useState(false);
  const [startupSearch, setStartupSearch] = useState('');
  const [startupStageFilter, setStartupStageFilter] = useState('');
  const [startupVerifiedFilter, setStartupVerifiedFilter] = useState('');
  const [startupsPage, setStartupsPage] = useState(1);
  const [startupsTotalPages, setStartupsTotalPages] = useState(1);

  // Edit Startup Modal
  const [editingStartup, setEditingStartup] = useState(null);
  const [editStartupForm, setEditStartupForm] = useState({
    name: '',
    oneLinePitch: '',
    industry: '',
    stage: '',
    contactEmail: '',
    description: ''
  });

  // Investor Management States
  const [investorsList, setInvestorsList] = useState([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  // Applications Sourcing States
  const [appsList, setAppsList] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Posts & Reels States
  const [postsList, setPostsList] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Incident Reports States
  const [reportsList, setReportsList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Analytics Detailed Data State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // System Configuration Settings State
  const [sysSettings, setSysSettings] = useState({
    platformName: 'FounderX',
    allowSignups: true,
    maintenanceMode: false,
    enableAIAssistant: true,
    moderationLevel: 'medium',
    supportEmail: 'admin@founderx.com'
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Confirmation States
  const [confirmAction, setConfirmAction] = useState(null); // { type, id, label, execute }

  // Actioning item loading tracker
  const [actioningId, setActioningId] = useState(null);

  // Change Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.role !== 'admin') {
        addToast('Access denied. Administrator role required.', 'error');
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Fetch KPI Stats
  const fetchKPIStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('http://localhost:3000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading platform stats', 'error');
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const queryParams = new URLSearchParams({
        search: userSearch,
        role: userRoleFilter,
        isVerified: userVerifiedFilter,
        isActive: userStatusFilter,
        page: usersPage,
        limit: 10
      });
      const res = await fetch(`http://localhost:3000/api/admin/users?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setUsersList(json.data);
        setUsersTotalPages(json.pages || 1);
      }
    } catch (err) {
      console.error(err);
      addToast('Error listing user accounts', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Startups
  const fetchStartups = async () => {
    try {
      setLoadingStartups(true);
      const queryParams = new URLSearchParams({
        search: startupSearch,
        stage: startupStageFilter,
        isVerified: startupVerifiedFilter,
        page: startupsPage,
        limit: 10
      });
      const res = await fetch(`http://localhost:3000/api/admin/startups?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setStartupsList(json.data);
        setStartupsTotalPages(json.pages || 1);
      }
    } catch (err) {
      console.error(err);
      addToast('Error listing startups', 'error');
    } finally {
      setLoadingStartups(false);
    }
  };

  // Fetch Investors
  const fetchInvestors = async () => {
    try {
      setLoadingInvestors(true);
      const res = await fetch('http://localhost:3000/api/admin/investors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setInvestorsList(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading investor profiles', 'error');
    } finally {
      setLoadingInvestors(false);
    }
  };

  // Fetch Sourcing Applications
  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch('http://localhost:3000/api/admin/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAppsList(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching applications queue', 'error');
    } finally {
      setLoadingApps(false);
    }
  };

  // Fetch Newsfeed/Reels
  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetch('http://localhost:3000/api/admin/posts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setPostsList(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching community posts', 'error');
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch Reports Queue
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const res = await fetch('http://localhost:3000/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setReportsList(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading incident reports', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch Analytics detailed data
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch('http://localhost:3000/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error loading detailed analytics', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch settings config
  const fetchSystemSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('http://localhost:3000/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setSysSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching configurations', 'error');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Route load trigger depending on active selection
  useEffect(() => {
    if (user && token && user.role === 'admin') {
      if (activeMenu === 'dashboard') {
        fetchKPIStats();
      } else if (activeMenu === 'users') {
        fetchUsers();
      } else if (activeMenu === 'startups') {
        fetchStartups();
      } else if (activeMenu === 'investors') {
        fetchInvestors();
      } else if (activeMenu === 'applications') {
        fetchApplications();
      } else if (activeMenu === 'posts') {
        fetchPosts();
      } else if (activeMenu === 'reports') {
        fetchReports();
      } else if (activeMenu === 'analytics') {
        fetchAnalytics();
      } else if (activeMenu === 'settings') {
        fetchSystemSettings();
      }
    }
  }, [activeMenu, user, token]);

  // Trigger search filters
  useEffect(() => {
    if (activeMenu === 'users') {
      setUsersPage(1);
      fetchUsers();
    }
  }, [userRoleFilter, userStatusFilter, userVerifiedFilter]);

  useEffect(() => {
    if (activeMenu === 'startups') {
      setStartupsPage(1);
      fetchStartups();
    }
  }, [startupStageFilter, startupVerifiedFilter]);

  // Modifying User Status Actions
  const handleToggleBlock = async (userId) => {
    try {
      setActioningId(userId);
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast(json.data.isActive ? 'User account unblocked successfully' : 'User account blocked successfully', 'success');
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isActive: json.data.isActive } : u));
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating block status', 'error');
    } finally {
      setActioningId(null);
      setConfirmAction(null);
    }
  };

  const handleVerifyUser = async (userId, isVerified) => {
    try {
      setActioningId(userId);
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified })
      });
      const json = await res.json();
      if (json.success) {
        addToast(isVerified ? 'Verification badge assigned successfully' : 'Verification badge revoked', 'success');
        setUsersList(prev => prev.map(u => u._id === userId ? { ...u, isVerified: json.data.isVerified, verificationBadge: json.data.verificationBadge } : u));
      }
    } catch (err) {
      console.error(err);
      addToast('Error modifying user badge', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setActioningId(userId);
      const res = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('User deleted successfully', 'success');
        setUsersList(prev => prev.filter(u => u._id !== userId));
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting user record', 'error');
    } finally {
      setActioningId(null);
      setConfirmAction(null);
    }
  };

  // Modifying Startup Actions
  const handleVerifyStartup = async (startupId, isVerified) => {
    try {
      setActioningId(startupId);
      const res = await fetch(`http://localhost:3000/api/admin/startups/${startupId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified, status: isVerified ? 'verified' : 'rejected' })
      });
      const json = await res.json();
      if (json.success) {
        addToast(isVerified ? 'Startup profile verified' : 'Startup profile rejected/unverified', 'success');
        setStartupsList(prev => prev.map(s => s._id === startupId ? { ...s, isVerified: json.data.isVerified, verified: json.data.verified } : s));
      }
    } catch (err) {
      console.error(err);
      addToast('Error modifying startup verification status', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleEditStartupSubmit = async (e) => {
    e.preventDefault();
    if (!editingStartup) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/startups/${editingStartup._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editStartupForm)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Startup details updated successfully', 'success');
        setStartupsList(prev => prev.map(s => s._id === editingStartup._id ? { ...s, ...json.data } : s));
        setEditingStartup(null);
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating startup information', 'error');
    }
  };

  const handleDeleteStartup = async (startupId) => {
    try {
      setActioningId(startupId);
      const res = await fetch(`http://localhost:3000/api/admin/startups/${startupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('Startup deleted successfully', 'success');
        setStartupsList(prev => prev.filter(s => s._id !== startupId));
      }
    } catch (err) {
      console.error(err);
      addToast('Error deleting startup profile', 'error');
    } finally {
      setActioningId(null);
      setConfirmAction(null);
    }
  };

  // Verification Badge updates for investors
  const handleVerifyInvestor = async (investorId, isVerified) => {
    try {
      setActioningId(investorId);
      const res = await fetch(`http://localhost:3000/api/admin/investors/${investorId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified })
      });
      const json = await res.json();
      if (json.success) {
        addToast(isVerified ? 'Investor verification badge activated' : 'Investor verification badge removed', 'success');
        setInvestorsList(prev => prev.map(i => i._id === investorId ? { ...i, isVerified: json.data.isVerified, verificationBadge: json.data.verificationBadge } : i));
      }
    } catch (err) {
      console.error(err);
      addToast('Error setting investor verification status', 'error');
    } finally {
      setActioningId(null);
    }
  };

  // Applications tracking updates
  const handleUpdateAppStatus = async (appId, newStatus, appType) => {
    try {
      setActioningId(appId);
      const res = await fetch(`http://localhost:3000/api/admin/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, type: appType })
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Application status updated to ${newStatus}`, 'success');
        setAppsList(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating status', 'error');
    } finally {
      setActioningId(null);
    }
  };

  // Newsfeed spam delete action
  const handleDeletePost = async (postId) => {
    try {
      setActioningId(postId);
      const res = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('Post removed successfully', 'success');
        setPostsList(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error(err);
      addToast('Error removing post', 'error');
    } finally {
      setActioningId(null);
      setConfirmAction(null);
    }
  };

  // Incident reports updates
  const handleResolveReport = async (reportId, status) => {
    try {
      setActioningId(reportId);
      const res = await fetch(`http://localhost:3000/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Report status marked as ${status}`, 'success');
        setReportsList(prev => prev.map(r => r._id === reportId ? { ...r, status: json.data.status } : r));
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating incident status', 'error');
    } finally {
      setActioningId(null);
    }
  };

  // Change Admin Password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await fetch('http://localhost:3000/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Password updated successfully');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        addToast('Password successfully changed', 'success');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Network connection error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // System Configurations updates
  const handleUpdateSysSettings = async (e) => {
    e.preventDefault();
    try {
      setActioningId('settings');
      const res = await fetch('http://localhost:3000/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sysSettings)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Configurations saved successfully', 'success');
        setSysSettings(json.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating config details', 'error');
    } finally {
      setActioningId(null);
    }
  };

  // Redirect block if loading or unauthorized
  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sidebar elements
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'startups', label: 'Startups', icon: <Building className="w-5 h-5" /> },
    { id: 'investors', label: 'Investors', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'applications', label: 'Applications', icon: <FileText className="w-5 h-5" /> },
    { id: 'posts', label: 'Posts & Reels', icon: <Video className="w-5 h-5" /> },
    { id: 'reports', label: 'Incident Reports', icon: <Flag className="w-5 h-5" /> },
    { id: 'analytics', label: 'Platform Analytics', icon: <CheckCircle className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:text-slate-200 font-sans flex flex-col admin-panel">
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-6 pt-24">
        
        {/* Sidebar for Desktop / Collapsible for Mobile */}
        <aside className={`md:w-64 shrink-0 flex flex-col gap-1.5 p-4 bg-white border border-slate-200/80 rounded-3xl shadow-sm h-fit transition-all duration-300 md:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <span className="text-sm font-black text-slate-900 tracking-tight uppercase">Admin Panel</span>
            <button className="md:hidden p-1 text-slate-500 hover:text-slate-900" onClick={() => setMobileMenuOpen(false)}>
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-2xl text-xs font-bold text-left transition flex items-center gap-3 cursor-pointer ${
                  activeMenu === item.id 
                    ? 'bg-blue-500/10 text-primary shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <hr className="border-slate-100 my-2" />
            <button
              onClick={logout}
              className="w-full px-4 py-3 rounded-2xl text-xs font-bold text-left text-rose-500 hover:bg-rose-50 transition flex items-center gap-3 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Mobile Hamburger Trigger */}
        <div className="md:hidden flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-2xl shadow-sm mb-4">
          <span className="font-extrabold text-sm text-slate-900 capitalize">{activeMenu.replace('_', ' ')} Dashboard</span>
          <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        </div>

        {/* Main Panel Content */}
        <main className="flex-1 min-w-0">
          
          {/* Menu Loading state indicator */}
          {loadingStats && activeMenu === 'dashboard' && <LoaderOverlay />}
          {loadingUsers && activeMenu === 'users' && <LoaderOverlay />}
          {loadingStartups && activeMenu === 'startups' && <LoaderOverlay />}
          {loadingInvestors && activeMenu === 'investors' && <LoaderOverlay />}
          {loadingApps && activeMenu === 'applications' && <LoaderOverlay />}
          {loadingPosts && activeMenu === 'posts' && <LoaderOverlay />}
          {loadingReports && activeMenu === 'reports' && <LoaderOverlay />}
          {loadingAnalytics && activeMenu === 'analytics' && <LoaderOverlay />}
          {loadingSettings && activeMenu === 'settings' && <LoaderOverlay />}

          {/* Render Active View */}
          <div className="space-y-6">

            {/* A. DASHBOARD VIEW */}
            {activeMenu === 'dashboard' && stats && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Mission Control Dashboard</h2>
                  <p className="text-xs text-slate-500">Live platform performance and resource directory counts.</p>
                </div>

                {/* KPI Card Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5 text-blue-600" />} bg="bg-blue-50/50" />
                  <StatCard title="Founders" value={stats.founders} icon={<User className="w-5 h-5 text-emerald-600" />} bg="bg-emerald-50/50" />
                  <StatCard title="Investors" value={stats.investors} icon={<DollarSign className="w-5 h-5 text-purple-600" />} bg="bg-purple-50/50" />
                  <StatCard title="Job Seekers" value={stats.jobSeekers} icon={<User className="w-5 h-5 text-indigo-600" />} bg="bg-indigo-50/50" />
                  <StatCard title="Registered Startups" value={stats.startups} icon={<Building className="w-5 h-5 text-indigo-600" />} bg="bg-indigo-50/50" />
                  <StatCard title="Feed Posts" value={stats.posts} icon={<FileText className="w-5 h-5 text-amber-600" />} bg="bg-amber-50/50" />
                  <StatCard title="Watch Reels" value={stats.reels} icon={<Video className="w-5 h-5 text-pink-600" />} bg="bg-pink-50/50" />
                  <StatCard title="Applications Tracker" value={stats.totalApplications} icon={<FileText className="w-5 h-5 text-cyan-600" />} bg="bg-cyan-50/50" />
                  <StatCard title="Reports Pending" value={stats.reports} icon={<Flag className="w-5 h-5 text-rose-600" />} bg="bg-rose-50/50" />
                </div>

                {/* Quick actions box */}
                <div className="p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-500 shrink-0 h-10 w-10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Pending Verification Tickets</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{stats.pendingVerifications} verification requests require review by admin.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveMenu('reports')}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
                  >
                    Go to Verification Tickets
                  </button>
                </div>
              </div>
            )}

            {/* B. USERS MANAGEMENT VIEW */}
            {activeMenu === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">User Directory</h2>
                    <p className="text-xs text-slate-500">Search, filter role status, block profiles, or assign verification badges.</p>
                  </div>
                </div>

                {/* Search / Filter Block */}
                <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, handle, or email..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary transition"
                    />
                  </div>
                  <button onClick={fetchUsers} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>

                  <div className="flex gap-2 flex-wrap">
                    <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                      <option value="">All Roles</option>
                      <option value="founder">Founder</option>
                      <option value="investor">Investor</option>
                      <option value="job_seeker">Job Seeker</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select value={userVerifiedFilter} onChange={(e) => setUserVerifiedFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                      <option value="">All Badges</option>
                      <option value="true">Verified Badge</option>
                      <option value="false">Unverified</option>
                    </select>
                    <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                      <option value="">All Statuses</option>
                      <option value="true">Active</option>
                      <option value="false">Blocked</option>
                    </select>
                  </div>
                </div>

                {/* Table Container */}
                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">User Account</th>
                          <th className="py-3.5 px-6">Role</th>
                          <th className="py-3.5 px-6">Badge</th>
                          <th className="py-3.5 px-6">Status</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {usersList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No users found match filters.</td>
                          </tr>
                        ) : (
                          usersList.map((usr) => (
                            <tr key={usr._id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary select-none text-sm border border-blue-200/50">
                                  {usr.name ? usr.name[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-900">{usr.name || usr.fullName}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">@{usr.username} • {usr.email}</div>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold uppercase tracking-wider text-slate-500">{usr.role?.replace('_', ' ')}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  usr.isVerified 
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {usr.isVerified ? `Verified ${usr.verificationBadge || 'Badge'}` : 'Unverified'}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  usr.isActive
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {usr.isActive ? 'Active' : 'Blocked'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                <button 
                                  onClick={() => handleVerifyUser(usr._id, !usr.isVerified)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer ${
                                    usr.isVerified 
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                                      : 'bg-blue-500/10 text-primary hover:bg-blue-500/20'
                                  }`}
                                >
                                  {usr.isVerified ? 'Unverify' : 'Verify'}
                                </button>
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'block',
                                    id: usr._id,
                                    label: usr.isActive ? 'Block User' : 'Unblock User',
                                    execute: () => handleToggleBlock(usr._id)
                                  })}
                                  disabled={usr.role === 'admin' || actioningId !== null}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50 ${
                                    usr.isActive
                                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {usr.isActive ? 'Block' : 'Unblock'}
                                </button>
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'delete',
                                    id: usr._id,
                                    label: 'Permanently Delete User',
                                    execute: () => handleDeleteUser(usr._id)
                                  })}
                                  disabled={usr.role === 'admin' || actioningId !== null}
                                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination control footer */}
                  {usersTotalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50/50">
                      <span>Page {usersPage} of {usersTotalPages}</span>
                      <div className="flex gap-2">
                        <button disabled={usersPage === 1} onClick={() => setUsersPage(prev => Math.max(1, prev - 1))} className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40">Prev</button>
                        <button disabled={usersPage === usersTotalPages} onClick={() => setUsersPage(prev => prev + 1)} className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C. STARTUPS MANAGEMENT VIEW */}
            {activeMenu === 'startups' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Startup Registry</h2>
                  <p className="text-xs text-slate-500">Monitor registered ventures, verify startup profiles, edit particulars, or remove accounts.</p>
                </div>

                {/* Startup Filters */}
                <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={startupSearch}
                      onChange={(e) => setStartupSearch(e.target.value)}
                      placeholder="Search startups by brand name..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <button onClick={fetchStartups} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>

                  <div className="flex gap-2">
                    <select value={startupStageFilter} onChange={(e) => setStartupStageFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                      <option value="">All Stages</option>
                      <option value="idea">Idea Stage</option>
                      <option value="mvp">MVP Stage</option>
                      <option value="first_customer">First Customers</option>
                      <option value="revenue">Revenue Generating</option>
                      <option value="funded">Funded</option>
                    </select>
                    <select value={startupVerifiedFilter} onChange={(e) => setStartupVerifiedFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                      <option value="">Verification Status</option>
                      <option value="true">Approved / Verified</option>
                      <option value="false">Pending / Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Table listings */}
                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">Startup Brand</th>
                          <th className="py-3.5 px-6">Founder Account</th>
                          <th className="py-3.5 px-6">Industry / Stage</th>
                          <th className="py-3.5 px-6">Verification</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {startupsList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No startups found matching criteria.</td>
                          </tr>
                        ) : (
                          startupsList.map((start) => (
                            <tr key={start._id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6">
                                <div className="font-extrabold text-slate-900 text-sm">{start.name}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-xs">{start.oneLinePitch}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-bold text-slate-800">{start.founderId?.name || 'Anonymous'}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{start.founderId?.email || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-6 font-semibold">
                                <div>{start.industry}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-black mt-0.5">{start.stage?.replace('_', ' ')}</div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  start.isVerified 
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {start.isVerified ? 'Approved & Verified' : 'Pending / Unverified'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                <button 
                                  onClick={() => handleVerifyStartup(start._id, !start.isVerified)}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer ${
                                    start.isVerified 
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                                      : 'bg-blue-500/10 text-primary hover:bg-blue-500/20'
                                  }`}
                                >
                                  {start.isVerified ? 'Unverify' : 'Verify'}
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingStartup(start);
                                    setEditStartupForm({
                                      name: start.name || '',
                                      oneLinePitch: start.oneLinePitch || '',
                                      industry: start.industry || '',
                                      stage: start.stage || '',
                                      contactEmail: start.contactEmail || '',
                                      description: start.description || ''
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'delete',
                                    id: start._id,
                                    label: 'Permanently Delete Startup',
                                    execute: () => handleDeleteStartup(start._id)
                                  })}
                                  disabled={actioningId !== null}
                                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination footer */}
                  {startupsTotalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50/50">
                      <span>Page {startupsPage} of {startupsTotalPages}</span>
                      <div className="flex gap-2">
                        <button disabled={startupsPage === 1} onClick={() => setStartupsPage(prev => Math.max(1, prev - 1))} className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40">Prev</button>
                        <button disabled={startupsPage === startupsTotalPages} onClick={() => setStartupsPage(prev => prev + 1)} className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* D. INVESTORS MANAGEMENT VIEW */}
            {activeMenu === 'investors' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Investor Profiles Directory</h2>
                  <p className="text-xs text-slate-500">Monitor venture capital, evaluate investment tickets, and authorize investor verification badges.</p>
                </div>

                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">Investor Account</th>
                          <th className="py-3.5 px-6">Firm / Portfolio</th>
                          <th className="py-3.5 px-6">Focus / Ticket Range</th>
                          <th className="py-3.5 px-6">Verification</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {investorsList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No registered investor accounts found.</td>
                          </tr>
                        ) : (
                          investorsList.map((inv) => {
                            const profile = inv.investorProfile || {};
                            return (
                              <tr key={inv._id} className="hover:bg-slate-50/50">
                                <td className="py-4 px-6 flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 select-none text-sm border border-purple-200/50">
                                    {inv.name ? inv.name[0].toUpperCase() : 'I'}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-slate-900">{inv.name}</div>
                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">@{inv.username} • {inv.email}</div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-slate-800">{profile.company || profile.firmName || 'Independent Investor'}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{profile.investorType || 'Angel'}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-slate-700">Ticket: {profile.minInvestmentAmount ? `$${profile.minInvestmentAmount.toLocaleString()}` : '$10k'} - {profile.maxInvestmentAmount ? `$${profile.maxInvestmentAmount.toLocaleString()}` : '$500k'}</div>
                                  <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-xs">{profile.industriesFocus?.join(', ') || 'Multi-stage Technology'}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    inv.isVerified 
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {inv.isVerified ? 'Verified Investor' : 'Unverified'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                  <button 
                                    onClick={() => handleVerifyInvestor(inv._id, !inv.isVerified)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer ${
                                      inv.isVerified 
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' 
                                        : 'bg-blue-500/10 text-primary hover:bg-blue-500/20'
                                    }`}
                                  >
                                    {inv.isVerified ? 'Revoke Badge' : 'Approve & Verify'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* E. APPLICATIONS SOURCING VIEW */}
            {activeMenu === 'applications' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Recruitment & Applications Queue</h2>
                  <p className="text-xs text-slate-500">Track seeker job applications and custom startup role requests across the platform.</p>
                </div>

                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">Applicant</th>
                          <th className="py-3.5 px-6">Target Startup & Role</th>
                          <th className="py-3.5 px-6">Sourcing Type</th>
                          <th className="py-3.5 px-6">Status State</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {appsList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No applications or role requests listed on platform.</td>
                          </tr>
                        ) : (
                          appsList.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6">
                                <div className="font-extrabold text-slate-900">{app.applicantName}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{app.applicantEmail}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-extrabold text-slate-800">{app.roleTitle}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">at {app.startupName} • Founder: {app.founderName}</div>
                              </td>
                              <td className="py-4 px-6 font-semibold uppercase text-slate-500">{app.type}</td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  app.status === 'hired'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : app.status === 'connected'
                                    ? 'bg-blue-50 text-blue-600'
                                    : app.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {app.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-1 whitespace-nowrap">
                                <select 
                                  value={app.status} 
                                  onChange={(e) => handleUpdateAppStatus(app._id, e.target.value, app.type)}
                                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="connected">Connected</option>
                                  <option value="hired">Hired</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                                {app.resume && (
                                  <a 
                                    href={app.resume} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer"
                                  >
                                    Resume
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* F. POSTS & MEDIA VIEW */}
            {activeMenu === 'posts' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Content Moderation (Posts & Reels)</h2>
                  <p className="text-xs text-slate-500">Monitor community announcements, watch feeds, audit content, and remove spam or harmful posts.</p>
                </div>

                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">Publisher</th>
                          <th className="py-3.5 px-6">Content Body Preview</th>
                          <th className="py-3.5 px-6">Content Format</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {postsList.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-12 text-center text-slate-400 font-semibold">No community posts listed.</td>
                          </tr>
                        ) : (
                          postsList.map((post) => (
                            <tr key={post._id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-primary text-xs">
                                  {post.authorId?.name ? post.authorId.name[0].toUpperCase() : 'P'}
                                </div>
                                <div>
                                  <div className="font-extrabold text-slate-800">{post.authorId?.name || 'Anonymous'}</div>
                                  <div className="text-[9px] text-slate-400 mt-0.5">@{post.authorId?.username || 'user'}</div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="font-medium text-slate-700 truncate max-w-md">{post.content || 'Video Pitch Content'}</div>
                                {post.startupId && <div className="text-[10px] text-primary font-bold mt-1">Associated Startup: {post.startupId.name}</div>}
                              </td>
                              <td className="py-4 px-6 capitalize">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  post.contentType === 'video'
                                    ? 'bg-purple-50 text-purple-600'
                                    : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {post.contentType === 'video' ? 'FounderTV Reel' : 'Community Post'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                <button 
                                  onClick={() => setConfirmAction({
                                    type: 'delete_post',
                                    id: post._id,
                                    label: 'Remove Reported Content',
                                    execute: () => handleDeletePost(post._id)
                                  })}
                                  disabled={actioningId !== null}
                                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50"
                                >
                                  Remove Post
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* G. REPORT INCIDENTS VIEW */}
            {activeMenu === 'reports' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Incident Flags Reports Queue</h2>
                  <p className="text-xs text-slate-500">Moderate flagging tickets, review report justifications, and resolve or dismiss flags.</p>
                </div>

                <div className="card bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                          <th className="py-3.5 px-6">Reporter</th>
                          <th className="py-3.5 px-6">Flagged Item Type</th>
                          <th className="py-3.5 px-6">Reason / Narrative</th>
                          <th className="py-3.5 px-6">Status State</th>
                          <th className="py-3.5 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {reportsList.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="py-12 text-center text-slate-400 font-semibold">No reported incidents listed.</td>
                          </tr>
                        ) : (
                          reportsList.map((rep) => (
                            <tr key={rep._id} className="hover:bg-slate-50/50">
                              <td className="py-4 px-6">
                                <div className="font-extrabold text-slate-900">{rep.reporterId?.name || 'Anonymous'}</div>
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{rep.reporterId?.email || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-6 font-bold uppercase text-slate-500">{rep.targetType}</td>
                              <td className="py-4 px-6">
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full font-black text-[9px] uppercase tracking-wider">{rep.reason}</span>
                                <div className="text-[10px] text-slate-500 font-medium mt-1.5 max-w-sm truncate" title={rep.description}>{rep.description || 'No description provided.'}</div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  rep.status === 'Resolved'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : rep.status === 'Dismissed'
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {rep.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                {rep.status === 'Pending' && (
                                  <>
                                    <button 
                                      onClick={() => handleResolveReport(rep._id, 'Resolved')}
                                      disabled={actioningId !== null}
                                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50"
                                    >
                                      Resolve
                                    </button>
                                    <button 
                                      onClick={() => handleResolveReport(rep._id, 'Dismissed')}
                                      disabled={actioningId !== null}
                                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[10px] uppercase transition cursor-pointer disabled:opacity-50"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}
                                {rep.status !== 'Pending' && (
                                  <span className="text-[10px] font-extrabold text-slate-400 uppercase">Handled</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* H. DETAILED ANALYTICS VIEW */}
            {activeMenu === 'analytics' && analyticsData && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-slate-950">Interactive Network Analytics</h2>
                  <p className="text-xs text-slate-500">Aggregated timelines detailing user growth, startups density, and platform engagement profiles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Growth Line Chart */}
                  <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">User Registrations Growth</h3>
                    <LineChartSVG data={analyticsData.userGrowth} />
                  </div>

                  {/* Startup Growth Line Chart */}
                  <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Startup Creations Density</h3>
                    <LineChartSVG data={analyticsData.startupGrowth.map(item => ({ label: item.label, total: item.total, registrations: item.newCount }))} />
                  </div>

                  {/* Role Distribution Donut Chart */}
                  <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">System User Role Percentages</h3>
                    <DonutChartSVG 
                      data={[
                        { name: 'Founders', value: analyticsData.roleDistribution.founder, color: '#0A66C2' },
                        { name: 'Investors', value: analyticsData.roleDistribution.investor, color: '#10B981' },
                        { name: 'Job Seekers', value: analyticsData.roleDistribution.jobSeeker, color: '#6366F1' },
                        { name: 'Admins', value: analyticsData.roleDistribution.admin, color: '#F59E0B' }
                      ]} 
                    />
                  </div>

                  {/* Overview summary listings */}
                  <div className="card p-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4">Engagement Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-xs font-semibold text-slate-500">Startup Directory:</span>
                        <span className="text-xs font-extrabold text-slate-900">{analyticsData.summary.totalStartups} Brand profiles</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-xs font-semibold text-slate-500">Newsfeed Posts:</span>
                        <span className="text-xs font-extrabold text-slate-900">{analyticsData.summary.totalPosts} Published articles</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-xs font-semibold text-slate-500">FounderTV Reels:</span>
                        <span className="text-xs font-extrabold text-slate-900">{analyticsData.summary.totalReels} Pitch reels</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-xs font-semibold text-slate-500">Active Applications:</span>
                        <span className="text-xs font-extrabold text-slate-900">{analyticsData.summary.totalApplications} Talent requests</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* I. SETTINGS & PROFILE VIEW */}
            {activeMenu === 'settings' && (
              <div className="card bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row min-h-[480px]">
                  
                  {/* Sidebar inside settings */}
                  <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900/10">
                    <SettingsMenuButton active={activeSettingsTab === 'profile'} onClick={() => setActiveSettingsTab('profile')} icon={<User className="w-4 h-4" />} label="Admin Profile" />
                    <SettingsMenuButton active={activeSettingsTab === 'password'} onClick={() => setActiveSettingsTab('password')} icon={<Lock className="w-4 h-4" />} label="Change Password" />
                    <SettingsMenuButton active={activeSettingsTab === 'notifications'} onClick={() => setActiveSettingsTab('notifications')} icon={<Bell className="w-4 h-4" />} label="Notification Settings" />
                    <SettingsMenuButton active={activeSettingsTab === 'theme'} onClick={() => setActiveSettingsTab('theme')} icon={<Sun className="w-4 h-4" />} label="Theme Settings" />
                    <SettingsMenuButton active={activeSettingsTab === 'logout'} onClick={() => setActiveSettingsTab('logout')} icon={<LogOut className="w-4 h-4" />} label="Logout" />
                  </div>

                  {/* Main content inside settings tab */}
                  <div className="flex-1 p-8">
                    
                    {/* Settings Profile Info */}
                    {activeSettingsTab === 'profile' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">Administrator Profile Card</h3>
                          <p className="text-xs text-slate-400">Public profile specifications for your superuser account.</p>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="w-14 h-14 bg-blue-100 border border-blue-200/50 rounded-full flex items-center justify-center font-bold text-primary text-xl select-none">
                            {user.name ? user.name[0].toUpperCase() : 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-slate-900 text-sm">{user.name || 'Admin User'}</span>
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 font-bold text-[8px] uppercase tracking-wider rounded-full border border-blue-500/20">System Admin</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{user.email}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Superuser Role</label>
                            <input type="text" readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500" value="admin" />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Created At</label>
                            <input type="text" readOnly className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500" value={new Date(user.createdAt).toLocaleDateString()} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Settings Change Password */}
                    {activeSettingsTab === 'password' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">Change Admin Password</h3>
                          <p className="text-xs text-slate-400">Regularly rotate passwords to protect control privileges.</p>
                        </div>
                        {passwordError && (
                          <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs font-semibold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{passwordError}</span>
                          </div>
                        )}
                        {passwordSuccess && (
                          <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold rounded-xl flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{passwordSuccess}</span>
                          </div>
                        )}
                        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Current Password</label>
                            <input 
                              type="password"
                              required
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                              placeholder="••••••••"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">New Password</label>
                            <input 
                              type="password"
                              required
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              placeholder="At least 6 characters"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New Password</label>
                            <input 
                              type="password"
                              required
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              placeholder="••••••••"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                            />
                          </div>
                          <button type="submit" disabled={passwordSaving} className="btn-primary py-2.5 px-6 text-xs shadow-none hover:shadow-none cursor-pointer flex items-center gap-1.5">
                            {passwordSaving && <Loader className="w-3.5 h-3.5 animate-spin" />}
                            <span>Update Password</span>
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Notification Settings Option */}
                    {activeSettingsTab === 'notifications' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Notification Settings</h3>
                          <p className="text-xs text-slate-400">Manage administrator email alerts and desktop system updates.</p>
                        </div>
                        <div className="space-y-4 max-w-md">
                          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-2xl">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Incident Flags Reports</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">Receive immediate notifications when posts or messages are reported.</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => addToast('Notification preference saved', 'success')}
                              className="px-3 py-1.5 bg-primary text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer"
                            >
                              Enabled
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-2xl">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Verification Requests</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">Receive notifications when users request verification badges.</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => addToast('Notification preference saved', 'success')}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] uppercase rounded-xl transition cursor-pointer"
                            >
                              Disabled
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Theme Settings Option */}
                    {activeSettingsTab === 'theme' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Theme Settings</h3>
                          <p className="text-xs text-slate-400">Personalize your admin panel appearance. Switch between light and dark layouts.</p>
                        </div>
                        <div className="space-y-4 max-w-md">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-2xl">
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">Interface Mode</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Currently: <span className="font-extrabold uppercase text-primary">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={toggleTheme}
                              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 hover:bg-slate-150 dark:hover:bg-slate-800 transition flex items-center justify-center cursor-pointer shadow-sm"
                            >
                              {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Logout Settings Option */}
                    {activeSettingsTab === 'logout' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Terminate Session</h3>
                          <p className="text-xs text-slate-400">Safely sign out from the superuser administrator panel.</p>
                        </div>
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl max-w-md">
                          <p className="text-xs font-semibold text-rose-700 dark:text-rose-350">Logging out will clear active credentials. You will need to log in again to access superuser dashboards.</p>
                          <button 
                            type="button"
                            onClick={() => logout()}
                            className="mt-4 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Confirm Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-lg border border-slate-200 animate-in zoom-in-95 duration-100">
            <h3 className="font-extrabold text-slate-900 text-base">{confirmAction.label}</h3>
            <p className="text-xs text-slate-500 mt-2">Are you sure you want to proceed with this administrative action? This action is tracked in system records.</p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button 
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction.execute}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Startup Edit Modal */}
      {editingStartup && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-lg border border-slate-200 animate-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">Edit Startup Profile</h3>
              <button onClick={() => setEditingStartup(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditStartupSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 mb-1">Brand Name</label>
                <input 
                  type="text" 
                  value={editStartupForm.name}
                  onChange={(e) => setEditStartupForm({ ...editStartupForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">One Line Pitch</label>
                <input 
                  type="text" 
                  value={editStartupForm.oneLinePitch}
                  onChange={(e) => setEditStartupForm({ ...editStartupForm, oneLinePitch: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Industry</label>
                  <input 
                    type="text" 
                    value={editStartupForm.industry}
                    onChange={(e) => setEditStartupForm({ ...editStartupForm, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Stage</label>
                  <select 
                    value={editStartupForm.stage}
                    onChange={(e) => setEditStartupForm({ ...editStartupForm, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-semibold"
                  >
                    <option value="idea">Idea</option>
                    <option value="mvp">MVP</option>
                    <option value="first_customer">First Customer</option>
                    <option value="revenue">Revenue</option>
                    <option value="funded">Funded</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Contact Email</label>
                <input 
                  type="email" 
                  value={editStartupForm.contactEmail}
                  onChange={(e) => setEditStartupForm({ ...editStartupForm, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Description</label>
                <textarea 
                  rows="3"
                  value={editStartupForm.description}
                  onChange={(e) => setEditStartupForm({ ...editStartupForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button type="button" onClick={() => setEditingStartup(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function LoaderOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
      <Loader className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function StatCard({ title, value, icon, bg }) {
  return (
    <div className="card p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm flex items-center justify-between select-none">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-black text-slate-900 mt-2 leading-none">{value}</div>
      </div>
      <div className={`p-2.5 rounded-2xl ${bg}`}>{icon}</div>
    </div>
  );
}

function SettingsMenuButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition flex items-center gap-2.5 cursor-pointer ${
        active 
          ? 'bg-blue-500/10 text-primary' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// -------------------------------------------------------------
// SVG CHART DRAWING COMPONENT
// -------------------------------------------------------------

function LineChartSVG({ data }) {
  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 150;
  const padding = 25;

  const maxVal = Math.max(...data.map(d => d.total), 10) * 1.1;
  const minVal = 0;

  const getX = (index) => padding + (index * (width - padding * 2)) / (data.length - 1);
  const getY = (val) => height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal);

  // Generate SVG Path
  let dPath = '';
  let areaPath = '';
  
  data.forEach((item, index) => {
    const x = getX(index);
    const y = getY(item.total);
    if (index === 0) {
      dPath = `M ${x} ${y}`;
      areaPath = `M ${x} ${height - padding} L ${x} ${y}`;
    } else {
      dPath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }
    if (index === data.length - 1) {
      areaPath += ` L ${x} ${height - padding} Z`;
    }
  });

  return (
    <div className="w-full overflow-x-auto hide-scrollbar">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[450px] overflow-visible">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0A66C2" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line 
              key={i} 
              x1={padding} 
              y1={y} 
              x2={width - padding} 
              y2={y} 
              className="stroke-slate-150" 
              strokeDasharray="4 4" 
            />
          );
        })}

        {/* Shaded Area */}
        {dPath && <path d={areaPath} fill="url(#areaGradient)" />}

        {/* The Line */}
        {dPath && (
          <path 
            d={dPath} 
            fill="none" 
            className="stroke-primary" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Data Circles */}
        {data.map((item, index) => (
          <g key={index} className="group cursor-pointer">
            <circle 
              cx={getX(index)} 
              cy={getY(item.total)} 
              r="4.5" 
              className="fill-white stroke-primary" 
              strokeWidth="2.5" 
            />
            {/* Tooltip on hover */}
            <title>{`${item.label}: ${item.total} (+${item.registrations || 0})`}</title>
          </g>
        ))}

        {/* X Axis Labels */}
        {data.map((item, index) => (
          <text 
            key={index} 
            x={getX(index)} 
            y={height - 5} 
            className="text-[9px] font-extrabold fill-slate-400" 
            textAnchor="middle"
          >
            {item.label.split(' ')[0]}
          </text>
        ))}

        {/* Y Axis Max Label */}
        <text 
          x={padding} 
          y={padding - 5} 
          className="text-[8px] font-bold fill-slate-400"
        >
          {Math.round(maxVal)}
        </text>
      </svg>
    </div>
  );
}

function DonutChartSVG({ data }) {
  const total = data.reduce((acc, item) => acc + item.value, 0) || 1;
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate segments offsets using .reduce() to prevent reassigning variables in rendering map
  const offsets = data.reduce((acc, item, i) => {
    if (i === 0) {
      acc.push(0);
    } else {
      const prevPercentage = data[i - 1].value / total;
      acc.push(acc[i - 1] + prevPercentage * circumference);
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
      {/* SVG Donut */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius} 
            fill="transparent" 
            className="stroke-slate-100" 
            strokeWidth={strokeWidth} 
          />
          {data.map((item, i) => {
            const percentage = item.value / total;
            const strokeDashoffset = circumference - percentage * circumference;
            const offset = offsets[i];

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  strokeDasharray: `${circumference} ${circumference}`,
                  strokeDashoffset: strokeDashoffset,
                  transformOrigin: 'center',
                  transform: `rotate(${offset * (360 / circumference)}deg)`
                }}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Users</span>
        </div>
      </div>

      {/* Legends */}
      <div className="space-y-2 shrink-0 min-w-[140px]">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1 flex justify-between gap-4">
              <span>{item.name}</span>
              <span className="font-extrabold text-slate-900">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
