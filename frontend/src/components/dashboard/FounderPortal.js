'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from 'next/navigation';
import { 
  Users, Rocket, Eye, Sparkles, Briefcase, DollarSign, Plus, X, 
  Check, Edit, ShieldCheck, FileText, Send, MessageSquare, Trash, 
  CheckCircle, AlertCircle, RefreshCw, BarChart2, Globe, MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvestmentRoom from './InvestmentRoom';

import { API_URL } from '@/utils/api';

export default function FounderPortal() {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState({
    startups: [],
    applications: [],
    roleRequests: [],
    teamMembers: [],
    investmentRequests: [],
    connectedInvestors: []
  });

  const [selectedStartupId, setSelectedStartupId] = useState('');
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, profile, team, hiring, investors, updates
  const [activeConnectionRoomId, setActiveConnectionRoomId] = useState(null);

  // Startup details edit form state
  const [startupForm, setStartupForm] = useState({
    name: '',
    oneLinePitch: '',
    description: '',
    industry: '',
    stage: 'idea',
    website: '',
    logo: '',
    pitchDeck: '',
    problemStatement: '',
    solution: '',
    fundingNeeded: '',
    teamSize: '',
    locationCity: '',
    locationCountry: '',
    locationRemote: false,
    hiringStatus: 'open',
    investmentStatus: 'raising',
    revenueStatus: 'pre-revenue',
    traction: ''
  });
  const [savingStartup, setSavingStartup] = useState(false);

  // Manual team add form state
  const [manualTeamForm, setManualTeamForm] = useState({
    email: '',
    role: 'Co-founder',
    workMode: 'Remote'
  });
  const [addingTeamMember, setAddingTeamMember] = useState(false);

  // Hire modal states
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [hiringApp, setHiringApp] = useState(null);
  const [hiringAppType, setHiringAppType] = useState('JobApplication'); // JobApplication or RoleRequest
  const [hireForm, setHireForm] = useState({
    role: '',
    workMode: 'Remote'
  });
  const [submittingHire, setSubmittingHire] = useState(false);

  // Startup updates state
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    description: '',
    visibleToConnectedInvestors: true
  });
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updatesList, setUpdatesList] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  // Mark connection as invested modal states
  const [investedModalOpen, setInvestedModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    equity: ''
  });
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/founder/portal-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPortalData(data.data);
        if (data.data.startups.length > 0) {
          const defaultId = data.data.startups[0]._id;
          setSelectedStartupId(defaultId);
          loadStartupForm(data.data.startups[0]);
          fetchStartupUpdates(defaultId);
        }
      } else {
        setError(data.error || 'Failed to fetch portal data');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchStartupUpdates = async (startupId) => {
    try {
      setLoadingUpdates(true);
      // We will pull the updates for this startup by fetching a startup updates endpoint.
      // Wait, we can implement an endpoint to get updates or just fetch the public updates for the startup
      const res = await fetch(`${API_URL}/api/startups/${startupId}`);
      const json = await res.json();
      if (json.success && json.data) {
        // Find updates listed under startup model if they are attached, or fetch via a new endpoint.
        // Let's create an endpoint in investorController or founder.js forupdates.
        // For simplicity, we can fetch all updates visible to connected investors
      }
      
      // Let's fetch all updates by founder
      const updatesRes = await fetch(`${API_URL}/api/investor/updates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatesJson = await updatesRes.json();
      if (updatesJson.success) {
        setUpdatesList(updatesJson.data.filter(u => u.startupId?._id === startupId || u.startupId === startupId));
      }
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setLoadingUpdates(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();
    }
  }, [token]);

  const handleStartupSelect = (e) => {
    const startupId = e.target.value;
    setSelectedStartupId(startupId);
    const startup = portalData.startups.find(s => s._id === startupId);
    if (startup) {
      loadStartupForm(startup);
      fetchStartupUpdates(startupId);
    }
  };

  const loadStartupForm = (startup) => {
    setStartupForm({
      name: startup.name || '',
      oneLinePitch: startup.oneLinePitch || '',
      description: startup.description || '',
      industry: startup.industry || '',
      stage: startup.stage || 'idea',
      website: startup.website || '',
      logo: startup.logo || '',
      pitchDeck: startup.pitchDeck || '',
      problemStatement: startup.problemStatement || '',
      solution: startup.solution || '',
      fundingNeeded: startup.fundingNeeded || '',
      teamSize: startup.teamSize || '',
      locationCity: startup.location?.city || '',
      locationCountry: startup.location?.country || '',
      locationRemote: startup.location?.remote || false,
      hiringStatus: startup.hiringStatus || 'open',
      investmentStatus: startup.investmentStatus || 'raising',
      revenueStatus: startup.revenueStatus || 'pre-revenue',
      traction: startup.traction || ''
    });
  };

  const handleStartupFormSubmit = async (e) => {
    e.preventDefault();
    setSavingStartup(true);
    try {
      const res = await fetch(`${API_URL}/api/founder/startup/${selectedStartupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...startupForm,
          location: {
            city: startupForm.locationCity,
            country: startupForm.locationCountry,
            remote: startupForm.locationRemote
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Startup profile updated successfully!', 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Network error saving profile', 'error');
    } finally {
      setSavingStartup(false);
    }
  };

  // Team Management Handlers
  const handleManualTeamSubmit = async (e) => {
    e.preventDefault();
    setAddingTeamMember(true);
    try {
      const res = await fetch(`${API_URL}/api/founder/team/add-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: selectedStartupId,
          ...manualTeamForm
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Team member added successfully!', 'success');
        setManualTeamForm({ email: '', role: 'Co-founder', workMode: 'Remote' });
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to add member', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error communicating with backend', 'error');
    } finally {
      setAddingTeamMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;
    try {
      const res = await fetch(`${API_URL}/api/founder/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Team member removed.', 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to remove member', 'error');
      }
    } catch (err) {
      addToast('Error removing team member', 'error');
    }
  };

  const handleChangeMemberRole = async (memberId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/team/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamRole: newRole })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Role updated successfully.', 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to update role', 'error');
      }
    } catch (err) {
      addToast('Error updating role', 'error');
    }
  };

  // Hiring and Applications Handlers
  const handleUpdateAppStatus = async (appId, type, nextStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/applications/${appId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus, type })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Application status updated to ${nextStatus}`, 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to update application', 'error');
      }
    } catch (err) {
      addToast('Error updating status', 'error');
    }
  };

  const openHireModal = (app, type) => {
    setHiringApp(app);
    setHiringAppType(type);
    setHireForm({
      role: app.roleApplied || app.roleTitle || 'Developer',
      workMode: 'Remote'
    });
    setHireModalOpen(true);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    setSubmittingHire(true);
    try {
      const endpoint = hiringAppType === 'RoleRequest'
        ? `${API_URL}/api/founder/role-requests/${hiringApp._id}/hire`
        : `${API_URL}/api/founder/applications/${hiringApp._id}/hire`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teamRole: hireForm.role,
          workMode: hireForm.workMode,
          startDate: new Date()
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Applicant successfully hired into your team!', 'success');
        setHireModalOpen(false);
        fetchPortalData();
      } else {
        addToast(data.error || 'Hiring failed', 'error');
      }
    } catch (err) {
      addToast('Network error during hiring process', 'error');
    } finally {
      setSubmittingHire(false);
    }
  };

  // Investor Requests Handlers
  const handleAcceptInvestorRequest = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/investor-requests/${requestId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Investor request accepted! Connection established & chat unlocked.', 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to accept investor', 'error');
      }
    } catch (err) {
      addToast('Error accepting request', 'error');
    }
  };

  const handleRejectInvestorRequest = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/founder/investor-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Investor request declined.', 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to decline investor', 'error');
      }
    } catch (err) {
      addToast('Error declining request', 'error');
    }
  };

  // Mark connection as invested handlers
  const openInvestedModal = (connection) => {
    setSelectedConnection(connection);
    setInvestmentForm({
      amount: '',
      equity: ''
    });
    setInvestedModalOpen(true);
  };

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInvestment(true);
    try {
      const res = await fetch(`${API_URL}/api/founder/connections/${selectedConnection._id}/invested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          investmentAmount: Number(investmentForm.amount),
          equityPercentage: Number(investmentForm.equity)
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Investment status completed! Startup moved to investor portfolio.', 'success');
        setInvestedModalOpen(false);
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to complete investment', 'error');
      }
    } catch (err) {
      addToast('Error updating connection status', 'error');
    } finally {
      setSubmittingInvestment(false);
    }
  };

  // Post updates handlers
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setPostingUpdate(true);
    try {
      const res = await fetch(`${API_URL}/api/founder/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: selectedStartupId,
          ...newUpdate
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Update posted successfully!', 'success');
        setNewUpdate({ title: '', description: '', visibleToConnectedInvestors: true });
        fetchStartupUpdates(selectedStartupId);
      } else {
        addToast(data.error || 'Failed to post update', 'error');
      }
    } catch (err) {
      addToast('Error posting update', 'error');
    } finally {
      setPostingUpdate(false);
    }
  };

  // Filter lists based on selected startup
  const startup = portalData.startups.find(s => s._id === selectedStartupId);
  const startupApps = portalData.applications.filter(a => a.startupId?._id === selectedStartupId || a.startupId === selectedStartupId);
  const startupRoleReqs = portalData.roleRequests.filter(r => r.startupId?._id === selectedStartupId || r.startupId === selectedStartupId);
  const startupTeam = portalData.teamMembers.filter(t => t.startupId?._id === selectedStartupId || t.startupId === selectedStartupId);
  const startupInvestReqs = portalData.investmentRequests.filter(i => i.startupId?._id === selectedStartupId || i.startupId === selectedStartupId);
  const startupConnections = portalData.connectedInvestors.filter(c => c.startupId?._id === selectedStartupId || c.startupId === selectedStartupId);

  // Combine applications & role requests for unified hiring board
  const allApplications = [
    ...startupApps.map(a => ({ ...a, type: 'JobApplication', name: a.applicantId?.fullName || a.applicantId?.name || 'Applicant', role: a.jobId?.title || 'Job Seeker' })),
    ...startupRoleReqs.map(r => ({ ...r, type: 'RoleRequest', name: r.applicantId?.fullName || r.applicantId?.name || 'Applicant', role: `${r.requestType}: ${r.roleTitle}` }))
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (portalData.startups.length === 0) {
    return (
      <div className="text-center py-16 bg-white border rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
        <Rocket className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Startups Found</h2>
        <p className="text-sm text-gray-500 mb-6 font-semibold">
          You need to create a startup profile first before you can manage applications, team members, or raise funding.
        </p>
        <button
          onClick={() => router.push('/startups/create')}
          className="btn-primary flex items-center gap-1.5 mx-auto text-xs font-bold font-sans"
        >
          <Plus className="h-4 w-4" />
          Create a Startup
        </button>
      </div>
    );
  }

  if (activeConnectionRoomId) {
    return (
      <InvestmentRoom 
        connectionId={activeConnectionRoomId} 
        onClose={() => {
          setActiveConnectionRoomId(null);
          fetchPortalData();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Startup selector dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">Active Startup</label>
          <select
            value={selectedStartupId}
            onChange={handleStartupSelect}
            className="w-full sm:w-64 p-2.5 border rounded-xl bg-white text-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {portalData.startups.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {['analytics', 'profile', 'team', 'hiring', 'investors', 'updates'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Startup Views</h3>
                  <div className="p-2.5 bg-blue-50 text-primary rounded-xl"><Eye className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{startup?.metrics?.views || 0}</p>
              </div>

              <div className="card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Total Applications</h3>
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Briefcase className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{allApplications.length}</p>
              </div>

              <div className="card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Connected Investors</h3>
                  <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl"><DollarSign className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{startupConnections.length}</p>
              </div>

              <div className="card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Investment Requests</h3>
                  <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl"><Sparkles className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{startupInvestReqs.length}</p>
              </div>

              <div className="card p-6 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Team Members</h3>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{(startupTeam.length || 0) + 1}</p>
              </div>
            </div>
          )}

          {/* PROFILE DATA TAB */}
          {activeTab === 'profile' && (
            <div className="card p-6 bg-white border border-slate-200">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Edit Startup Profile
              </h3>
              <form onSubmit={handleStartupFormSubmit} className="space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Startup Name</label>
                    <input
                      type="text"
                      value={startupForm.name}
                      onChange={(e) => setStartupForm({...startupForm, name: e.target.value})}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Logo URL</label>
                    <input
                      type="text"
                      value={startupForm.logo}
                      onChange={(e) => setStartupForm({...startupForm, logo: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">One Line Pitch</label>
                  <input
                    type="text"
                    value={startupForm.oneLinePitch}
                    onChange={(e) => setStartupForm({...startupForm, oneLinePitch: e.target.value})}
                    placeholder="Short description of your product"
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Description</label>
                  <textarea
                    value={startupForm.description}
                    onChange={(e) => setStartupForm({...startupForm, description: e.target.value})}
                    rows={4}
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Industry</label>
                    <input
                      type="text"
                      value={startupForm.industry}
                      onChange={(e) => setStartupForm({...startupForm, industry: e.target.value})}
                      placeholder="e.g. AI, FinTech"
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Stage</label>
                    <select
                      value={startupForm.stage}
                      onChange={(e) => setStartupForm({...startupForm, stage: e.target.value})}
                      className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="idea">Idea Stage</option>
                      <option value="mvp">MVP Stage</option>
                      <option value="first_customer">First Customer</option>
                      <option value="revenue">Generating Revenue</option>
                      <option value="funded">Funded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Funding Needed ($)</label>
                    <input
                      type="number"
                      value={startupForm.fundingNeeded}
                      onChange={(e) => setStartupForm({...startupForm, fundingNeeded: e.target.value})}
                      placeholder="e.g. 500000"
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Website</label>
                    <input
                      type="text"
                      value={startupForm.website}
                      onChange={(e) => setStartupForm({...startupForm, website: e.target.value})}
                      placeholder="https://..."
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Pitch Deck Link</label>
                    <input
                      type="text"
                      value={startupForm.pitchDeck}
                      onChange={(e) => setStartupForm({...startupForm, pitchDeck: e.target.value})}
                      placeholder="Google Drive link etc."
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Team Size</label>
                    <input
                      type="number"
                      value={startupForm.teamSize}
                      onChange={(e) => setStartupForm({...startupForm, teamSize: e.target.value})}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">City</label>
                    <input
                      type="text"
                      value={startupForm.locationCity}
                      onChange={(e) => setStartupForm({...startupForm, locationCity: e.target.value})}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Country</label>
                    <input
                      type="text"
                      value={startupForm.locationCountry}
                      onChange={(e) => setStartupForm({...startupForm, locationCountry: e.target.value})}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center pt-8">
                    <input
                      type="checkbox"
                      id="locationRemote"
                      checked={startupForm.locationRemote}
                      onChange={(e) => setStartupForm({...startupForm, locationRemote: e.target.checked})}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label htmlFor="locationRemote" className="ml-2 font-bold text-slate-700">Remote Only Startup</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Problem Statement</label>
                    <textarea
                      value={startupForm.problemStatement}
                      onChange={(e) => setStartupForm({...startupForm, problemStatement: e.target.value})}
                      rows={3}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Solution</label>
                    <textarea
                      value={startupForm.solution}
                      onChange={(e) => setStartupForm({...startupForm, solution: e.target.value})}
                      rows={3}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Hiring Status</label>
                    <select
                      value={startupForm.hiringStatus}
                      onChange={(e) => setStartupForm({...startupForm, hiringStatus: e.target.value})}
                      className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="open">Actively Hiring</option>
                      <option value="closed">Not Hiring</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Investment Status</label>
                    <select
                      value={startupForm.investmentStatus}
                      onChange={(e) => setStartupForm({...startupForm, investmentStatus: e.target.value})}
                      className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="raising">Actively Raising</option>
                      <option value="closed">Closed / Bootstrapped</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Revenue Status</label>
                    <select
                      value={startupForm.revenueStatus}
                      onChange={(e) => setStartupForm({...startupForm, revenueStatus: e.target.value})}
                      className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="pre-revenue">Pre-revenue</option>
                      <option value="generating-revenue">Generating Revenue</option>
                      <option value="profitable">Profitable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Traction Description</label>
                  <input
                    type="text"
                    value={startupForm.traction}
                    onChange={(e) => setStartupForm({...startupForm, traction: e.target.value})}
                    placeholder="e.g. 5K users, $15k MRR, etc."
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="submit"
                    disabled={savingStartup}
                    className="btn-primary flex items-center gap-1.5 text-xs font-bold"
                  >
                    {savingStartup && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Save Profile Details
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TEAM MANAGEMENT TAB */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Team list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-6 bg-white border border-slate-200">
                  <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Startup Core Team
                  </h3>

                  {/* Founder Row */}
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl mb-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{user.name} (You)</h4>
                        <p className="text-xs text-slate-500 font-semibold">Founder & CEO</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-primary text-white font-bold text-[9.5px] uppercase tracking-wider rounded-full">
                      Founder
                    </span>
                  </div>

                  {startupTeam.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                      No other team members yet. Invite team members manually or accept job applicants!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {startupTeam.map(member => (
                        <div key={member._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 border flex-shrink-0">
                              {member.image ? (
                                <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{member.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-primary">{member.teamRole}</span>
                                <span className="text-[10px] text-gray-400">• Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <select
                              value={member.teamRole}
                              onChange={(e) => handleChangeMemberRole(member._id, e.target.value)}
                              className="text-xs font-bold bg-white border p-1.5 rounded-lg text-slate-700"
                            >
                              <option value="Co-founder">Co-founder</option>
                              <option value="CTO">CTO</option>
                              <option value="Lead Developer">Lead Developer</option>
                              <option value="Developer">Developer</option>
                              <option value="Marketing Manager">Marketing Manager</option>
                              <option value="Advisor">Advisor</option>
                              <option value="Intern">Intern</option>
                            </select>
                            <button
                              onClick={() => handleRemoveTeamMember(member._id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 border rounded-lg hover:border-red-200 transition"
                              title="Remove member"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/messages?userId=${member.userId?._id || member.userId}`)}
                              className="p-1.5 text-slate-500 hover:bg-slate-100 border rounded-lg transition"
                              title="Message member"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Member manually card */}
              <div className="space-y-4">
                <div className="card p-6 bg-white border border-slate-200 text-sm">
                  <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-primary" />
                    Add Team Member
                  </h3>
                  <form onSubmit={handleManualTeamSubmit} className="space-y-4">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">User Email</label>
                      <input
                        type="email"
                        value={manualTeamForm.email}
                        onChange={(e) => setManualTeamForm({...manualTeamForm, email: e.target.value})}
                        placeholder="email@example.com"
                        className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">Team Role</label>
                      <select
                        value={manualTeamForm.role}
                        onChange={(e) => setManualTeamForm({...manualTeamForm, role: e.target.value})}
                        className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Co-founder">Co-founder</option>
                        <option value="CTO">CTO</option>
                        <option value="Lead Developer">Lead Developer</option>
                        <option value="Developer">Developer</option>
                        <option value="Marketing Manager">Marketing Manager</option>
                        <option value="Advisor">Advisor</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">Work Mode</label>
                      <select
                        value={manualTeamForm.workMode}
                        onChange={(e) => setManualTeamForm({...manualTeamForm, workMode: e.target.value})}
                        className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={addingTeamMember}
                      className="w-full btn-primary flex justify-center items-center gap-1.5 text-xs font-bold"
                    >
                      {addingTeamMember && <RefreshCw className="h-3 w-3 animate-spin" />}
                      Add Member
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* HIRING & APPLICATIONS TAB */}
          {activeTab === 'hiring' && (
            <div className="card p-6 bg-white border border-slate-200">
              <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Talent Applications Pipeline
              </h3>

              {allApplications.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">
                  No applications received yet. Post jobs or share your startup link to attract talents!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-800">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-bold font-sans border-b">
                      <tr>
                        <th className="px-6 py-4">Applicant</th>
                        <th className="px-6 py-4">Role Applied</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {allApplications.map(app => (
                        <tr key={app._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-100 border">
                                {app.applicantId?.profileImage ? (
                                  <img src={app.applicantId.profileImage} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                    {app.name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-none">{app.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{app.applicantId?.location?.city || 'Local'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900">{app.role}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                              app.type === 'RoleRequest' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {app.type === 'RoleRequest' ? 'Direct Custom' : 'Job Posting'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              app.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' :
                              app.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                              app.status === 'hired' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              app.status === 'connected' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                              'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {app.status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateAppStatus(app._id, app.type, 'reviewed')}
                                  className="px-2.5 py-1.5 border rounded-lg text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                                >
                                  Review
                                </button>
                              )}
                              {app.status === 'reviewed' && (
                                <button
                                  onClick={() => handleUpdateAppStatus(app._id, app.type, 'connected')}
                                  className="px-2.5 py-1.5 border rounded-lg text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition border-teal-200"
                                >
                                  Unlock Chat
                                </button>
                              )}
                              {['reviewed', 'connected', 'shortlisted'].includes(app.status) && (
                                <>
                                  <button
                                    onClick={() => openHireModal(app, app.type)}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition"
                                  >
                                    Accept & Hire
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAppStatus(app._id, app.type, 'rejected')}
                                    className="px-2.5 py-1.5 border rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition border-red-200"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => router.push(`/messages?userId=${app.applicantId?._id || app.applicantId}`)}
                                className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
                                title="Chat"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              {app.resume && (
                                <a
                                  href={app.resume}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
                                  title="View Resume"
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVESTORS TAB */}
          {activeTab === 'investors' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests Received */}
              <div className="card p-6 bg-white border border-slate-200">
                <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Received Investor Requests ({startupInvestReqs.length})
                </h3>

                {startupInvestReqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                    No investment interest requests received yet. Reach out to open investors or update pitch metrics!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {startupInvestReqs.map(req => (
                      <div key={req._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                        <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200/50">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                              {req.investorId?.profileImage && (
                                <img src={req.investorId.profileImage} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-none">{req.investorId?.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{req.investorId?.headline || 'Investor'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
                            req.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                            req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-slate-600 text-xs italic font-medium">&quot;{req.message}&quot;</p>
                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Intended Ticket</span>
                              <p className="font-black text-slate-800 text-xs">{req.interestedAmount || req.investmentRange || 'Not Specified'}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Deal Type</span>
                              <p className="font-black text-slate-800 text-xs">{req.investmentType || 'Equity'}</p>
                            </div>
                          </div>
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptInvestorRequest(req._id)}
                              className="flex-1 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:shadow-md transition"
                            >
                              Accept Interest
                            </button>
                            <button
                              onClick={() => handleRejectInvestorRequest(req._id)}
                              className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Investors list */}
              <div className="card p-6 bg-white border border-slate-200">
                <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Connected Investors ({startupConnections.length})
                </h3>

                {startupConnections.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                    No connected investors yet. Accept investor requests to unlock portfolio relations!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {startupConnections.map(c => (
                      <div key={c._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200/50">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                              {c.investorId?.profileImage && (
                                <img src={c.investorId.profileImage} alt="" className="h-full w-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 leading-none">{c.investorId?.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{c.investorId?.email}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
                            c.status === 'invested' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-semibold text-slate-700">
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Investment Stage</span>
                            <p className="font-bold text-slate-800">{c.pipelineStage}</p>
                          </div>
                          {c.status === 'invested' && (
                            <div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Investment</span>
                              <p className="font-bold text-slate-800">${c.investmentAmount.toLocaleString()} ({c.equityPercentage}%)</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setActiveConnectionRoomId(c._id)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Briefcase className="h-4 w-4" /> Investment Room
                          </button>
                          <button
                            onClick={() => router.push(`/messages?userId=${c.investorId?._id || c.investorId}`)}
                            className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <MessageSquare className="h-4 w-4" /> Message
                          </button>
                          {c.status !== 'invested' && (
                            <button
                              onClick={() => openInvestedModal(c)}
                              className="flex-1 py-2 bg-green-500 text-white hover:bg-green-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                            >
                              <Check className="h-4 w-4" /> Complete Deal
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STARTUP UPDATES TAB */}
          {activeTab === 'updates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to create update */}
              <div className="card p-6 bg-white border border-slate-200 text-sm">
                <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Post Startup Update
                </h3>
                <form onSubmit={handlePostUpdate} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Update Title</label>
                    <input
                      type="text"
                      value={newUpdate.title}
                      onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                      placeholder="e.g. Q2 Growth Metrics, Launching v2.0"
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Description / Content</label>
                    <textarea
                      value={newUpdate.description}
                      onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                      placeholder="Write your update details..."
                      rows={5}
                      className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="visibleToConnected"
                      checked={newUpdate.visibleToConnectedInvestors}
                      onChange={(e) => setNewUpdate({...newUpdate, visibleToConnectedInvestors: e.target.checked})}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label htmlFor="visibleToConnected" className="ml-2 font-bold text-slate-700">Visible only to connected investors</label>
                  </div>

                  <button
                    type="submit"
                    disabled={postingUpdate}
                    className="w-full btn-primary flex justify-center items-center gap-1.5 font-bold"
                  >
                    {postingUpdate && <RefreshCw className="h-3 w-3 animate-spin" />}
                    Post Update
                  </button>
                </form>
              </div>

              {/* List of updates */}
              <div className="lg:col-span-2 space-y-4">
                <div className="card p-6 bg-white border border-slate-200">
                  <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Previous Updates
                  </h3>

                  {loadingUpdates ? (
                    <div className="flex justify-center py-6">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : updatesList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm font-semibold">
                      No startup updates posted yet.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {updatesList.map(up => (
                        <div key={up._id} className="p-4 bg-slate-50 border rounded-xl">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-slate-900 text-sm">{up.title}</h4>
                            <span className="text-[10px] text-gray-400 font-bold">{new Date(up.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed mb-3">{up.description}</p>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                            up.visibleToConnectedInvestors ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-green-50 text-green-700 border border-green-150'
                          }`}>
                            {up.visibleToConnectedInvestors ? 'Investor Private' : 'Public'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hire Modal */}
      {hireModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Hire {hiringApp?.name}</h2>
              <button onClick={() => setHireModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleHireSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Official Team Role</label>
                <input
                  type="text"
                  value={hireForm.role}
                  onChange={(e) => setHireForm({...hireForm, role: e.target.value})}
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Work Mode</label>
                <select
                  value={hireForm.workMode}
                  onChange={(e) => setHireForm({...hireForm, workMode: e.target.value})}
                  className="w-full p-2.5 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setHireModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                  disabled={submittingHire}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHire}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                >
                  {submittingHire ? 'Hiring...' : 'Hire Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Deal (Mark connection as invested) Modal */}
      {investedModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Complete Investment Deal</h2>
              <button onClick={() => setInvestedModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4 font-sans">
              <div className="p-3.5 bg-green-50 border border-green-150 rounded-2xl flex items-center gap-2.5 mb-2">
                <AlertCircle className="h-5 w-5 text-green-600" />
                <p className="text-xs text-green-700 font-semibold leading-relaxed">
                  Marking connection as Invested will publish this connection in the investor&apos;s portfolio portal.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Investment Amount ($)</label>
                <input
                  type="number"
                  value={investmentForm.amount}
                  onChange={(e) => setInvestmentForm({...investmentForm, amount: e.target.value})}
                  placeholder="e.g. 50000"
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Equity Percentage Received (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={investmentForm.equity}
                  onChange={(e) => setInvestmentForm({...investmentForm, equity: e.target.value})}
                  placeholder="e.g. 2.5"
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setInvestedModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                  disabled={submittingInvestment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvestment}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition disabled:opacity-50"
                >
                  {submittingInvestment ? 'Completing...' : 'Mark as Invested'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
