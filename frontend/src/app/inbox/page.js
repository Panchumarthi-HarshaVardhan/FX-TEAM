'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Inbox, 
  Send, 
  Star, 
  Archive, 
  Trash2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Plus, 
  CornerUpLeft, 
  Check, 
  X, 
  Briefcase, 
  DollarSign, 
  Users, 
  Sparkles, 
  Clock, 
  Paperclip, 
  MessageSquare, 
  Menu, 
  ChevronRight, 
  User, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2,
  XCircle,
  Loader2,
  Reply,
  FolderOpen,
  Rocket,
  Video,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

export default function MailboxPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/auth/login');
    }
  }, [mounted, authLoading, user, router]);

  // Navigation Folders
  // folders: inbox, requests, sent, starred, archived, trash, system
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [mails, setMails] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [counts, setCounts] = useState({ inboxUnread: 0, pendingRequests: 0 });

  // Mobile navigation drawer toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Compose Modal State
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    recipientQuery: '',
    receiverId: '',
    receiverName: '',
    subject: '',
    body: '',
    type: 'normal',
    relatedStartupId: '',
    attachmentUrl: ''
  });
  const [searchUsers, setSearchUsers] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [ownedStartups, setOwnedStartups] = useState([]);
  const searchTimeoutRef = useRef(null);

  // Reply state
  const [replyBody, setReplyBody] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);

  // Mark Invested Modal State
  const [investedModalOpen, setInvestedModalOpen] = useState(false);
  const [investedForm, setInvestedForm] = useState({
    amount: '',
    equity: ''
  });

  // Schedule Meeting Modal State
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    agenda: ''
  });

  // Load mails and counts
  useEffect(() => {
    if (token && user) {
      fetchMails(currentFolder);
      fetchCounts();
      fetchOwnedStartups();
    }
  }, [currentFolder, token, user]);

  const fetchMails = async (folder) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${folder}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMails(data.data || []);
        // Reset selected mail if it's no longer in the folder list
        if (selectedMail) {
          const exists = data.data?.some(m => m._id === selectedMail._id);
          if (!exists) setSelectedMail(null);
        }
      } else {
        addToast(data.error || 'Failed to fetch messages', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error fetching messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [inboxRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/mail/inbox`, { headers }),
        fetch(`${API_URL}/api/mail/requests`, { headers })
      ]);
      const inboxData = await inboxRes.json();
      const requestsData = await requestsRes.json();

      setCounts({
        inboxUnread: inboxData.data?.filter(m => !m.isRead).length || 0,
        pendingRequests: requestsData.data?.filter(m => m.actionStatus === 'pending').length || 0
      });
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  };

  const fetchOwnedStartups = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard/founder`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data?.startups) {
        setOwnedStartups(data.data.startups);
      }
    } catch (err) {
      console.error('Failed to load owned startups:', err);
    }
  };

  const handleMailClick = async (mail) => {
    setSelectedMail(mail);
    
    // Fetch full populated details from API
    try {
      const res = await fetch(`${API_URL}/api/mail/${mail._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedMail(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch full mail detail:', err);
    }
    
    // Mark as read if received and unread
    if (!mail.isRead && mail.receiverId?._id === user.id) {
      try {
        const res = await fetch(`${API_URL}/api/mail/${mail._id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Update local state read status
          setMails(prev => prev.map(m => m._id === mail._id ? { ...m, isRead: true } : m));
          setSelectedMail(prev => prev && prev._id === mail._id ? { ...prev, isRead: true } : prev);
          fetchCounts();
        }
      } catch (err) {
        console.error('Failed to mark mail as read:', err);
      }
    }
  };

  const handleToggleStar = async (e, mailId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/star`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMails(prev => prev.map(m => m._id === mailId ? { ...m, isStarred: data.data.isStarred } : m));
        if (selectedMail && selectedMail._id === mailId) {
          setSelectedMail(prev => prev ? { ...prev, isStarred: data.data.isStarred } : null);
        }
        addToast(data.data.isStarred ? 'Conversation starred' : 'Conversation unstarred', 'success');
      }
    } catch (err) {
      addToast('Failed to star message', 'error');
    }
  };

  const handleArchiveMail = async (mailId) => {
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Conversation archived', 'success');
        fetchMails(currentFolder);
        fetchCounts();
      }
    } catch (err) {
      addToast('Failed to archive message', 'error');
    }
  };

  const handleDeleteMail = async (mailId) => {
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Conversation moved to Trash', 'success');
        fetchMails(currentFolder);
        fetchCounts();
      }
    } catch (err) {
      addToast('Failed to delete message', 'error');
    }
  };

  const handleRestoreMail = async (mailId) => {
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/restore`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Conversation restored successfully', 'success');
        fetchMails(currentFolder);
        fetchCounts();
      }
    } catch (err) {
      addToast('Failed to restore message', 'error');
    }
  };

  // Recipient search autocomplete
  const handleRecipientChange = (e) => {
    const val = e.target.value;
    setComposeForm(prev => ({ ...prev, recipientQuery: val, receiverId: '', receiverName: '' }));
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!val.trim()) {
      setSearchUsers([]);
      return;
    }

    setUserSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/mail/users/search?q=${val}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setSearchUsers(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUserSearching(false);
      }
    }, 400);
  };

  const selectRecipient = (usr) => {
    setComposeForm(prev => ({
      ...prev,
      recipientQuery: usr.fullName || usr.name,
      receiverId: usr._id,
      receiverName: usr.fullName || usr.name
    }));
    setSearchUsers([]);
  };

  // Compose Submit
  const handleComposeSubmit = async (e) => {
    e.preventDefault();
    if (!composeForm.receiverId) {
      addToast('Please select a valid recipient from the list', 'error');
      return;
    }
    if (!composeForm.subject.trim() || !composeForm.body.trim()) {
      addToast('Subject and body are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('${API_URL}/api/mail/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: composeForm.receiverId,
          subject: composeForm.subject,
          body: composeForm.body,
          type: composeForm.type,
          relatedStartupId: composeForm.relatedStartupId || undefined,
          attachments: composeForm.attachmentUrl ? [composeForm.attachmentUrl] : []
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Message sent successfully!', 'success');
        setComposeOpen(false);
        setComposeForm({
          recipientQuery: '',
          receiverId: '',
          receiverName: '',
          subject: '',
          body: '',
          type: 'normal',
          relatedStartupId: '',
          attachmentUrl: ''
        });
        if (currentFolder === 'sent') {
          fetchMails('sent');
        }
      } else {
        addToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      addToast('Error sending message', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Reply Submit
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${selectedMail._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: replyBody })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Reply sent successfully!', 'success');
        setReplyBody('');
        setReplyOpen(false);
        // Refresh mail list or select state
        fetchMails(currentFolder);
      } else {
        addToast(data.error || 'Failed to send reply', 'error');
      }
    } catch (err) {
      addToast('Error sending reply', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // BUSINESS LOGIC ACTIONS (Accept, Reject, Connect, Interview, Mark Invested)
  const handleAcceptRequest = async (mailId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Request accepted successfully!', 'success');
        // Refresh
        fetchMails(currentFolder);
        fetchCounts();
        if (selectedMail && selectedMail._id === mailId) {
          const detailRes = await fetch(`${API_URL}/api/mail/${mailId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedMail(detailData.data);
        }
      } else {
        addToast(data.error || 'Failed to accept request', 'error');
      }
    } catch (err) {
      addToast('Error processing accept request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (mailId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || 'Request declined.', 'success');
        fetchMails(currentFolder);
        fetchCounts();
        if (selectedMail && selectedMail._id === mailId) {
          const detailRes = await fetch(`${API_URL}/api/mail/${mailId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedMail(detailData.data);
        }
      } else {
        addToast(data.error || 'Failed to reject request', 'error');
      }
    } catch (err) {
      addToast('Error processing reject request', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConnectRequest = async (mailId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Connected! Chat channel is unlocked.', 'success');
        fetchMails(currentFolder);
        fetchCounts();
        if (selectedMail && selectedMail._id === mailId) {
          const detailRes = await fetch(`${API_URL}/api/mail/${mailId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedMail(detailData.data);
        }
      } else {
        addToast(data.error || 'Failed to connect', 'error');
      }
    } catch (err) {
      addToast('Error processing connect', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInterviewRequest = async (mailId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${mailId}/interview`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addToast('Application moved to interview! Message sent.', 'success');
        fetchMails(currentFolder);
        fetchCounts();
        if (selectedMail && selectedMail._id === mailId) {
          const detailRes = await fetch(`${API_URL}/api/mail/${mailId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedMail(detailData.data);
        }
      } else {
        addToast(data.error || 'Failed to schedule interview', 'error');
      }
    } catch (err) {
      addToast('Error scheduling interview', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMail) return;
    
    setActionLoading(true);
    try {
      const targetUserId = selectedMail.senderId?._id === user.id 
        ? selectedMail.receiverId?._id 
        : selectedMail.senderId?._id;

      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetingForm.title,
          agenda: meetingForm.agenda,
          participants: [targetUserId],
          scheduledDate: meetingForm.date,
          startTime: meetingForm.startTime,
          endTime: meetingForm.endTime,
          startupId: selectedMail.relatedStartupId?._id || undefined,
          mailThreadId: selectedMail._id
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Meeting scheduled and invite sent!', 'success');
        setMeetingModalOpen(false);
        setMeetingForm({ title: '', date: '', startTime: '', endTime: '', agenda: '' });
        fetchMails(currentFolder);
      } else {
        addToast(data.error || 'Failed to schedule meeting', 'error');
      }
    } catch (err) {
      addToast('Error scheduling meeting', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMeetingResponse = async (meetingId, mailId, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/meetings/${meetingId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, mailId })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`Meeting ${status} successfully!`, 'success');
        fetchMails(currentFolder);
        fetchCounts();
        if (selectedMail && selectedMail._id === mailId) {
          const detailRes = await fetch(`${API_URL}/api/mail/${mailId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailData = await detailRes.json();
          if (detailData.success) setSelectedMail(detailData.data);
        }
      } else {
        addToast(data.error || 'Failed to respond to meeting', 'error');
      }
    } catch (err) {
      addToast('Error responding to meeting', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkInvestedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMail) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mail/${selectedMail._id}/mark-invested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(investedForm.amount),
          equity: Number(investedForm.equity)
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast('Startup marked as Invested successfully!', 'success');
        setInvestedModalOpen(false);
        setInvestedForm({ amount: '', equity: '' });
        fetchMails(currentFolder);
        // Refresh selectedMail details
        const detailRes = await fetch(`${API_URL}/api/mail/${selectedMail._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const detailData = await detailRes.json();
        if (detailData.success) setSelectedMail(detailData.data);
      } else {
        addToast(data.error || 'Failed to mark as invested', 'error');
      }
    } catch (err) {
      addToast('Error marking startup invested', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for folder styling
  const folderClass = (folder) => {
    const isActive = currentFolder === folder;
    return `flex items-center justify-between w-full px-4 py-2.5 my-0.5 rounded-lg text-sm font-medium transition-all ${
      isActive 
        ? 'bg-blue-50/80 text-blue-700 font-bold border-l-4 border-blue-600 pl-3' 
        : 'text-gray-600 hover:bg-gray-100/60 hover:text-gray-900'
    }`;
  };

  // Mail filtering for local search
  const filteredMails = mails.filter(m => {
    const query = searchQuery.toLowerCase();
    const subjectMatch = m.subject?.toLowerCase().includes(query);
    const bodyMatch = m.body?.toLowerCase().includes(query);
    const senderMatch = m.senderProfileName?.toLowerCase().includes(query);
    const receiverMatch = m.receiverProfileName?.toLowerCase().includes(query);
    return subjectMatch || bodyMatch || senderMatch || receiverMatch;
  });

  // Folder Labels/Icons
  const FOLDERS = [
    { key: 'inbox', label: 'Inbox', icon: <Inbox className="h-4 w-4" />, countKey: 'inboxUnread' },
    { key: 'requests', label: 'Requests', icon: <Briefcase className="h-4 w-4" />, countKey: 'pendingRequests' },
    { key: 'sent', label: 'Sent', icon: <Send className="h-4 w-4" /> },
    { key: 'starred', label: 'Starred', icon: <Star className="h-4 w-4" /> },
    { key: 'archived', label: 'Archived', icon: <Archive className="h-4 w-4" /> },
    { key: 'trash', label: 'Trash', icon: <Trash2 className="h-4 w-4" /> }
  ];

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      {/* Main Mailbox Layout wrapper */}
      <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden pt-2 bg-gray-50">
        
        {/* Sidebar folder navigation */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 pt-16 md:pt-0 flex flex-col transform md:static md:translate-x-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -left-64'
        }`}>
          <div className="p-4">
            <button
              onClick={() => setComposeOpen(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              Compose
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2">
            {FOLDERS.map((fold) => (
              <button
                key={fold.key}
                onClick={() => {
                  setCurrentFolder(fold.key);
                  setSidebarOpen(false);
                }}
                className={folderClass(fold.key)}
              >
                <div className="flex items-center gap-3">
                  {fold.icon}
                  <span>{fold.label}</span>
                </div>
                {fold.countKey && counts[fold.countKey] > 0 && (
                  <span className="bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {counts[fold.countKey]}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-150 text-xs text-gray-400">
            <span>Powered by FounderX Mail</span>
          </div>
        </aside>

        {/* Back drop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/35 z-20 md:hidden"
          />
        )}

        {/* Middle: Mail List */}
        <section className={`flex-1 flex flex-col min-w-0 border-r border-gray-200 bg-white ${
          selectedMail ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Top Filter Bar */}
          <div className="p-4 border-b border-gray-200 flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${currentFolder}...`}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 hover:bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg text-sm transition"
              />
            </div>

            <button 
              onClick={() => {
                fetchMails(currentFolder);
                fetchCounts();
              }}
              title="Refresh"
              className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* List items wrapper */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-150">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <span className="text-sm">Loading messages...</span>
              </div>
            ) : filteredMails.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center text-gray-400">
                <FolderOpen className="h-12 w-12 text-gray-300 mb-3 stroke-[1.5]" />
                <p className="font-semibold text-gray-600">No conversations found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                  {searchQuery ? 'Try adjusting your search terms' : `Your ${currentFolder} is currently empty.`}
                </p>
              </div>
            ) : (
              filteredMails.map((m) => {
                const isSelected = selectedMail?._id === m._id;
                const isUnread = !m.isRead && m.receiverId?._id === user.id;
                const dateStr = format(new Date(m.createdAt), 'MMM d');
                const oppositeParty = m.senderId?._id === user.id 
                  ? m.receiverProfileName || m.receiverId?.fullName || m.receiverId?.name || 'Receiver'
                  : m.senderProfileName || m.senderId?.fullName || m.senderId?.name || 'Sender';
                
                const oppositeRole = m.senderId?._id === user.id ? m.receiverRole : m.senderRole;

                return (
                  <div
                    key={m._id}
                    onClick={() => handleMailClick(m)}
                    className={`p-4 flex items-start gap-3 hover:bg-slate-50/80 transition cursor-pointer select-none ${
                      isUnread ? 'bg-blue-50/20 font-semibold' : ''
                    } ${isSelected ? 'bg-blue-50/40 border-l-4 border-blue-500 pl-3' : ''}`}
                  >
                    {/* Star & unread dot */}
                    <div className="flex flex-col items-center gap-2 pt-0.5">
                      <div className={`h-2 w-2 rounded-full ${isUnread ? 'bg-blue-600' : 'bg-transparent'}`} />
                      <button 
                        onClick={(e) => handleToggleStar(e, m._id)}
                        className={`text-gray-300 hover:text-yellow-500 transition`}
                      >
                        <Star className={`h-4 w-4 ${m.isStarred ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                      </button>
                    </div>

                    {/* Sender + Role / Preview / Date */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-sm text-gray-900 truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>
                            {oppositeParty}
                          </span>
                          {oppositeRole && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-500 rounded font-semibold capitalize">
                              {oppositeRole.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{dateStr}</span>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1 font-semibold truncate">
                        {m.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5 font-normal">
                        {m.body}
                      </p>

                      {/* Request and status labels */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.type !== 'normal' && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold uppercase tracking-wider rounded">
                            {m.type.replace('_', ' ')}
                          </span>
                        )}
                        {m.actionStatus && m.actionStatus !== 'none' && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${
                            m.actionStatus === 'accepted' || m.actionStatus === 'invested'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : m.actionStatus === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : m.actionStatus === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                            {m.actionStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Mail Detail View */}
        <section className={`flex-1 md:flex-[1.5] flex flex-col bg-white ${
          selectedMail ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedMail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Header Actions */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50/50">
                <button
                  onClick={() => setSelectedMail(null)}
                  className="md:hidden flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                >
                  <CornerUpLeft className="h-4 w-4" />
                  Back to List
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => handleToggleStar(e, selectedMail._id)}
                    className="p-2 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-gray-100 transition"
                    title="Star message"
                  >
                    <Star className={`h-4.5 w-4.5 ${selectedMail.isStarred ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                  </button>

                  {/* Show restore if in archived or deleted, else show delete/archive */}
                  {currentFolder === 'trash' || currentFolder === 'archived' ? (
                    <button
                      onClick={() => handleRestoreMail(selectedMail._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center gap-1 transition"
                      title="Restore mail"
                    >
                      <RefreshCw className="h-4.5 w-4.5" />
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleArchiveMail(selectedMail._id)}
                        className="p-2 text-gray-400 hover:text-slate-800 rounded-lg hover:bg-gray-100 transition"
                        title="Archive message"
                      >
                        <Archive className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMail(selectedMail._id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition"
                        title="Move to trash"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Subject Header */}
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Subject</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1 leading-tight">
                    {selectedMail.subject}
                  </h2>
                </div>

                {/* Sender Card info */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedMail.senderId?.profileImage ? (
                    <img 
                      src={selectedMail.senderId.profileImage}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {selectedMail.senderProfileName?.[0] || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-950 block">
                        {selectedMail.senderProfileName || selectedMail.senderId?.fullName || selectedMail.senderId?.name}
                      </span>
                      {selectedMail.senderRole && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-gray-200 text-gray-600 rounded font-semibold capitalize">
                          {selectedMail.senderRole.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-400 block truncate">
                      {selectedMail.senderId?.email || 'System Message'}
                    </span>
                  </div>
                  
                  {/* Link to profile if user exists */}
                  {selectedMail.senderId && (
                    <Link
                      href={`/profile/${selectedMail.senderId.username || selectedMail.senderId._id}`}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Profile <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {/* Mail Body */}
                <div className="text-sm text-gray-800 font-sans leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
                  {selectedMail.body}
                </div>

                {/* Detailed Investment Request Panel */}
                {selectedMail.type === 'investment_request' && (
                  <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 p-5 rounded-2xl border border-blue-100 mt-6 space-y-4 font-sans text-xs">
                    <div className="flex justify-between items-center border-b border-blue-100/60 pb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-blue-600 bg-blue-100 p-1 rounded-lg" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-805">Investment Proposal Details</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider rounded-full border ${
                        selectedMail.actionStatus === 'accepted' || selectedMail.actionStatus === 'invested'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : selectedMail.actionStatus === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {selectedMail.actionStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Startup Name</span>
                        <p className="font-bold text-slate-900 text-xs">
                          {selectedMail.relatedStartupId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Investor Name</span>
                        <p className="font-bold text-slate-900 text-xs">
                          {selectedMail.senderProfileName || selectedMail.senderId?.fullName || selectedMail.senderId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Interested Amount</span>
                        <p className="font-black text-blue-700 text-xs">
                          {selectedMail.relatedInvestmentRequestId?.interestedAmount || selectedMail.relatedInvestmentRequestId?.investmentRange || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Investment Type</span>
                        <p className="font-bold text-slate-800 text-xs">
                          {selectedMail.relatedInvestmentRequestId?.investmentType || 'Equity'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Meeting Requested</span>
                        <p className="font-bold text-slate-800 text-xs">
                          {selectedMail.relatedInvestmentRequestId?.meetingRequest ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-0.5">Submitted At</span>
                        <p className="font-medium text-slate-500 text-xs">
                          {selectedMail.createdAt ? (() => {
                            try {
                              return format(new Date(selectedMail.createdAt), 'PPP p');
                            } catch (e) {
                              return 'N/A';
                            }
                          })() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {selectedMail.relatedInvestmentRequestId?.message && (
                      <div className="bg-white/80 p-3.5 rounded-xl border border-blue-50/50 mt-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Investor Message</span>
                        <p className="text-slate-700 text-xs italic font-medium leading-relaxed font-sans">
                          &quot;{selectedMail.relatedInvestmentRequestId.message}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Related Startup Details (if attached) */}
                {selectedMail.relatedStartupId && (
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 mt-6 space-y-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Related Startup</span>
                    <div className="flex items-center gap-3">
                      {selectedMail.relatedStartupId.logo ? (
                        <img 
                          src={selectedMail.relatedStartupId.logo}
                          alt="startup logo"
                          className="h-10 w-10 rounded-lg object-cover border border-blue-200"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs rounded-lg">
                          {selectedMail.relatedStartupId.name?.[0] || 'S'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{selectedMail.relatedStartupId.name}</h4>
                        <span className="text-xs text-gray-500">{selectedMail.relatedStartupId.industry}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                  <div className="pt-4 border-t border-gray-150">
                    <span className="text-xs font-bold text-gray-400 uppercase block mb-2">Attachments</span>
                    {selectedMail.attachments.map((link, idx) => (
                      <a 
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>View Attachment</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Context-aware Actions Panel */}
                <div className="pt-6 border-t border-gray-150 space-y-4">
                  {/* Action buttons for pending actionable requests */}
                  {selectedMail.actionStatus === 'pending' && (selectedMail.receiverId?._id === user.id || selectedMail.receiverId?._id === user._id) && (
                    <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200/60 space-y-3">
                      <div className="flex items-center gap-2 text-yellow-800 text-xs font-bold uppercase">
                        <AlertCircle className="h-4 w-4" />
                        <span>Action Required</span>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {/* INVESTMENT REQUEST ACTIONS */}
                        {selectedMail.type === 'investment_request' && (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                              Accept & Connect
                            </button>
                            <button
                              onClick={() => handleRejectRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-655 border border-red-200 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-4 w-4" />}
                              Reject
                            </button>
                            <Link
                              href={`/messages?userId=${selectedMail.senderId?._id}`}
                              className="px-4 py-2.5 bg-blue-605 hover:bg-blue-650 text-white text-center rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Message Investor
                            </Link>
                            <Link
                              href={`/profile/${selectedMail.senderId?.username || selectedMail.senderId?._id}`}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center rounded-lg text-xs font-bold border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 transition"
                            >
                              <User className="h-4 w-4" />
                              View Investor Profile
                            </Link>
                            {selectedMail.relatedStartupId && (
                              <Link
                                href={`/s/${selectedMail.relatedStartupId.slug || selectedMail.relatedStartupId._id}`}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-center rounded-lg text-xs font-bold border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 transition"
                              >
                                <Rocket className="h-4 w-4" />
                                View Startup
                              </Link>
                            )}
                          </>
                        )}

                        {/* TALENT / COFOUNDER APPLICATION ACTIONS */}
                        {(selectedMail.type === 'application_request' || selectedMail.type === 'cofounder_request') && (
                          <>
                            <button
                              onClick={() => handleConnectRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-4 w-4" />}
                              Connect & Unlock Chat
                            </button>
                            <button
                              onClick={() => handleInterviewRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              Schedule Interview
                            </button>
                            <button
                              onClick={() => handleAcceptRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              Hire & Add to Team
                            </button>
                            <button
                              onClick={() => handleRejectRequest(selectedMail._id)}
                              disabled={actionLoading}
                              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* GENERAL REQUESTS (e.g. meeting_request) */}
                        {selectedMail.type === 'meeting_request' && (
                          <>
                            {selectedMail.actionStatus === 'pending' && (selectedMail.receiverId?._id === user.id || selectedMail.receiverId?._id === user._id) && (
                              <>
                                <button
                                  onClick={() => handleMeetingResponse(selectedMail.relatedApplicationId, selectedMail._id, 'accepted')}
                                  disabled={actionLoading}
                                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  Accept Meeting
                                </button>
                                <button
                                  onClick={() => handleMeetingResponse(selectedMail.relatedApplicationId, selectedMail._id, 'tentative')}
                                  disabled={actionLoading}
                                  className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  Tentative
                                </button>
                                <button
                                  onClick={() => handleMeetingResponse(selectedMail.relatedApplicationId, selectedMail._id, 'rejected')}
                                  disabled={actionLoading}
                                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meeting Join Button - always show for meeting requests */}
                  {selectedMail.type === 'meeting_request' && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/60">
                      <button
                        onClick={async () => {
                          try {
                            // First try to use meetingCode or meetingRoomId from the mail directly!
                            if (selectedMail.meetingCode) {
                              router.push(`/meet/${selectedMail.meetingCode}`);
                              return;
                            }
                            if (selectedMail.meetingRoomId) {
                              router.push(`/meet/${selectedMail.meetingRoomId}`);
                              return;
                            }
                            // Otherwise, fetch all meetings and find the matching one
                            const msres = await fetch(`${API_URL}/api/meetings`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            const msdata = await msres.json();
                            const match = msdata.data?.find(m => m._id === selectedMail.relatedApplicationId);
                            if (match) {
                              if (match.meetingCode) {
                                router.push(`/meet/${match.meetingCode}`);
                              } else if (match.roomId) {
                                router.push(`/meet/${match.roomId}`);
                              }
                            } else {
                              addToast('Could not find meeting link', 'error');
                            }
                          } catch(e) {
                            console.error(e);
                          }
                        }}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Video className="h-4 w-4" />
                        Join Meeting Room
                      </button>
                    </div>
                  )}

                  {/* General Actions for Accepted Requests */}
                  {selectedMail.actionStatus === 'accepted' && selectedMail.type !== 'meeting_request' && (
                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-3 mt-4">
                      <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Request Accepted & Connected</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => setMeetingModalOpen(true)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Video className="h-4 w-4" />
                          Schedule Video Meeting
                        </button>
                        <Link
                          href={`/messages?userId=${
                            selectedMail.senderId?._id === user.id 
                              ? selectedMail.receiverId?._id 
                              : selectedMail.senderId?._id
                          }`}
                          className="px-4 py-2.5 bg-white border hover:bg-slate-50 text-slate-700 text-center rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Show "Mark Invested" action for accepted investment connections */}
                  {selectedMail.actionStatus === 'accepted' && selectedMail.type === 'investment_request' && (
                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-200/60 space-y-3">
                      <div className="flex items-center gap-2 text-green-800 text-xs font-bold uppercase">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Interest Accepted & Connected</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => setInvestedModalOpen(true)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <DollarSign className="h-4 w-4" />
                          Mark Deal as Invested
                        </button>
                        
                        <Link
                          href={`/messages?userId=${
                            selectedMail.senderId?._id === user.id 
                              ? selectedMail.receiverId?._id 
                              : selectedMail.senderId?._id
                          }`}
                          className="px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-center rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message Party
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Reply form toggle */}
                  {!replyOpen && (
                    <button
                      onClick={() => setReplyOpen(true)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Reply className="h-4 w-4" />
                      Reply
                    </button>
                  )}

                  {replyOpen && (
                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Drafting reply...</span>
                        <button 
                          type="button" 
                          onClick={() => setReplyOpen(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your message here..."
                        rows={4}
                        required
                        className="w-full p-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg text-sm transition"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        Send Reply
                      </button>
                    </form>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
              <Inbox className="h-14 w-14 text-gray-200 stroke-[1.5] mb-3" />
              <h3 className="font-bold text-gray-700">Select a message</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-[280px] text-center">
                Choose a conversation from the list to view its full details and take actionable decisions.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* COMPOSE MAIL MODAL */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setComposeOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col z-10 overflow-hidden border">
            
            <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">New Message</h3>
              <button 
                onClick={() => setComposeOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleComposeSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Recipient */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-600 block mb-1">To</label>
                <input
                  type="text"
                  required
                  value={composeForm.recipientQuery}
                  onChange={handleRecipientChange}
                  placeholder="Type user's name or username..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />

                {/* Autocomplete suggestions */}
                {searchUsers.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchUsers.map(usr => (
                      <div
                        key={usr._id}
                        onClick={() => selectRecipient(usr)}
                        className="p-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition border-b last:border-b-0"
                      >
                        {usr.profileImage ? (
                          <img src={usr.profileImage} alt="avatar" className="h-8 w-8 rounded-full object-cover border" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {usr.fullName?.[0] || usr.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{usr.fullName || usr.name}</span>
                          <span className="text-xs text-gray-400 font-normal">@{usr.username} • {usr.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {userSearching && (
                  <div className="absolute right-3 top-8">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Grid: Type & Related Startup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Request Type</label>
                  <select
                    value={composeForm.type}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="normal">Normal message</option>
                    <option value="meeting_request">Meeting request</option>
                    {user?.role === 'founder' && (
                      <option value="founder_update">Founder update</option>
                    )}
                    {user?.role === 'investor' && (
                      <option value="investment_request">Investment Request</option>
                    )}
                    {(user?.role === 'user' || user?.role === 'job_seeker') && (
                      <>
                        <option value="application_request">Job opening application</option>
                        <option value="cofounder_request">Co-founder request</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Related Startup Dropdown */}
                {ownedStartups.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Associate Startup</label>
                    <select
                      value={composeForm.relatedStartupId}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, relatedStartupId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    >
                      <option value="">None</option>
                      {ownedStartups.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Attachment Link (Optional)</label>
                <input
                  type="url"
                  value={composeForm.attachmentUrl}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, attachmentUrl: e.target.value }))}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Message Body</label>
                <textarea
                  required
                  rows={6}
                  value={composeForm.body}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Write your professional message here..."
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Mail
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MARK AS INVESTED MODAL */}
      {investedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setInvestedModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col z-10 overflow-hidden border">
            
            <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base">Mark Deal as Invested</h3>
              <button 
                onClick={() => setInvestedModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleMarkInvestedSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Investment Amount ($)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={investedForm.amount}
                  onChange={(e) => setInvestedForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Equity Percentage (%)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  placeholder="e.g. 2.5"
                  value={investedForm.equity}
                  onChange={(e) => setInvestedForm(prev => ({ ...prev, equity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInvestedModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm Investment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SCHEDULE MEETING MODAL */}
      {meetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setMeetingModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col z-10 overflow-hidden border">
            
            <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-600" />
                Schedule Video Meeting
              </h3>
              <button 
                onClick={() => setMeetingModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleScheduleMeetingSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial Chat"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={meetingForm.startTime}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={meetingForm.endTime}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Brief meeting agenda..."
                  value={meetingForm.agenda}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, agenda: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMeetingModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
