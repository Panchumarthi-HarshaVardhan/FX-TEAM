'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRouter } from 'next/navigation';
import { 
  Users, Rocket, Eye, Sparkles, Briefcase, DollarSign, Plus, X, 
  Check, Edit, ShieldCheck, FileText, Send, MessageSquare, Trash, 
  CheckCircle, AlertCircle, RefreshCw, BarChart2, Globe, MapPin, 
  ChevronRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import InvestmentRoom from './InvestmentRoom';

import { API_URL } from '@/utils/api';

export default function InvestorPortal() {
  const { token, user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [portalData, setPortalData] = useState({
    analytics: {
      totalConnectedStartups: 0,
      totalInvestedStartups: 0,
      pendingRequests: 0,
      totalInvestmentAmount: 0,
      startupsInDueDiligence: 0,
      recentUpdatesCount: 0
    },
    connections: [],
    pendingRequests: [],
    updates: []
  });

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, connections, pipeline, portfolio, updates
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [activeConnectionRoomId, setActiveConnectionRoomId] = useState(null);

  // Private notes modal state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Mark as invested modal state
  const [investedModalOpen, setInvestedModalOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    equity: ''
  });
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/investor/portal-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPortalData(data.data);
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

  useEffect(() => {
    if (token) {
      fetchPortalData();
    }
  }, [token]);

  // Update pipeline stage handler
  const handleUpdateStage = async (connectionId, newStage) => {
    try {
      const res = await fetch(`${API_URL}/api/investor/pipeline/${connectionId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Pipeline stage updated to ${newStage}`, 'success');
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to update stage', 'error');
      }
    } catch (err) {
      addToast('Error updating pipeline stage', 'error');
    }
  };

  // Notes Modal actions
  const openNotesModal = (connection) => {
    setSelectedConnection(connection);
    setCurrentNotes(connection.privateNotes || '');
    setNotesModalOpen(true);
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    setSavingNotes(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/pipeline/${selectedConnection._id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: currentNotes })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Private notes saved successfully!', 'success');
        setNotesModalOpen(false);
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to save notes', 'error');
      }
    } catch (err) {
      addToast('Error saving private notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  // Mark connection as invested handlers
  const openInvestedModal = (connection) => {
    setSelectedConnection(connection);
    setInvestmentForm({
      amount: connection.startupId?.fundingNeeded || '',
      equity: ''
    });
    setInvestedModalOpen(true);
  };

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInvestment(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/pipeline/${selectedConnection._id}/invested`, {
        method: 'PATCH',
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
        addToast('Investment deal completed! Startup added to portfolio.', 'success');
        setInvestedModalOpen(false);
        fetchPortalData();
      } else {
        addToast(data.error || 'Failed to complete investment', 'error');
      }
    } catch (err) {
      addToast('Error marking investment deal', 'error');
    } finally {
      setSubmittingInvestment(false);
    }
  };

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

  const investedConnections = portalData.connections.filter(c => c.status === 'invested');

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
      {/* Portal Tabs Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">Investment Mission Control</h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Manage pipeline stage, private notes, and portfolio startups.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['analytics', 'connections', 'pipeline', 'portfolio', 'updates'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                activeTab === tab 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'connections' ? 'Connections' : tab === 'pipeline' ? 'Deal pipeline' : tab}
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
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Connected Startups</h3>
                  <div className="p-2.5 bg-blue-50 text-primary rounded-xl"><Users className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{portalData.analytics.totalConnectedStartups}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Invested Startups</h3>
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><Briefcase className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{portalData.analytics.totalInvestedStartups}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Total Invested Amount</h3>
                  <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-xl"><DollarSign className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">${portalData.analytics.totalInvestmentAmount.toLocaleString()}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Due Diligence Pipeline</h3>
                  <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-xl"><Sparkles className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{portalData.analytics.startupsInDueDiligence}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Pending Requests</h3>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Send className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{portalData.analytics.pendingRequests}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col justify-between h-36">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider font-sans">Founder Updates</h3>
                  <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl"><FileText className="h-5 w-5" /></div>
                </div>
                <p className="text-3xl font-black text-slate-900">{portalData.analytics.recentUpdatesCount}</p>
              </div>
            </div>
          )}

          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Active Startup Connections ({portalData.connections.length})
              </h3>

              {portalData.connections.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">
                  No active startup connections. Explore startups and send investment interest requests to get connected!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portalData.connections.map(c => (
                    <div key={c._id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 text-primary rounded-xl flex items-center justify-center font-bold">
                              {c.startupId?.name?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 leading-none">{c.startupId?.name || 'Startup'}</h4>
                              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{c.startupId?.industry || 'Unknown Sector'}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                            c.status === 'invested' ? 'bg-green-50 text-green-700 border border-green-200' :
                            c.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                          {c.startupId?.oneLinePitch || c.startupId?.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 border-t pt-3 text-xs text-slate-700 font-sans">
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Pipeline Stage</span>
                            <select
                              value={c.pipelineStage}
                              onChange={(e) => handleUpdateStage(c._id, e.target.value)}
                              className="text-xs font-bold bg-white border p-1 rounded-lg text-slate-700 outline-none w-full"
                            >
                              {['Connected', 'Meeting', 'Due Diligence', 'Negotiation', 'Invested', 'Rejected'].map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Founder Contact</span>
                            <p className="font-bold text-slate-800 truncate">{c.founderId?.name || 'Founder'}</p>
                          </div>
                        </div>

                        {c.privateNotes && (
                          <div className="mt-3.5 bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100 text-xs">
                            <span className="font-bold text-yellow-800 text-[10px] uppercase block mb-1">Your Private Notes:</span>
                            <p className="text-slate-600 italic line-clamp-2">&quot;{c.privateNotes}&quot;</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <button
                          onClick={() => setActiveConnectionRoomId(c._id)}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Briefcase className="h-3.5 w-3.5" /> Investment Room
                        </button>
                        <button
                          onClick={() => router.push(`/messages?userId=${c.founderId?._id || c.founderId}`)}
                          className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1 bg-white"
                          title="Direct Chat"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </button>
                        <button
                          onClick={() => openNotesModal(c)}
                          className="px-3 py-2 border rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1 bg-white"
                          title="Private Notes"
                        >
                          <Edit className="h-3.5 w-3.5" /> Notes
                        </button>
                        {c.status !== 'invested' && (
                          <button
                            onClick={() => openInvestedModal(c)}
                            className="flex-1 py-2 bg-green-500 text-white hover:bg-green-600 font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Invest
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Visual Investment Pipeline
              </h3>

              {portalData.connections.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">
                  No startups in pipeline.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
                  {['Connected', 'Meeting', 'Due Diligence', 'Negotiation', 'Invested', 'Rejected'].map(stage => {
                    const stageStartups = portalData.connections.filter(c => c.pipelineStage === stage);
                    return (
                      <div key={stage} className="bg-slate-50 p-4 rounded-xl min-w-[200px] flex flex-col h-[500px]">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-200">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">{stage}</h4>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {stageStartups.length}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {stageStartups.map(c => (
                            <div key={c._id} className="bg-white p-3 rounded-lg border border-slate-100 shadow-2xs hover:shadow-xs transition">
                              <h5 className="font-bold text-xs text-slate-900 mb-1">{c.startupId?.name}</h5>
                              <p className="text-[10px] text-slate-500 mb-2 truncate">{c.startupId?.industry}</p>
                              
                              <div className="flex justify-between items-center pt-2 border-t text-[10px]">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => openNotesModal(c)}
                                    className="text-primary font-bold hover:underline"
                                  >
                                    Notes
                                  </button>
                                  <button 
                                    onClick={() => setActiveConnectionRoomId(c._id)}
                                    className="text-slate-800 font-bold hover:underline"
                                  >
                                    Room
                                  </button>
                                </div>
                                <select 
                                  value={c.pipelineStage}
                                  onChange={(e) => handleUpdateStage(c._id, e.target.value)}
                                  className="bg-transparent border-0 text-[10px] text-slate-600 font-bold focus:ring-0 cursor-pointer"
                                >
                                  {['Connected', 'Meeting', 'Due Diligence', 'Negotiation', 'Invested', 'Rejected'].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                          {stageStartups.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-[10px] font-semibold">
                              Empty Stage
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Portfolio Startups ({investedConnections.length})
              </h3>

              {investedConnections.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">
                  No portfolio deals finalized yet. Mark active connections as &quot;Invested&quot; to add them to your portfolio.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-800">
                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 font-bold font-sans border-b">
                      <tr>
                        <th className="px-6 py-4">Startup</th>
                        <th className="px-6 py-4">Sector</th>
                        <th className="px-6 py-4">Funding Ticket</th>
                        <th className="px-6 py-4">Equity Stake</th>
                        <th className="px-6 py-4">Closing Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {investedConnections.map(c => (
                        <tr key={c._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-blue-150 rounded-xl flex items-center justify-center font-bold text-primary border">
                                {c.startupId?.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 leading-none">{c.startupId?.name || 'Startup'}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{c.startupId?.stage || 'Seed'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900">{c.startupId?.industry || 'FinTech'}</td>
                          <td className="px-6 py-4 text-slate-900 font-bold">
                            ${c.investmentAmount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {c.equityPercentage || '0'}%
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {c.investedAt ? new Date(c.investedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => setActiveConnectionRoomId(c._id)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Briefcase className="h-3.5 w-3.5" /> Room
                              </button>
                              <button
                                onClick={() => router.push(`/messages?userId=${c.founderId?._id || c.founderId}`)}
                                className="px-2.5 py-1.5 border rounded-lg text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                              >
                                <MessageSquare className="h-3.5 w-3.5" /> Message Founder
                              </button>
                              <button
                                onClick={() => openNotesModal(c)}
                                className="p-1.5 border rounded-lg text-slate-500 hover:bg-slate-50 transition"
                                title="Edit Private Notes"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
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

          {/* UPDATES TAB */}
          {activeTab === 'updates' && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-md font-black text-slate-900 mb-6 uppercase tracking-wider border-b pb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Founder Updates Feed ({portalData.updates.length})
              </h3>

              {portalData.updates.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-semibold">
                  No updates posted by your connected startups yet.
                </div>
              ) : (
                <div className="space-y-6 max-w-3xl mx-auto">
                  {portalData.updates.map(up => (
                    <div key={up._id} className="p-6 bg-slate-50 border rounded-2xl shadow-2xs">
                      <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-primary text-xs">
                            {up.startupId?.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-none">{up.startupId?.name}</h4>
                            <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Posted Update</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">{new Date(up.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h5 className="font-black text-slate-800 text-base mb-2">{up.title}</h5>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed mb-4">{up.description}</p>

                      <div className="flex justify-between items-center text-xs">
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full font-bold text-[9px] uppercase tracking-wider">
                          Investor Update
                        </span>
                        <button
                          onClick={() => router.push(`/startups/${up.startupId?._id || up.startupId}`)}
                          className="text-primary font-bold hover:underline flex items-center gap-0.5"
                        >
                          View Startup Profile <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Notes Modal */}
      {notesModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Edit Private Notes</h2>
              <button onClick={() => setNotesModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSaveNotes} className="p-6 space-y-4 font-sans">
              <div className="p-3 bg-blue-50 border border-blue-150 text-blue-800 rounded-xl text-xs font-semibold leading-relaxed">
                Private notes are only visible to you. The founder or other users cannot view these notes.
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Notes</label>
                <textarea
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Record deal status, due diligence progress, meeting notes, etc..."
                  rows={6}
                  className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setNotesModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                  disabled={savingNotes}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Deal (Mark as invested) Modal */}
      {investedModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Record Investment Details</h2>
              <button onClick={() => setInvestedModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4 font-sans">
              <div className="p-3 bg-green-50 border border-green-150 text-green-800 rounded-xl text-xs font-semibold leading-relaxed">
                Please document the investment details. This moves the startup connection into your portfolio list.
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
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition"
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
