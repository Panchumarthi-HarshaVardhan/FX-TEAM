'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { 
  Plus, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  Code, 
  X, 
  ShieldCheck, 
  Edit, 
  Image as ImageIcon,
  Sparkles,
  Users,
  Rocket,
  CheckCircle2,
  Star,
  Zap,
  Clock,
  Target,
  ArrowUpRight,
  Eye,
  Send,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
  MessageSquare,
  UserPlus,
  Loader,
  FileText,
  ExternalLink,
  Mail
} from 'lucide-react';
import FounderScoreCard from '../../../components/score/FounderScoreCard';
import BadgeGenerator from '../../../components/startup/BadgeGenerator';
import VerificationModal from '../../../components/VerificationModal';
import FounderPortal from '../../../components/dashboard/FounderPortal';
import { uploadToCloudinary } from '../../../utils/cloudinary';
import { useToast } from '../../../context/ToastContext';
import { format } from 'date-fns';
import { API_URL } from '@/utils/api';

// Demo data for founder dashboard
const demoData = {
  analytics: {
    revenue: 45000,
    totalStartups: 1,
    totalProducts: 2,
    startupViews: 1247,
    investorInterest: 42,
    followersGained: 189,
    pitchViews: 234,
    launchPerformance: 87
  },
  startups: [
    {
      _id: '1',
      name: 'Nexus AI',
      oneLinePitch: 'AI-powered pitch deck generator for early-stage startups',
      isVerified: true
    }
  ],
  products: [
    {
      _id: '1',
      name: 'Pitch Deck Pro Template',
      description: 'Professional pitch deck template with AI-powered suggestions',
      price: 49,
      category: 'Templates',
      stock: 100,
      lowStockThreshold: 10,
      isActive: true
    },
    {
      _id: '2',
      name: 'Startup Launch Checklist',
      description: 'Complete 100-point checklist for launching your startup',
      price: 29,
      category: 'Courses',
      stock: 250,
      lowStockThreshold: 20,
      isActive: true
    }
  ],
  orders: [
    {
      _id: '1',
      productId: { name: 'Pitch Deck Pro Template' },
      userId: { name: 'Alex Morgan' },
      totalAmount: 49,
      status: 'Completed'
    },
    {
      _id: '2',
      productId: { name: 'Startup Launch Checklist' },
      userId: { name: 'Jamie Lee' },
      totalAmount: 29,
      status: 'Processing'
    }
  ]
};

const demoScoreData = {
  score: 87,
  tips: [
    'Add more traction metrics to your startup profile',
    'Upload a demo video to increase engagement',
    'Connect with more investors to expand your network'
  ]
};

const founderJourney = [
  { id: 1, title: 'Complete profile', completed: true },
  { id: 2, title: 'Add startup', completed: true },
  { id: 3, title: 'Upload pitch deck', completed: false },
  { id: 4, title: 'Connect with investors', completed: true },
  { id: 5, title: 'Launch first product', completed: true },
  { id: 6, title: 'Get verified', completed: true },
  { id: 7, title: 'Reach 1000 views', completed: false }
];

const aiInsights = [
  'Profiles with startup descriptions get 3x more investor engagement.',
  'AI startups are trending this week.',
  'Your founder score can improve by adding traction metrics.'
];

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  return src;
};

export default function FounderDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('overview'); // 'overview' or 'portal'
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [data, setData] = useState(demoData);
  const [investorInterests, setInvestorInterests] = useState([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  
  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    lowStockThreshold: '',
    startupId: '',
    images: []
  });
  
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productError, setProductError] = useState('');
  
  const [selectedStartupForBadge, setSelectedStartupForBadge] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState({ type: 'User', id: '' });

  // Recruitment/Applications Dashboard states
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [roleRequests, setRoleRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeRecruitmentTab, setActiveRecruitmentTab] = useState('received'); // 'received', 'shortlisted', 'connected', 'hired', 'team', 'jobs'

  // Job Opening Modal Form State
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [jobForm, setJobForm] = useState({
    startupId: '',
    title: '',
    roleType: 'Full-time',
    description: '',
    requiredSkills: '',
    experienceLevel: 'Entry-level',
    workMode: 'Remote',
    location: '',
    salaryMin: '',
    salaryMax: '',
    duration: '',
    openings: '1',
    deadline: '',
    status: 'open'
  });

  // Hire Modal State (from accepted application list)
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedAppForHire, setSelectedAppForHire] = useState(null);
  const [hireForm, setHireForm] = useState({
    teamRole: 'Developer',
    customRole: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    workMode: 'Remote',
    notes: ''
  });
  const [hiring, setHiring] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/founder`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(prev => ({
          ...prev,
          startups: json.data.startups || prev.startups,
          products: json.data.products || prev.products,
          orders: json.data.orders || prev.orders,
          analytics: {
            ...prev.analytics,
            ...json.data.analytics,
            startupViews: prev.analytics.startupViews,
            followersGained: prev.analytics.followersGained,
            pitchViews: prev.analytics.pitchViews,
            launchPerformance: prev.analytics.launchPerformance
          }
        }));

        // Load jobs for all founder startups
        if (json.data.startups) {
          fetchJobs(json.data.startups);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const fetchInvestorInterests = async () => {
    try {
      setInterestsLoading(true);
      const res = await fetch(`${API_URL}/api/videos/dashboard/investor-interests`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setInvestorInterests(json.data);
        setData(prev => ({
          ...prev,
          analytics: {
            ...prev.analytics,
            investorInterest: json.data.length
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching investor interests:', err);
    } finally {
      setInterestsLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch(`${API_URL}/api/founder/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setApplications(json.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch(`${API_URL}/api/founder/role-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setRoleRequests(json.data);
      }
    } catch (err) {
      console.error('Error fetching role requests:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchJobs = async (startupsList) => {
    try {
      setLoadingJobs(true);
      const allJobs = [];
      for (const s of startupsList) {
        const res = await fetch(`${API_URL}/api/startups/${s._id}/jobs`);
        const json = await res.json();
        if (json.success && json.data) {
          allJobs.push(...json.data.map(j => ({ ...j, startupName: s.name })));
        }
      }
      setJobs(allJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchDashboardData();
      fetchInvestorInterests();
      fetchApplications();
      fetchRoleRequests();
    }
  }, [user, token, API_URL]);

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

    if (user.role !== 'founder') {
      if (user.role === 'investor') {
        router.push('/dashboard/investor');
      } else if (user.role === 'job_seeker') {
        router.push('/dashboard/job-seeker');
      } else {
        router.push('/profile/setup');
      }
    }
  }, [user, loading, router]);

  // Product forms handlers
  const openNewProductModal = () => {
    const defaultStartupId = data?.startups?. [0]?._id || '';
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      lowStockThreshold: '',
      startupId: defaultStartupId,
      images: []
    });
    setProductError('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? String(product.price) : '',
      category: product.category || '',
      stock: product.stock != null ? String(product.stock) : '',
      lowStockThreshold: product.lowStockThreshold != null ? String(product.lowStockThreshold) : '',
      startupId: product.startupId || '',
      images: product.images || []
    });
    setProductError('');
    setProductModalOpen(true);
  };

  const handleProductChange = (field, value) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const result = await uploadToCloudinary(file, 'founderx/products');
      setProductForm((prev) => ({
        ...prev,
        images: prev.images && prev.images.length > 0 ? [...prev.images, result.url] : [result.url]
      }));
    } catch (err) {
      setProductError('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    setSavingProduct(true);
    setProductError('');
    try {
      const url = editingProduct 
        ? `${API_URL}/api/products/${editingProduct._id}`
        : `${API_URL}/api/products`;
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: Number(productForm.price),
          stock: Number(productForm.stock),
          lowStockThreshold: Number(productForm.lowStockThreshold)
        })
      });
      const json = await res.json();
      if (json.success) {
        addToast(editingProduct ? 'Product updated successfully!' : 'Product created successfully!', 'success');
        setProductModalOpen(false);
        fetchDashboardData();
      } else {
        setProductError(json.error || 'Failed to save product');
      }
    } catch (err) {
      setProductError('Failed to save product');
    } finally {
      setSavingProduct(false);
    }
  };

  // Job Posting/Creation Handler
  const openNewJobModal = () => {
    const defaultStartupId = data?.startups?.[0]?._id || '';
    setJobForm({
      startupId: defaultStartupId,
      title: '',
      roleType: 'Full-time',
      description: '',
      requiredSkills: '',
      experienceLevel: 'Entry-level',
      workMode: 'Remote',
      location: '',
      salaryMin: '',
      salaryMax: '',
      duration: '',
      openings: '1',
      deadline: '',
      status: 'open'
    });
    setJobModalOpen(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    setSavingJob(true);
    try {
      const res = await fetch(`${API_URL}/api/startups/${jobForm.startupId}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(jobForm)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Job Opening posted successfully!', 'success');
        setJobModalOpen(false);
        if (data.startups) {
          fetchJobs(data.startups);
        }
      } else {
        alert(json.error || 'Failed to save job opening');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving job opening');
    } finally {
      setSavingJob(false);
    }
  };

  // Application Actions
  const handleConnect = async (appId) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/applications/${appId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('Connected with applicant! Chat unlocked.', 'success');
        fetchApplications();
      } else {
        addToast(json.error || 'Connection failed', 'error');
      }
    } catch (err) {
      addToast('Error connecting', 'error');
    }
  };

  const handleStatusUpdate = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Application status updated to ${newStatus}`, 'success');
        fetchApplications();
      } else {
        addToast(json.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  const handleRoleRequestConnect = async (reqId) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/role-requests/${reqId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast('Connected with applicant! Chat unlocked.', 'success');
        fetchRoleRequests();
      } else {
        addToast(json.error || 'Connection failed', 'error');
      }
    } catch (err) {
      addToast('Error connecting', 'error');
    }
  };

  const handleRoleRequestStatusUpdate = async (reqId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/role-requests/${reqId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        addToast(`Request status updated to ${newStatus}`, 'success');
        fetchRoleRequests();
      } else {
        addToast(json.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  // Hire Form Submit
  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppForHire) return;
    setHiring(true);
    try {
      const role = hireForm.teamRole === 'Custom' ? hireForm.customRole : hireForm.teamRole;
      const isRoleRequest = selectedAppForHire.requestType !== undefined;
      const endpoint = isRoleRequest 
        ? `${API_URL}/api/founder/role-requests/${selectedAppForHire._id}/hire`
        : `${API_URL}/api/founder/applications/${selectedAppForHire._id}/hire`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teamRole: role,
          startDate: hireForm.startDate,
          workMode: hireForm.workMode,
          notes: hireForm.notes
        })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Team member successfully hired and added to startup!', 'success');
        setHireModalOpen(false);
        if (isRoleRequest) {
          fetchRoleRequests();
        } else {
          fetchApplications();
        }
        fetchDashboardData(); // Reload team count etc.
      } else {
        addToast(json.error || 'Hiring failed', 'error');
      }
    } catch (err) {
      addToast('Error hiring team member', 'error');
    } finally {
      setHiring(false);
    }
  };

  // Filter applications by state
  const pendingApps = applications.filter(a => a.status === 'pending' || a.status === 'reviewed');
  const shortlistedApps = applications.filter(a => a.status === 'shortlisted');
  const connectedApps = applications.filter(a => a.status === 'connected');
  const hiredApps = applications.filter(a => a.status === 'hired');

  // Startup Team list from all founder startups
  const startupTeam = data.startups.flatMap(startup => 
    (startup.teamMembers || []).map(member => ({
      ...member,
      startupName: startup.name,
      startupId: startup._id,
      founderId: startup.founderId?._id || startup.founderId
    }))
  );

  if (!mounted || loading || !user || user.role !== 'founder') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        {/* Header Block */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight">Founder Mission Control 🚀</h1>
            <p className="text-sm text-slate-500 font-semibold mt-1">Welcome back, {user?.name}</p>
            {user && !user.isVerified && (
              <button 
                onClick={() => {
                  setVerificationTarget({ type: 'User', id: user._id });
                  setShowVerificationModal(true);
                }}
                className="mt-2 text-xs text-primary font-bold hover:underline flex items-center"
              >
                <ShieldCheck className="h-4 w-4 mr-1" />
                Get Verified Founder Badge
              </button>
            )}
          </div>
          <Link href="/startups/create" className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-650 transition shadow-sm text-xs font-bold font-sans">
            <Plus className="h-5 w-5 mr-2" />
            New Startup
          </Link>
        </div>

        {/* Main Tab Selector */}
        <div className="flex border-b border-gray-200 mb-8 gap-2">
          <button
            onClick={() => setActiveMainTab('overview')}
            className={`px-4 py-2 border-b-2 font-bold text-sm transition-all ${
              activeMainTab === 'overview' ? 'border-primary text-primary font-sans' : 'border-transparent text-slate-500 hover:text-slate-700 font-sans'
            }`}
          >
            Overview Dashboard
          </button>
          <button
            onClick={() => setActiveMainTab('portal')}
            className={`px-4 py-2 border-b-2 font-bold text-sm transition-all ${
              activeMainTab === 'portal' ? 'border-primary text-primary font-sans' : 'border-transparent text-slate-500 hover:text-slate-700 font-sans'
            }`}
          >
            Startup Management Portal
          </button>
        </div>

        {activeMainTab === 'overview' ? (
          <>
            {/* Top analytics grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
             {/* Analytics Cards */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider font-sans">Total Revenue</h3>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-sans">${(data.analytics?.revenue || 0).toLocaleString()}</p>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider font-sans">Startup Views</h3>
                    <div className="p-2 bg-blue-50 text-primary rounded-lg">
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-sans">{(data.analytics?.startupViews || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider font-sans">Investor Interest</h3>
                    <div className="p-2 bg-indigo-50 text-indigo-650 rounded-lg">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 font-sans">{investorInterests.length}</p>
                </div>
             </div>

             <FounderScoreCard 
               score={demoScoreData.score} 
               tips={demoScoreData.tips} 
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
            <FounderJourney />
          </div>
        </div>

        {/* Recruitment Hub Card */}
        <div className="mt-8 bg-white rounded-3xl shadow-sm border border-slate-250/60 p-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Recruitment Hub & Talent Sourcing
              </h2>
              <p className="text-xs text-muted font-semibold mt-0.5">Manage job postings, review seeker applications, and recruit team members.</p>
            </div>
            
            <button
              onClick={openNewJobModal}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-blue-600 transition shadow-sm font-sans"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Post Job Opening
            </button>
          </div>

          {/* Recruitment tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-none gap-2">
            <button
              onClick={() => setActiveRecruitmentTab('received')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'received' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Received Applications ({pendingApps.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('role_requests')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'role_requests' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Custom Requests ({roleRequests.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('shortlisted')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'shortlisted' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Shortlisted ({shortlistedApps.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('connected')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'connected' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Connected ({connectedApps.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('hired')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'hired' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hired ({hiredApps.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('team')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Startup Team ({startupTeam.length})
            </button>
            <button
              onClick={() => setActiveRecruitmentTab('jobs')}
              className={`px-4 py-2 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                activeRecruitmentTab === 'jobs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Postings ({jobs.length})
            </button>
          </div>

          {/* Recruitment list contents */}
          <div className="space-y-4">
            {loadingApps && activeRecruitmentTab !== 'jobs' && (
              <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
            )}

            {!loadingApps && ['received', 'shortlisted', 'connected', 'hired'].includes(activeRecruitmentTab) && (
              (() => {
                const list = activeRecruitmentTab === 'received' ? pendingApps :
                             activeRecruitmentTab === 'shortlisted' ? shortlistedApps :
                             activeRecruitmentTab === 'connected' ? connectedApps : hiredApps;

                if (list.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      No applications in this category.
                    </div>
                  );
                }

                return list.map((app) => (
                  <div key={app._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row justify-between gap-4 hover:shadow-xs transition">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted font-bold">
                          Applied {format(new Date(app.createdAt), 'MMM d, yyyy')}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase rounded-full tracking-wider bg-white`}>
                          {app.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base font-sans">{app.applicantId?.fullName || app.applicantId?.name || 'Applicant'}</h4>
                      <p className="text-xs text-primary font-bold">
                        Applied for: <span className="underline">{app.jobId?.title || 'Open Role'}</span> at {app.startupId?.name}
                      </p>
                      {app.coverLetter && (
                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl italic mt-2">
                          &quot;{app.coverLetter}&quot;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap md:flex-col items-stretch md:items-end justify-center gap-2 min-w-[130px]">
                      <Link 
                        href={`/profile/${app.applicantId?.username || app.applicantId?._id}`}
                        className="px-3 py-1.5 text-center text-xs bg-white border text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition"
                      >
                        View Profile
                      </Link>

                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleConnect(app._id)}
                          className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition"
                        >
                          Connect
                        </button>
                      )}

                      {['pending', 'reviewed', 'shortlisted', 'connected'].includes(app.status) && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(app._id, 'accepted')}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app._id, 'rejected')}
                            className="px-3 py-1.5 text-xs bg-red-50 text-red-650 hover:bg-red-100 font-bold border border-red-200 rounded-lg transition"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {['connected', 'accepted', 'hired'].includes(app.status) && (
                        <Link
                          href={`/messages?userId=${app.applicantId?._id}`}
                          className="px-3 py-1.5 text-center text-xs bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition"
                        >
                          Message
                        </Link>
                      )}

                      {['accepted', 'connected'].includes(app.status) && (
                        <button
                          onClick={() => {
                            setSelectedAppForHire(app);
                            setHireModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                        >
                          Hire / Add to Team
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()
            )}

            {activeRecruitmentTab === 'role_requests' && (
              roleRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No custom role requests received.
                </div>
              ) : (
                roleRequests.map((req) => (
                  <div key={req._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col gap-4 hover:shadow-xs transition font-sans text-sm text-slate-800 animate-in fade-in duration-200">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted font-bold">
                            Applied {format(new Date(req.createdAt), 'MMM d, yyyy')}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 border border-slate-250 font-bold uppercase rounded-full tracking-wider bg-white text-slate-650">
                            {req.requestType} request
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 border font-bold uppercase rounded-full tracking-wider ${
                            req.status === 'accepted' || req.status === 'hired' ? 'bg-green-50 text-green-700 border-green-200' :
                            req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            req.status === 'connected' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{req.applicantId?.fullName || req.applicantId?.name || 'Applicant'}</h4>
                        <p className="text-xs text-primary font-bold">
                          wants to join <span className="underline">{req.startupId?.name}</span> as <span className="text-slate-800 font-bold">{req.roleTitle}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap md:flex-col items-stretch md:items-end justify-center gap-2 min-w-[130px]">
                        <Link 
                          href={`/profile/${req.applicantId?.username || req.applicantId?._id}`}
                          className="px-3 py-1.5 text-center text-xs bg-white border text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition"
                        >
                          View Profile
                        </Link>

                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleRoleRequestStatusUpdate(req._id, 'reviewed')}
                            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition"
                          >
                            Mark Reviewed
                          </button>
                        )}

                        {(req.status === 'pending' || req.status === 'reviewed') && (
                          <button
                            onClick={() => handleRoleRequestConnect(req._id)}
                            className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition"
                          >
                            Connect
                          </button>
                        )}

                        {['pending', 'reviewed', 'connected'].includes(req.status) && (
                          <>
                            <button
                              onClick={() => handleRoleRequestStatusUpdate(req._id, 'accepted')}
                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRoleRequestStatusUpdate(req._id, 'rejected')}
                              className="px-3 py-1.5 text-xs bg-red-50 text-red-650 hover:bg-red-100 font-bold border border-red-200 rounded-lg transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {['connected', 'accepted', 'hired'].includes(req.status) && (
                          <Link
                            href={`/messages?userId=${req.applicantId?._id}`}
                            className="px-3 py-1.5 text-center text-xs bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition"
                          >
                            Message
                          </Link>
                        )}

                        {['accepted', 'connected'].includes(req.status) && (
                          <button
                            onClick={() => {
                              setSelectedAppForHire(req);
                              setHireForm({
                                teamRole: req.roleTitle,
                                customRole: '',
                                startDate: format(new Date(), 'yyyy-MM-dd'),
                                workMode: 'Remote',
                                notes: ''
                              });
                              setHireModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                          >
                            Hire / Add to Team
                          </button>
                        )}
                      </div>
                    </div>

                    <hr className="border-slate-200/60" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 font-sans">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Applicant Links & Resume:</p>
                        <div className="flex flex-wrap gap-3">
                          {req.resume && (
                            <a href={req.resume} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                              <FileText className="h-3.5 w-3.5" /> Resume Link
                            </a>
                          )}
                          {req.portfolioLink && (
                            <a href={req.portfolioLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                            </a>
                          )}
                          {req.github && (
                            <a href={req.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" /> GitHub
                            </a>
                          )}
                          {req.linkedin && (
                            <a href={req.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary font-bold hover:underline">
                              <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="font-bold text-slate-900">Application Info:</p>
                        <p><strong>Skills:</strong> {req.skills?.length > 0 ? req.skills.join(', ') : 'None specified'}</p>
                        {req.expectedSalary && <p><strong>Expected Stipend/Salary:</strong> {req.expectedSalary}</p>}
                        {req.availabilityDate && <p><strong>Availability:</strong> {format(new Date(req.availabilityDate), 'MMM d, yyyy')}</p>}
                      </div>
                    </div>

                    {req.message && (
                      <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs">
                        <p className="font-bold text-slate-750 mb-0.5">Cover Letter / Message:</p>
                        <p className="text-slate-600 italic">&quot;{req.message}&quot;</p>
                      </div>
                    )}

                    {req.reasonToJoin && (
                      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50 text-xs">
                        <p className="font-bold text-blue-800 mb-0.5">Why join this startup?</p>
                        <p className="text-slate-600">&quot;{req.reasonToJoin}&quot;</p>
                      </div>
                    )}
                  </div>
                ))
              )
            )}

            {activeRecruitmentTab === 'team' && (
              startupTeam.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No startup team members added yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {startupTeam.map((member, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-primary border text-sm overflow-hidden flex-shrink-0">
                          {member.image ? (
                            <img src={member.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            member.name?.[0]
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm font-sans">{member.name}</h4>
                          <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{member.role}</p>
                          <span className="text-[10px] text-primary font-semibold mt-0.5 block">{member.startupName}</span>
                        </div>
                      </div>

                      <Link
                        href={`/messages`}
                        className="px-3 py-1 bg-white border text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" /> Chat
                      </Link>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeRecruitmentTab === 'jobs' && (
              loadingJobs ? (
                <div className="flex justify-center p-8"><Loader className="h-6 w-6 animate-spin text-primary" /></div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No active job openings. Click &apos;Post Job Opening&apos; to create one.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {jobs.map((job) => (
                    <div key={job._id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between h-40">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-sm font-sans truncate pr-2">{job.title}</h4>
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">
                            {job.roleType}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted font-bold mt-1 uppercase tracking-wide">{job.startupName}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">{job.description}</p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t mt-2 text-[10px] font-bold text-gray-400 font-sans">
                        <span>Mode: {job.workMode}</span>
                        <span>Openings: {job.openings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Row for Startups & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
             {/* My Startups */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-xl font-bold text-heading mb-6">My Startups</h2>
               <div className="space-y-4">
                 {data.startups.map((startup) => (
                    <div key={startup._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg mr-4 flex items-center justify-center text-primary font-bold">
                          {(startup.name || '?')[0]}
                        </div>
                        <div>
                          <p className="font-bold text-heading">{startup.name}</p>
                          <p className="text-sm text-body truncate w-48">{startup.oneLinePitch}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedStartupForBadge(startup)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
                          title="Get Embed Badge"
                        >
                          <Code className="h-5 w-5" />
                        </button>
                        {!startup.isVerified && (
                           <button 
                             onClick={() => {
                               setVerificationTarget({ type: 'Startup', id: startup._id });
                               setShowVerificationModal(true);
                             }}
                             className="p-2 text-gray-400 hover:text-green-600 transition"
                             title="Get Verified Startup Badge"
                           >
                             <ShieldCheck className="h-5 w-5" />
                           </button>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
             </div>
          </div>
          
          <div className="space-y-6">
             {/* Recent Orders */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
               <h2 className="text-xl font-bold text-heading mb-6">Recent Orders</h2>
               <div className="space-y-4">
                 {data.orders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-heading text-sm truncate w-36">{order.productId?.name || 'Unknown Product'}</p>
                        <p className="text-xs text-body">By {order.userId?.name || 'Unknown User'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">${order.totalAmount}</p>
                        <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-750 rounded-full">{order.status}</span>
                      </div>
                    </div>
                  ))}
               </div>
             </div>
          </div>
        </div>

        {/* Products section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-heading flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                My Products
              </h2>
              <p className="text-sm text-body mt-1">Manage products linked to your startups.</p>
            </div>
            <button
              onClick={openNewProductModal}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add product
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map((product) => (
              <div key={product._id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between h-40">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-heading text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-body mt-1 line-clamp-2">{product.description}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">${product.price}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Stock: {product.stock}</span>
                  <span className={product.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {product.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200/60 pt-2">
                  <button
                    onClick={() => openEditProductModal(product)}
                    className="inline-flex items-center text-xs text-gray-700 hover:text-primary"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
          </>
        ) : (
          <FounderPortal />
        )}
      </main>

      {/* Post Job Opening Modal */}
      {jobModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setJobModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">Post Job Opening</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill out the role details for job seeker application.</p>
              </div>
              
              <form onSubmit={handleSaveJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Select Startup</label>
                  <select
                    value={jobForm.startupId}
                    onChange={(e) => setJobForm({...jobForm, startupId: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    required
                  >
                    <option value="">Choose Startup</option>
                    {data.startups.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer, Marketing Intern"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Role Type</label>
                    <select
                      value={jobForm.roleType}
                      onChange={(e) => setJobForm({...jobForm, roleType: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    >
                      <option value="Internship">Internship</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Co-founder">Co-founder</option>
                      <option value="Volunteer">Volunteer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Work Mode</label>
                    <select
                      value={jobForm.workMode}
                      onChange={(e) => setJobForm({...jobForm, workMode: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    >
                      <option value="Remote">Remote</option>
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Openings Count</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={jobForm.openings}
                      onChange={(e) => setJobForm({...jobForm, openings: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Salary/Stipend Min ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500 or 50000"
                      value={jobForm.salaryMin}
                      onChange={(e) => setJobForm({...jobForm, salaryMin: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Salary/Stipend Max ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000 or 80000"
                      value={jobForm.salaryMax}
                      onChange={(e) => setJobForm({...jobForm, salaryMax: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Duration (e.g. 3 mos)</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 months, Permanent"
                      value={jobForm.duration}
                      onChange={(e) => setJobForm({...jobForm, duration: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Application Deadline</label>
                    <input
                      type="date"
                      value={jobForm.deadline}
                      onChange={(e) => setJobForm({...jobForm, deadline: e.target.value})}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Experience Level</label>
                  <input
                    type="text"
                    placeholder="e.g. Entry-level, 1-2 years experience"
                    value={jobForm.experienceLevel}
                    onChange={(e) => setJobForm({...jobForm, experienceLevel: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React, Node.js, Growth Marketing"
                    value={jobForm.requiredSkills}
                    onChange={(e) => setJobForm({...jobForm, requiredSkills: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Role Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter details about responsibilities, qualifications, and benefits..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setJobModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingJob}
                    className="px-5 py-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition shadow-sm"
                  >
                    {savingJob ? 'Posting...' : 'Post opening'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Hire Modal */}
      {hireModalOpen && selectedAppForHire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-sans">Hire & Add to Team</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add applicant to startup team.</p>
              </div>
              <button 
                onClick={() => setHireModalOpen(false)} 
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleHireSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Startup</label>
                <input
                  type="text"
                  disabled
                  value={selectedAppForHire.startupId?.name}
                  className="w-full p-2.5 border rounded-xl text-sm bg-slate-50 cursor-not-allowed font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Role in Team</label>
                  <select
                    value={hireForm.teamRole}
                    onChange={(e) => setHireForm({...hireForm, teamRole: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  >
                    <option value="Intern">Intern</option>
                    <option value="Employee">Employee</option>
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Marketer">Marketer</option>
                    <option value="Co-founder">Co-founder</option>
                    <option value="Custom">Custom Role...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Work Mode</label>
                  <select
                    value={hireForm.workMode}
                    onChange={(e) => setHireForm({...hireForm, workMode: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              {hireForm.teamRole === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Custom Role Title</label>
                  <input
                    type="text"
                    required
                    value={hireForm.customRole}
                    onChange={(e) => setHireForm({...hireForm, customRole: e.target.value})}
                    placeholder="e.g. Growth Lead, React Developer"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Start Date</label>
                <input
                  type="date"
                  required
                  value={hireForm.startDate}
                  onChange={(e) => setHireForm({...hireForm, startDate: e.target.value})}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Notes / Instructions</label>
                <textarea
                  value={hireForm.notes}
                  onChange={(e) => setHireForm({...hireForm, notes: e.target.value})}
                  placeholder="Additional offer details or instructions for seeker dashboard..."
                  rows={2}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setHireModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-650 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hiring}
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {hiring ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Hiring...
                    </>
                  ) : (
                    'Add to Startup Team'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl relative">
            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-6">
              <h3 className="text-lg font-bold text-heading mb-1">
                {editingProduct ? 'Edit product' : 'Add new product'}
              </h3>
              <p className="text-sm text-body mb-4">
                Products appear in the Shop and on your startup profiles.
              </p>
              {productError && (
                <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {productError}
                </div>
              )}
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Startup</label>
                  <select
                    value={productForm.startupId}
                    onChange={(e) => handleProductChange('startupId', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select startup</option>
                    {data.startups &&
                      data.startups.map((startup) => (
                        <option key={startup._id} value={startup._id}>
                          {startup.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleProductChange('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleProductChange('description', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => handleProductChange('price', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={productForm.category}
                      onChange={(e) => handleProductChange('category', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Images</label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center px-3 py-2 rounded-lg border border-dashed border-gray-300 text-xs text-gray-700 cursor-pointer hover:border-primary hover:text-primary">
                      <ImageIcon className="h-4 w-4 mr-1" />
                      {uploadingImage ? 'Uploading...' : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    disabled={savingProduct}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-4 py-2 text-xs rounded-lg bg-primary text-white font-semibold hover:bg-blue-600 transition disabled:opacity-60"
                  >
                    {savingProduct ? 'Saving...' : 'Save product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {selectedStartupForBadge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setSelectedStartupForBadge(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-6">
              <BadgeGenerator 
                startupId={selectedStartupForBadge._id} 
                slug={selectedStartupForBadge.slug || selectedStartupForBadge._id} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <VerificationModal 
        isOpen={showVerificationModal} 
        onClose={() => setShowVerificationModal(false)}
        targetType={verificationTarget.type}
        targetId={verificationTarget.id}
      />
    </div>
  );
}

// Founder Journey Component
function FounderJourney() {
  const completed = founderJourney.filter(item => item.completed).length;
  const progress = Math.round((completed / founderJourney.length) * 100);
  
  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-950 flex items-center gap-2 uppercase tracking-wide">
          <Target className="h-5 w-5 text-primary" />
          Founder Journey
        </h3>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full font-sans">
          {progress}% Done
        </span>
      </div>
      
      <div className="w-full bg-gray-150 rounded-full h-1.5 mb-4">
        <div 
          className="bg-primary h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="space-y-2">
        {founderJourney.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-1.5 rounded-lg">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-green-500' : 'bg-gray-250'}`}>
              {item.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
            </div>
            <span className={`text-xs font-semibold ${item.completed ? 'text-muted line-through' : 'text-slate-800'}`}>
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Insight Panel Component
function AIInsightPanel() {
  const [currentInsight, setCurrentInsight] = useState(0);
  
  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-black text-slate-950 uppercase tracking-wide">AI Recommendation</h3>
      </div>
      <p className="text-xs text-slate-655 font-bold leading-relaxed font-sans italic">
        &quot;{aiInsights[currentInsight]}&quot;
      </p>
    </div>
  );
}
