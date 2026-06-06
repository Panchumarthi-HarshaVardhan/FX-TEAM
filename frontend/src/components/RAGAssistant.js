'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '@/utils/api';
import {
  Upload,
  FileText,
  Send,
  Sparkles,
  Compass,
  Users,
  Check,
  Search,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
  FileCode,
  Zap,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function RAGAssistant() {
  const { user, token } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'startup' | 'investor' | 'match'
  
  // General status
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Document metadata state
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadOptions, setUploadOptions] = useState({
    sourceType: 'document',
    visibility: 'private',
    startupId: ''
  });

  // User's startups (for document uploading & matchmaking)
  const [startups, setStartups] = useState([]);
  const [isLoadingStartups, setIsLoadingStartups] = useState(false);

  // Chat tab state
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Welcome! I am your AI RAG Assistant. Upload your startup documents, pitch decks, or founder files, and ask me questions about them. I can analyze financial models, find specific clauses, or synthesize information across your uploads.',
      createdAt: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedStartupId, setSelectedStartupId] = useState('');

  // Semantic Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('startupDoc'); // 'startupDoc' | 'founderDoc' | 'document' | 'pitchDeck'
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Matchmaking tab state
  const [selectedMatchStartupId, setSelectedMatchStartupId] = useState('');
  const [matchReport, setMatchReport] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchSources, setMatchSources] = useState([]);
  const [matchConfidence, setMatchConfidence] = useState(0);

  const messagesEndRef = useRef(null);

  // Show auto-dismiss toast
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Fetch documents and user's startups on load
  useEffect(() => {
    if (token && user) {
      fetchDocuments();
      fetchStartups();
    }
  }, [token, user]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(`${API_URL}/api/rag/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      } else {
        showToast(data.message || 'Failed to fetch documents', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading documents', 'error');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchStartups = async () => {
    setIsLoadingStartups(true);
    try {
      const res = await fetch(`${API_URL}/api/startups?founderId=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStartups(data.data || []);
        if (data.data?.length > 0) {
          setUploadOptions(prev => ({ ...prev, startupId: data.data[0]._id }));
          setSelectedMatchStartupId(data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStartups(false);
    }
  };

  // File selection handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds 10MB limit.', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Document Upload submission
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sourceType', uploadOptions.sourceType);
    formData.append('visibility', uploadOptions.visibility);
    if (uploadOptions.startupId) {
      formData.append('startupId', uploadOptions.startupId);
    }

    try {
      setUploadProgress(40);
      const res = await fetch(`${API_URL}/api/rag/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(80);
      const data = await res.json();
      setUploadProgress(100);

      if (data.success) {
        showToast('Document uploaded and indexed successfully!');
        setSelectedFile(null);
        fetchDocuments(); // Refresh document list
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading document', 'error');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  // Chat Submission (streaming SSE reader)
  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isStreaming) return;

    const queryText = chatInput.trim();
    setChatInput('');

    // Append user message
    const userMsgId = 'user-' + Date.now();
    const assistantMsgId = 'assistant-' + Date.now();
    
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: queryText, createdAt: new Date() },
      { id: assistantMsgId, role: 'assistant', content: '', createdAt: new Date(), isPending: true }
    ]);

    setIsStreaming(true);

    try {
      const res = await fetch(`${API_URL}/api/rag/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: queryText,
          stream: true,
          startupId: selectedStartupId || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initialize AI stream');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunkStr = decoder.decode(value);
          // Parse lines starting with "data: "
          const lines = chunkStr.split('\n');
          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith('data: ')) {
              const dataValue = cleaned.substring(6);
              if (dataValue === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataValue);
                if (parsed.done) {
                  // Final package with metadata sources
                  setMessages(prev => {
                    const idx = prev.findIndex(m => m.id === assistantMsgId);
                    if (idx !== -1) {
                      const updated = [...prev];
                      updated[idx] = {
                        ...updated[idx],
                        isPending: false,
                        sources: parsed.sources || [],
                        confidence: parsed.confidence || 0,
                        route: parsed.route
                      };
                      return updated;
                    }
                    return prev;
                  });
                } else if (parsed.token) {
                  streamedResponse += parsed.token;
                  setMessages(prev => {
                    const idx = prev.findIndex(m => m.id === assistantMsgId);
                    if (idx !== -1) {
                      const updated = [...prev];
                      updated[idx] = {
                        ...updated[idx],
                        isPending: false,
                        content: streamedResponse
                      };
                      return updated;
                    }
                    return prev;
                  });
                }
              } catch (e) {
                // Ignore parse failures on broken JSON segments
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const idx = prev.findIndex(m => m.id === assistantMsgId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            isPending: false,
            content: `Error: ${err.message || 'Failed to connect to the AI model. Check server log details.'}`,
            isError: true
          };
          return updated;
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // Semantic Search handler
  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: searchQuery.trim(),
          sourceType: searchType,
          limit: 12
        })
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        showToast(data.message || 'Search failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error searching vector space', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Venture Matchmaker handler
  const handleMatchFinder = async () => {
    if (!selectedMatchStartupId) {
      showToast('Please select a startup first.', 'error');
      return;
    }

    setIsMatching(true);
    setMatchReport('');
    setMatchSources([]);
    setMatchConfidence(0);

    try {
      const res = await fetch(`${API_URL}/api/rag/investor-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: selectedMatchStartupId
        })
      });
      const data = await res.json();
      if (data.success) {
        setMatchReport(data.data.answer);
        setMatchSources(data.data.sources || []);
        setMatchConfidence(data.data.confidence || 0);
      } else {
        showToast(data.message || 'Matchmaking calculation failed', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error computing matches', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  const getConfidenceBadgeColor = (score) => {
    if (score >= 0.85) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
    if (score >= 0.70) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900';
    return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 0.85) return `High Confidence (${Math.round(score * 100)}%)`;
    if (score >= 0.70) return `Medium Confidence (${Math.round(score * 100)}%)`;
    if (score <= 0.05) return 'Synthesized General Knowledge';
    return `Low Confidence (${Math.round(score * 100)}%)`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
        }`}>
          {toast.type === 'error' ? <ShieldAlert className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="h-40 w-40" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            AI Retrieval Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            FounderX RAG Co-Pilot
          </h1>
          <p className="mt-2 text-base text-blue-100 max-w-2xl">
            Semantic search, interactive document exploration, and automated investor matchmaking powered by Pinecone Integrated Embeddings and Groq LLM.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Controls / Document upload */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Tabs Menu */}
          <div className="p-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-sm font-bold transition flex items-center justify-between ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-zinc-800 text-primary dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-zinc-800/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Document Chat</span>
              </div>
              <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-700 dark:text-gray-300">
                {documents.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('startup')}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'startup'
                  ? 'bg-white dark:bg-zinc-800 text-primary dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-zinc-800/30'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Startup Semantic Search</span>
            </button>
            <button
              onClick={() => setActiveTab('investor')}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'investor'
                  ? 'bg-white dark:bg-zinc-800 text-primary dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-zinc-800/30'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Investor Search</span>
            </button>
            <button
              onClick={() => setActiveTab('match')}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-sm font-bold transition flex items-center gap-2 ${
                activeTab === 'match'
                  ? 'bg-white dark:bg-zinc-800 text-primary dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-zinc-800/30'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Venture Match Finder</span>
            </button>
          </div>

          {/* Document Uploader Block */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Document
            </h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              {/* Dropzone */}
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50 dark:bg-slate-900/20 group">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                  <Upload className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">
                  {selectedFile ? selectedFile.name : 'Select PDF, DOCX, or TXT'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Maximum file size: 10MB
                </span>
              </label>

              {/* Startup Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                  Associated Startup
                </label>
                <select
                  value={uploadOptions.startupId}
                  onChange={(e) => setUploadOptions({ ...uploadOptions, startupId: e.target.value })}
                  disabled={isUploading}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                  <option value="">-- No Association --</option>
                  {startups.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Source Type / Scope */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Document Type
                  </label>
                  <select
                    value={uploadOptions.sourceType}
                    onChange={(e) => setUploadOptions({ ...uploadOptions, sourceType: e.target.value })}
                    disabled={isUploading}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="document">General Doc</option>
                    <option value="pitchDeck">Pitch Deck</option>
                    <option value="startupDoc">Startup Doc</option>
                    <option value="founderDoc">Founder Bio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Visibility
                  </label>
                  <select
                    value={uploadOptions.visibility}
                    onChange={(e) => setUploadOptions({ ...uploadOptions, visibility: e.target.value })}
                    disabled={isUploading}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold p-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="private">Private (Only You)</option>
                    <option value="public">Public (Discoverable)</option>
                  </select>
                </div>
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-primary">
                    <span>Uploading & Parsing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload & Index</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Documents Metadata List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode className="h-5 w-5 text-indigo-500" />
                Active Knowledge
              </h3>
              <button
                onClick={fetchDocuments}
                className="text-slate-500 hover:text-primary transition p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                title="Refresh Documents"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDocs ? (
              <div className="flex flex-col items-center py-6 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <span className="text-xs">Fetching active index...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 border border-slate-200 dark:border-slate-800/80 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/10">
                <p className="text-sm font-semibold text-slate-500">No documents index registered.</p>
                <p className="text-xs text-slate-400 mt-1">Uploaded files will show up here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-start justify-between group transition hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex gap-2.5 truncate">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={doc.fileName}>
                          {doc.fileName}
                        </p>
                        <div className="flex gap-2 items-center text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          <span className="uppercase">{doc.mimeType?.split('/')[1] || 'doc'}</span>
                          <span>•</span>
                          <span>{Math.round(doc.sizeBytes / 1024)} KB</span>
                          <span>•</span>
                          <span className="capitalize">{doc.visibility}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Active view details */}
        <div className="lg:col-span-8">
          
          {/* Tab 1: Document Chat */}
          {activeTab === 'chat' && (
            <div className="card flex flex-col h-[650px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/20">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exploratory Assistant</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      Scoped by owner security permissions.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedStartupId}
                    onChange={(e) => setSelectedStartupId(e.target.value)}
                    className="text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 focus:border-primary outline-none text-slate-700 dark:text-gray-300"
                  >
                    <option value="">Chat with All Docs</option>
                    {startups.map(s => (
                      <option key={s._id} value={s._id}>Filter: {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chat Message Box */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                        AI
                      </div>
                    )}
                    
                    <div className="max-w-[85%] space-y-3">
                      {/* Message Content Bubble */}
                      <div className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900 rounded-tl-none'
                          : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-none text-slate-900 dark:text-gray-100'
                      }`}>
                        {msg.isPending ? (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-semibold">Generating stream response...</span>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>

                      {/* Confidence Score & Sources List */}
                      {msg.role === 'assistant' && !msg.isPending && (msg.confidence !== undefined || (msg.sources && msg.sources.length > 0)) && (
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2.5 animate-in fade-in duration-300">
                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            {msg.confidence !== undefined && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getConfidenceBadgeColor(msg.confidence)}`}>
                                <Zap className="h-3 w-3" />
                                {getConfidenceLabel(msg.confidence)}
                              </span>
                            )}
                            {msg.route && (
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                Route: {msg.route}
                              </span>
                            )}
                          </div>

                          {/* Sources listing */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase text-slate-700 dark:text-gray-300 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Cited Sources:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {msg.sources.map((src, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900/80 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                      <span className="font-bold text-slate-700 dark:text-gray-200 truncate" title={src.fileName}>
                                        {src.fileName}
                                      </span>
                                    </div>
                                    <span className="text-[9px] font-bold text-primary bg-blue-50 dark:bg-blue-950/20 px-1 rounded">
                                      {Math.round(src.score * 100)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendQuery} className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex gap-3 bg-white dark:bg-slate-950">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about your pitch decks, market size, financial models..."
                  disabled={isStreaming}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isStreaming}
                  className="btn-primary px-5 py-3 flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Startup Search */}
          {activeTab === 'startup' && (
            <div className="card p-6 min-h-[600px] flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Startup Semantic Matcher
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                Search Startup documents and profiles semantically. Pinecone returns context closest to your query.
              </p>

              <form onSubmit={handleSemanticSearch} className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Find startups building logistics automation software with Series A traction"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="btn-primary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Search className="h-4.5 w-4.5" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Results */}
              <div className="flex-1">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <span className="font-semibold text-sm">Searching global RAG records...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 text-slate-400">
                    <Compass className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">No results found.</p>
                    <p className="text-xs text-slate-400 mt-1">Enter a query above to explore index vectors.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((hit, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-primary bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                              Match Score: {Math.round((hit.score || 0) * 100)}%
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 rounded">
                              Type: {hit.metadata?.sourceType || 'document'}
                            </span>
                          </div>
                          
                          {/* File info */}
                          <p className="text-xs font-bold text-slate-700 dark:text-gray-200 flex items-center gap-1.5 mb-2.5">
                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                            {hit.metadata?.fileName || 'startup_details.txt'}
                          </p>

                          {/* Chunk Preview */}
                          <p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                            {hit.content || hit.fields?.text || hit.text}
                          </p>
                        </div>

                        {/* Visibility check */}
                        <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                          <span>Owner: {hit.metadata?.ownerId === user._id ? 'You' : 'Public'}</span>
                          <span>Uploaded: {hit.metadata?.uploadedAt ? new Date(hit.metadata.uploadedAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Investor Search */}
          {activeTab === 'investor' && (
            <div className="card p-6 min-h-[600px] flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Investor Profile Semantic Finder
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                Query public investor summaries, deal books, and investment thesis files. Find matching investment firms.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSemanticSearch(e);
                }}
                className="flex gap-3 mb-6"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Find VCs investing in early stage bio-tech or sustainability in Boston"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  onClick={() => setSearchType('founderDoc')} // Querying investor files
                  disabled={!searchQuery.trim() || isSearching}
                  className="btn-primary py-3 px-6 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Search className="h-4.5 w-4.5" />}
                  <span>Query</span>
                </button>
              </form>

              {/* Results */}
              <div className="flex-1">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <span className="font-semibold text-sm">Searching VC directories...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/55 dark:bg-slate-900/10 text-slate-400">
                    <Compass className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 animate-none" />
                    <p className="text-sm font-semibold text-slate-500">No VCs found.</p>
                    <p className="text-xs text-slate-400 mt-1">Submit a search query to search investor files.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((hit, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-primary bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded">
                              VC Affinity: {Math.round((hit.score || 0) * 100)}%
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 rounded">
                              Source: {hit.metadata?.sourceType || 'founderDoc'}
                            </span>
                          </div>
                          
                          <p className="text-xs font-bold text-slate-700 dark:text-gray-200 flex items-center gap-1.5 mb-2.5">
                            <Users className="h-3.5 w-3.5 text-blue-500" />
                            {hit.metadata?.fileName || 'investor_profile.txt'}
                          </p>

                          <p className="text-xs text-slate-600 dark:text-gray-300 line-clamp-4 leading-relaxed">
                            {hit.content || hit.fields?.text || hit.text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Venture Matchmaker */}
          {activeTab === 'match' && (
            <div className="card p-6 min-h-[600px] flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                Venture Matchmaker Report
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mb-6">
                Let AI evaluate your startup profile against our complete pool of registered venture capital profiles.
              </p>

              {/* Startup Selection Row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                    Select Startup Profile to Match
                  </label>
                  <select
                    value={selectedMatchStartupId}
                    onChange={(e) => setSelectedMatchStartupId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold p-3 focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Choose Startup --</option>
                    {startups.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.industry})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:self-end">
                  <button
                    onClick={handleMatchFinder}
                    disabled={!selectedMatchStartupId || isMatching}
                    className="btn-primary w-full sm:w-auto py-3 px-8 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isMatching ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <RefreshCw className="h-4.5 w-4.5" />}
                    <span>Generate Match Report</span>
                  </button>
                </div>
              </div>

              {/* Report display */}
              <div className="flex-1 border border-slate-200 dark:border-slate-800/80 rounded-xl bg-slate-50/30 dark:bg-slate-900/10 p-6">
                {isMatching ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-4" />
                    <span className="font-semibold text-sm">Mapping startup vectors against VC records...</span>
                    <span className="text-xs text-slate-400 mt-1">Generating report using Groq completions...</span>
                  </div>
                ) : matchReport ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Metrics Row */}
                    <div className="flex flex-wrap gap-4 items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">Calculated RAG Confidence:</span>
                        <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${getConfidenceBadgeColor(matchConfidence)}`}>
                          {Math.round(matchConfidence * 100)}%
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                        Vector Supervised
                      </span>
                    </div>

                    {/* Report Content */}
                    <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-gray-200 space-y-4">
                      <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-2">VC Alignment Evaluation</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{matchReport}</p>
                    </div>

                    {/* Cited Investors list */}
                    {matchSources && matchSources.length > 0 && (
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-3">Retrieved Alignment Sources</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {matchSources.map((src, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="text-xs font-bold text-slate-700 dark:text-gray-300 truncate">
                                  {src.fileName || 'Investor Bio'}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/55 px-2 py-0.5 rounded">
                                Affinity: {Math.round(src.score * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Sparkles className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-500">No Match Report Active.</p>
                    <p className="text-xs text-slate-400 mt-1">Select one of your startups above and click &quot;Generate&quot;.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
