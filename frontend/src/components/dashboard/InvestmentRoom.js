'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { 
  X, Send, Link as LinkIcon, Edit3, FileText, Plus, ChevronLeft, 
  MessageSquare, User, Briefcase, DollarSign, Calendar, Info, 
  ExternalLink, Lock, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react';

import { API_URL } from '@/utils/api';

export default function InvestmentRoom({ connectionId, onClose }) {
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Connection and updates state
  const [connection, setConnection] = useState(null);
  const [updates, setUpdates] = useState([]);
  
  // Tab control in right panel
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('info'); // info, links, notes, updates, privateNotes

  // Chat messages state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  // Edit / Input states inside room
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [addingLink, setAddingLink] = useState(false);
  
  const [meetingNotes, setMeetingNotes] = useState('');
  const [savingMeetingNotes, setSavingMeetingNotes] = useState(false);
  
  const [privateNotes, setPrivateNotes] = useState('');
  const [savingPrivateNotes, setSavingPrivateNotes] = useState(false);

  // Post update from room states (if user is founder)
  const [newUpdate, setNewUpdate] = useState({ title: '', description: '', updateType: 'General', attachmentUrl: '' });
  const [postingUpdate, setPostingUpdate] = useState(false);

  // Complete Deal (Invested) state
  const [investedModalOpen, setInvestedModalOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({ amount: '', equity: '' });
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  const isInvestor = user?.role === 'investor';
  const isFounder = user?.role === 'founder';

  // Load all connection data
  const loadRoomData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/investor/connection/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        const conn = json.data.connection;
        setConnection(conn);
        setUpdates(json.data.updates || []);
        setMeetingNotes(conn.meetingNotes || '');
        setPrivateNotes(conn.privateNotes || '');

        // Establish recipient ID for direct chat
        const otherUser = user.id === conn.founderId?._id 
          ? conn.investorId 
          : conn.founderId;

        // Fetch or find conversation
        await loadConversation(otherUser._id);
      } else {
        setError(json.error || 'Failed to load Investment Room data');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed');
    } finally {
      setLoading(false);
    }
  };

  // Find direct conversation with other participant
  const loadConversation = async (otherUserId) => {
    try {
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        const matchingConv = json.data.find(c => 
          c.participants.some(p => p._id === otherUserId)
        );
        
        if (matchingConv) {
          setConversationId(matchingConv._id);
          fetchMessages(matchingConv._id);
        } else {
          // If no conversation object exists in backend yet
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
    }
  };

  // Fetch messages inside conversation
  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`${API_URL}/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    if (connectionId && token) {
      loadRoomData();
    }
  }, [connectionId, token]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket IO Listener
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on('receive_message', (message) => {
      if (message.conversationId === conversationId || message.conversationId === 'pending_' + conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, conversationId]);

  // Polling fallback every 6 seconds for new messages if Socket is not connected
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      fetchMessages(conversationId);
    }, 6000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Send Direct Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage || !connection) return;

    const otherUser = user.id === connection.founderId?._id 
      ? connection.investorId 
      : connection.founderId;

    setSendingMessage(true);
    try {
      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: otherUser._id,
          content: newMessage,
          type: 'text'
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const msg = json.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setNewMessage('');
        
        // Update conversationId if it was initialized as pending
        if (!conversationId) {
          setConversationId(msg.conversationId);
        }
      } else {
        addToast(json.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      addToast('Error sending message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  // Update pipeline stage handler
  const handleUpdateStage = async (newStage) => {
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
        setConnection(prev => ({ ...prev, pipelineStage: newStage }));
        if (newStage === 'Invested') {
          setConnection(prev => ({ ...prev, status: 'invested' }));
        }
      } else {
        addToast(data.error || 'Failed to update stage', 'error');
      }
    } catch (err) {
      addToast('Error updating pipeline stage', 'error');
    }
  };

  // Add Shared Link
  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.url.trim() || addingLink) return;

    setAddingLink(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/connection/${connectionId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLink)
      });
      const json = await res.json();
      if (json.success) {
        addToast('Document/Link shared successfully!', 'success');
        setConnection(prev => ({ ...prev, sharedLinks: json.data }));
        setNewLink({ title: '', url: '' });
      } else {
        addToast(json.error || 'Failed to add shared link', 'error');
      }
    } catch (err) {
      addToast('Error adding shared link', 'error');
    } finally {
      setAddingLink(false);
    }
  };

  // Save Meeting Notes
  const handleSaveMeetingNotes = async () => {
    setSavingMeetingNotes(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/connection/${connectionId}/meeting-notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ meetingNotes })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Meeting notes saved successfully!', 'success');
        setConnection(prev => ({ ...prev, meetingNotes: json.data }));
      } else {
        addToast(json.error || 'Failed to save notes', 'error');
      }
    } catch (err) {
      addToast('Error saving meeting notes', 'error');
    } finally {
      setSavingMeetingNotes(false);
    }
  };

  // Save Investor Private Notes
  const handleSavePrivateNotes = async () => {
    setSavingPrivateNotes(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/pipeline/${connectionId}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: privateNotes })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Private notes saved successfully!', 'success');
        setConnection(prev => ({ ...prev, privateNotes: json.data }));
      } else {
        addToast(json.error || 'Failed to save private notes', 'error');
      }
    } catch (err) {
      addToast('Error saving private notes', 'error');
    } finally {
      setSavingPrivateNotes(false);
    }
  };

  // Create Startup Update (if user is Founder)
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!newUpdate.title.trim() || !newUpdate.description.trim() || postingUpdate) return;

    setPostingUpdate(true);
    try {
      const res = await fetch(`${API_URL}/api/founder/updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: connection?.startupId?._id,
          ...newUpdate
        })
      });
      const json = await res.json();
      if (json.success) {
        addToast('Startup update posted successfully!', 'success');
        setUpdates(prev => [json.data, ...prev]);
        setNewUpdate({ title: '', description: '', updateType: 'General', attachmentUrl: '' });
        setActiveWorkspaceTab('updates');
      } else {
        addToast(json.error || 'Failed to post update', 'error');
      }
    } catch (err) {
      addToast('Error posting update', 'error');
    } finally {
      setPostingUpdate(false);
    }
  };

  // Complete Deal (Invested) Modal Submission
  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInvestment(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/pipeline/${connectionId}/invested`, {
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
      const json = await res.json();
      if (json.success) {
        addToast('Investment finalized successfully!', 'success');
        setInvestedModalOpen(false);
        setConnection(prev => ({ 
          ...prev, 
          status: 'invested', 
          pipelineStage: 'Invested',
          investmentAmount: Number(investmentForm.amount),
          equityPercentage: Number(investmentForm.equity)
        }));
      } else {
        addToast(json.error || 'Failed to finalize deal', 'error');
      }
    } catch (err) {
      addToast('Error saving investment details', 'error');
    } finally {
      setSubmittingInvestment(false);
    }
  };

  const openInvestmentModal = () => {
    setInvestmentForm({
      amount: connection?.startupId?.fundingNeeded || '',
      equity: ''
    });
    setInvestedModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-200 text-center font-sans space-y-3">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <h4 className="font-bold text-lg">Error Entering Room</h4>
        <p className="text-sm font-semibold">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-red-650 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer">
          Go Back
        </button>
      </div>
    );
  }

  const { startupId: startup, investorId: investor, founderId: founder } = connection || {};
  const otherUser = user.id === founder?._id ? investor : founder;

  return (
    <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-xl max-h-[85vh] h-[800px] text-slate-800 font-sans">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b border-slate-200 gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition cursor-pointer"
            title="Exit Room"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="h-10 w-10 bg-blue-150 rounded-xl border border-blue-200 flex items-center justify-center font-bold text-primary shadow-3xs flex-shrink-0">
            {startup?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 leading-none">{startup?.name}</h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">{startup?.stage}</span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-1">Investment Room • Founder & Investor Collaboration</p>
          </div>
        </div>

        {/* Deal Status & Pipeline Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stage:</span>
              <select
                value={connection?.pipelineStage}
                onChange={(e) => handleUpdateStage(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg py-1 px-2.5 focus:ring-0 outline-none cursor-pointer hover:bg-slate-100 transition"
              >
                {['Connected', 'Meeting', 'Due Diligence', 'Negotiation', 'Invested', 'Rejected'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
          </div>

          {connection?.status !== 'invested' && (
            <button 
              onClick={openInvestmentModal}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" /> Mark as Invested
            </button>
          )}

          {connection?.status === 'invested' && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-bold">
              <DollarSign className="h-4 w-4" /> Funded: ${connection?.investmentAmount?.toLocaleString()} ({connection?.equityPercentage}%)
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Columns */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Direct Chat */}
        <div className="w-[55%] flex flex-col border-r border-slate-200 bg-white">
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
              {otherUser?.profileImage && <img src={otherUser.profileImage} alt="" className="h-full w-full object-cover" />}
            </div>
            <span className="text-xs font-bold text-slate-700">Chatting with {otherUser?.name || 'Partner'}</span>
            <span className="text-[9px] bg-green-50 text-green-600 border border-green-200 font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ml-auto">Direct chat unlocked</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 space-y-2 p-6">
                <MessageSquare className="h-10 w-10 text-slate-350 animate-pulse" />
                <p className="text-xs font-semibold">No messages yet. Send a note to initiate the dialog!</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender?._id === user.id || m.sender === user.id;
                return (
                  <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 shadow-3xs ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                    }`}>
                      {!isMe && (
                        <div className="text-[9px] font-bold text-slate-400 mb-1">
                          {m.sender?.name || otherUser?.name}
                        </div>
                      )}
                      <p className="text-xs leading-relaxed break-words">{m.content}</p>
                      <span className={`text-[8px] font-bold block mt-1.5 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(m.createdAt || m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message to connect..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sendingMessage}
              className="p-2.5 bg-primary text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 shadow-sm cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Dynamic Workspace */}
        <div className="w-[45%] flex flex-col bg-white overflow-hidden">
          
          {/* Workspace Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-1 overflow-x-auto">
            {[
              { id: 'info', label: 'Overview', icon: Info },
              { id: 'links', label: 'Pitch/Links', icon: LinkIcon },
              { id: 'notes', label: 'Meeting Notes', icon: Edit3 },
              { id: 'updates', label: 'Updates', icon: FileText },
              ...(isInvestor ? [{ id: 'privateNotes', label: 'Private Notes', icon: Lock }] : [])
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveWorkspaceTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                    activeWorkspaceTab === tab.id 
                      ? 'bg-slate-250 bg-slate-200 text-slate-800 border-b border-slate-400' 
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3 w-3" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Workspace Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* OVERVIEW TAB */}
            {activeWorkspaceTab === 'info' && (
              <div className="space-y-4 font-sans text-xs">
                {/* Startup Summary Card */}
                <div className="bg-slate-50 p-4 border rounded-2xl space-y-3 shadow-3xs">
                  <h3 className="font-black text-slate-900 uppercase tracking-wide text-[10px] text-primary">Startup Details</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white border rounded-xl flex items-center justify-center font-bold text-gray-500 flex-shrink-0">
                      {startup?.logo ? <img src={startup.logo} alt="" className="object-contain p-1" /> : startup?.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{startup?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{startup?.industry}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 italic">&quot;{startup?.oneLinePitch}&quot;</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-semibold border-t pt-2.5 text-slate-600">
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Funding Target</span>
                      <span className="text-slate-900">${startup?.fundingRequired?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">Equity Offering</span>
                      <span className="text-slate-900">{startup?.equityOffered || '0'}%</span>
                    </div>
                  </div>
                </div>

                {/* Investor Summary Card */}
                <div className="bg-slate-50 p-4 border rounded-2xl space-y-3 shadow-3xs">
                  <h3 className="font-black text-slate-900 uppercase tracking-wide text-[10px] text-green-700">Investor Profile</h3>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white border rounded-full flex items-center justify-center font-bold text-slate-400 overflow-hidden flex-shrink-0">
                      {investor?.profileImage ? <img src={investor.profileImage} alt="" className="h-full w-full object-cover" /> : <User className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{investor?.fullName || investor?.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{investor?.headline || 'Angel Investor'}</p>
                    </div>
                  </div>
                  <div className="border-t pt-2.5 text-[10px] text-slate-500 font-medium">
                    Email: <span className="text-slate-700 font-bold">{investor?.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PITCH & SHARED LINKS TAB */}
            {activeWorkspaceTab === 'links' && (
              <div className="space-y-4">
                {/* Startup Pitch Deck */}
                <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-primary"><FileText className="h-5 w-5" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-none">Startup Pitch Deck</h4>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1">Pitch deck document shared by founder</p>
                    </div>
                  </div>
                  {startup?.pitchDeck ? (
                    <a 
                      href={startup.pitchDeck} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg text-[10px] uppercase flex items-center gap-1 shadow-3xs"
                    >
                      Open Link <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic">Not Uploaded</span>
                  )}
                </div>

                {/* Shared links catalog */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wide border-b pb-2">Shared Workspace Links</h3>
                  
                  {(!connection?.sharedLinks || connection.sharedLinks.length === 0) ? (
                    <p className="text-xs text-slate-450 italic text-center py-6 font-medium">No custom documents or links shared yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {connection.sharedLinks.map((link, idx) => (
                        <div key={link._id || idx} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs font-medium">
                          <div>
                            <span className="font-bold text-slate-800 leading-none block">{link.title}</span>
                            <span className="text-[8px] text-slate-400 mt-1 block">Added on {new Date(link.createdAt).toLocaleDateString()}</span>
                          </div>
                          <a 
                            href={link.url.startsWith('http') ? link.url : `https://${link.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                          >
                            Visit <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add link form */}
                  <form onSubmit={handleAddLink} className="border-t pt-4 space-y-3 font-sans">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase">Share Document or Link</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Document Title (e.g. Cap Table)"
                        value={newLink.title}
                        onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                        className="p-2 border rounded-lg outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Link URL (https://...)"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        className="p-2 border rounded-lg outline-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingLink}
                      className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-slate-900 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Share Document
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* MEETING NOTES TAB */}
            {activeWorkspaceTab === 'notes' && (
              <div className="space-y-4">
                <div className="p-3 bg-yellow-50/60 border border-yellow-150 rounded-xl text-[10px] font-semibold text-yellow-800 leading-relaxed">
                  Meeting notes are collaborative. Both the founder and the investor can view and edit this log to document discussion.
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase">Discussion & Call Log</label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Record meeting outcomes, scheduled calls, milestones, next steps..."
                    rows={8}
                    className="w-full p-3 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
                  />
                  <button
                    onClick={handleSaveMeetingNotes}
                    disabled={savingMeetingNotes}
                    className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-95 transition cursor-pointer"
                  >
                    {savingMeetingNotes ? 'Saving Notes...' : 'Save Meeting Notes'}
                  </button>
                </div>
              </div>
            )}

            {/* FOUNDER UPDATES TAB */}
            {activeWorkspaceTab === 'updates' && (
              <div className="space-y-4 text-xs font-sans">
                {/* Publish Update if Founder */}
                {isFounder && (
                  <form onSubmit={handlePostUpdate} className="p-4 bg-slate-50 border rounded-2xl space-y-3">
                    <h3 className="font-black text-slate-900 uppercase tracking-wide text-[10px] text-primary">Post Startup Update</h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Title</label>
                        <input
                          type="text"
                          placeholder="Update Title"
                          value={newUpdate.title}
                          onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none bg-white font-sans text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Type</label>
                        <select
                          value={newUpdate.updateType}
                          onChange={(e) => setNewUpdate({ ...newUpdate, updateType: e.target.value })}
                          className="w-full p-2 border rounded-lg outline-none bg-white font-sans text-xs"
                        >
                          {['Product', 'Revenue', 'Team', 'Funding', 'Milestone', 'General'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Description</label>
                      <textarea
                        placeholder="Detail the metrics, features, progress, or needs..."
                        value={newUpdate.description}
                        onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                        className="w-full p-2 border rounded-lg outline-none bg-white font-sans text-xs"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Attachment/Link (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={newUpdate.attachmentUrl}
                        onChange={(e) => setNewUpdate({ ...newUpdate, attachmentUrl: e.target.value })}
                        className="w-full p-2 border rounded-lg outline-none bg-white font-sans text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={postingUpdate}
                      className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-slate-900 transition cursor-pointer"
                    >
                      {postingUpdate ? 'Publishing...' : 'Publish Update to Investors'}
                    </button>
                  </form>
                )}

                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wide border-b pb-2">Timeline of Updates</h3>
                
                {updates.length === 0 ? (
                  <p className="text-slate-450 italic text-center py-6 font-medium">No updates posted for this startup yet.</p>
                ) : (
                  <div className="space-y-3">
                    {updates.map(up => (
                      <div key={up._id} className="p-4 bg-slate-50 border rounded-2xl shadow-3xs">
                        <div className="flex justify-between items-center border-b pb-1.5 mb-2 text-[9px] text-slate-400 font-bold">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-full font-black uppercase tracking-wider text-[8px]">
                            {up.updateType || 'General'}
                          </span>
                          <span>{new Date(up.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm mb-1.5 leading-snug">{up.title}</h4>
                        <p className="text-slate-650 leading-relaxed whitespace-pre-wrap">{up.description}</p>
                        
                        {up.attachmentUrl && (
                          <div className="mt-3.5 pt-2 border-t text-[10px]">
                            <a 
                              href={up.attachmentUrl.startsWith('http') ? up.attachmentUrl : `https://${up.attachmentUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                            >
                              View Attachment <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INVESTOR PRIVATE NOTES TAB */}
            {activeWorkspaceTab === 'privateNotes' && isInvestor && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-150 text-blue-800 rounded-xl text-[10px] font-semibold leading-relaxed">
                  Private notes are investor-only. The startup founder or other users have zero visibility into these notes.
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-900 uppercase">Internal Deal Notes</label>
                  <textarea
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    placeholder="Enter internal evaluation, deal calculations, risk analysis, due diligence metrics..."
                    rows={8}
                    className="w-full p-3 text-xs border rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-sans"
                  />
                  <button
                    onClick={handleSavePrivateNotes}
                    disabled={savingPrivateNotes}
                    className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-95 transition cursor-pointer"
                  >
                    {savingPrivateNotes ? 'Saving Notes...' : 'Save Private Notes'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Complete Deal (Mark as invested) Modal inside Room */}
      {investedModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden text-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-gray-900">Record Investment Details</h2>
              <button onClick={() => setInvestedModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInvestmentSubmit} className="p-6 space-y-4 font-sans">
              <div className="p-3 bg-green-50 border border-green-150 text-green-800 rounded-xl text-xs font-semibold leading-relaxed">
                Please document the investment details. This moves the startup connection into your portfolio list.
              </div>

              <div>
                <label className="block text-slate-750 font-bold mb-1.5">Investment Amount ($)</label>
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
                <label className="block text-slate-750 font-bold mb-1.5">Equity Percentage Received (%)</label>
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

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInvestedModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition cursor-pointer"
                  disabled={submittingInvestment}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvestment}
                  className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition cursor-pointer"
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
