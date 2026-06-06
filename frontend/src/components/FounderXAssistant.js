'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Trash2, 
  Sun, 
  Moon, 
  Rocket, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  MessageCircle,
  X, 
  Send,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  Mail,
  FolderPlus,
  Video,
  PenTool,
  UploadCloud,
  Paperclip,
  History,
  Plus,
  Mic,
  MicOff,
  Volume2,
  Square,
  Search,
  Maximize2,
  Minimize2,
  Headphones
} from 'lucide-react';
import { 
  getAssistantResponse, 
  normalizeIndustry, 
  optimizeStartupDescription, 
  generateStartupHashtags,
  optimizeFounderBio,
  formatTrendingPostTags
} from '../utils/mentorAgent';
import { useAuth } from '../context/AuthContext';
import { getSafeImageSrc, getSafeInitial } from '../utils/helpers';

export default function FounderXAssistant() {
  const router = useRouter();
  const { user, token } = useAuth();
  
  // GENERAL INTERFACE STATE
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [theme, setTheme] = useState('light');
  const [errorState, setErrorState] = useState(null);
  
  // MULTI-SESSION HISTORY STATE
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // ACTION OPERATOR MULTI-FLOW STATE MACHINE
  const [activeAction, setActiveAction] = useState(null); // 'CREATE_STARTUP' | 'CREATE_POST' | 'EDIT_PROFILE' | 'UPLOAD_PITCH' | 'UPLOAD_VIDEO' | 'CREATE_STARTUP_PLAN' | 'GENERATE_PITCH' | 'MATCH_INVESTORS' | 'GENERATE_POST' | 'GENERATE_OUTREACH' | 'STARTUP_SCORE' | null
  const [formStep, setFormStep] = useState(0); 

  // COLLECTED DATA MODELS
  const [startupData, setStartupData] = useState({ name: '', oneLinePitch: '', description: '', industry: '', stage: '', contactEmail: '' });
  const [postData, setPostData] = useState({ title: '', content: '', tags: '' });
  const [profileData, setProfileData] = useState({ role: '', skills: '', bio: '' });
  const [pitchData, setPitchData] = useState({ title: '', fileName: '', fileSize: '' });
  const [videoData, setVideoData] = useState({ title: '', description: '', fileName: '', fileSize: '' });

  // HACKATHON DEMO AI OPERATOR MODELS
  const [startupPlanData, setStartupPlanData] = useState({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
  const [pitchGeneratorData, setPitchGeneratorData] = useState({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
  const [investorMatchData, setInvestorMatchData] = useState({ name: '', stage: '', targetMarket: '', fundingNeed: '' });
  const [outreachData, setOutreachData] = useState({ investorName: '', startupName: '', uvp: '', oneLinePitch: '' });
  const [startupScoreData, setStartupScoreData] = useState({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
  
  const [expandedPlans, setExpandedPlans] = useState({});
  const [activeDocViewer, setActiveDocViewer] = useState(null);

  // MOCK FILE DRAG-AND-DROP ACTIVE STATES
  const [isDragging, setIsDragging] = useState(false);

  // AI STARTUP CONTENT ASSISTANT MVP STATES
  const [pendingMedia, setPendingMedia] = useState(null); // { url, name, type }
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isEditingPostId, setIsEditingPostId] = useState(null);
  const [editedPost, setEditedPost] = useState(null); // { title, description, hashtags, cta, imageConcept }
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [schedulingPostId, setSchedulingPostId] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [publishingPostId, setPublishingPostId] = useState(null);
  
  // API PUBLISHING FLOW CONTROLLER
  const [publishingState, setPublishingState] = useState('idle'); // 'idle' | 'loading' | 'success' | 'draft_saved' | 'auth_required'
  const [publishingMessage, setPublishingMessage] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // VOICE INPUT STATE
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const voiceRecognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  
  // CONTINUOUS VOICE MODE
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const isContinuousModeRef = useRef(false);

  // VOICE OUTPUT (TTS) STATE
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const usedVoiceInput = useRef(false);

  // FULLSCREEN STATE
  const [isFullScreen, setIsFullScreen] = useState(false);

  // BARGE-IN DETECTION (SpeechRecognition during TTS)
  const speechRecognitionRef = useRef(null);
  const bargeInActiveRef = useRef(false);

  const API_URL = (typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL : undefined) || 'http://localhost:3000';

  // QUICK STARTER ACTION BUTTONS
  const quickActions = [
    { label: 'Generate Investor Pitch', type: 'prompt', prompt: 'Generate investor pitch' },
    { label: 'Create Startup Announcement', type: 'prompt', prompt: 'Create Startup Announcement' },
    { label: 'Create Product Launch Post', type: 'prompt', prompt: 'Create Product Launch Post' },
    { label: 'Create Hiring Post', type: 'prompt', prompt: 'Create Hiring Post' },
    { label: 'Create Funding Update', type: 'prompt', prompt: 'Create Funding Update' },
    { label: 'Create Founder Story', type: 'prompt', prompt: 'Create Founder Story' }
  ];

  // GREETING INITIALIZATION
  const welcomeMessage = {
    id: 'welcome',
    sender: 'ai',
    text: `🚀 **Welcome to FounderX AI Startup Copilot**\n\nI am your professional AI Content Assistant. I can automatically generate startup updates, launch announcements, hiring posts, funding milestones, or investor pitch decks. Choose a tool below to begin:`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actions: quickActions
  };

  const getSessionsKey = () => {
    const userId = user && (user._id || user.id);
    return userId ? `founderx_assistant_sessions_${userId}_v1` : 'founderx_assistant_sessions_anonymous_v1';
  };

  const getActiveIdKey = () => {
    const userId = user && (user._id || user.id);
    return userId ? `founderx_assistant_active_id_${userId}_v1` : 'founderx_assistant_active_id_anonymous_v1';
  };

  // LOAD LOGS & PREFERENCES WITH MULTI-SESSION LIFE-CYCLE
  useEffect(() => {
    const sessionsKey = getSessionsKey();
    const activeIdKey = getActiveIdKey();

    // 1. Load the list of sessions
    const storedSessions = localStorage.getItem(sessionsKey);
    let loadedSessions = [];
    if (storedSessions) {
      try {
        loadedSessions = JSON.parse(storedSessions);
        setSessions(loadedSessions);
      } catch (e) {}
    } else {
      setSessions([]);
    }

    // 2. Start a fresh new empty session every time they switch users or open the page
    const freshSessionId = Date.now().toString();
    setActiveSessionId(freshSessionId);
    setMessages([welcomeMessage]);
    localStorage.setItem(activeIdKey, freshSessionId);

    // 3. Load Theme
    const storedTheme = localStorage.getItem('founderx_assistant_theme');
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    const pulseTimer = setTimeout(() => {
      if (!isOpen) setHasUnread(true);
    }, 2000);

    return () => clearTimeout(pulseTimer);
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setIsFullScreen(false);
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      stopRecording();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
    }
  }, [isOpen]);

  // MULTI-SESSION UTILITIES
  const saveHistory = (updatedMessages) => {
    setMessages(updatedMessages);

    const sessionsKey = getSessionsKey();
    const activeIdKey = getActiveIdKey();

    const storedSessions = localStorage.getItem(sessionsKey);
    let currentSessions = [];
    if (storedSessions) {
      try {
        currentSessions = JSON.parse(storedSessions);
      } catch (e) {}
    }

    let activeId = activeSessionId;
    if (!activeId) {
      activeId = Date.now().toString();
      setActiveSessionId(activeId);
    }

    let sessionIndex = currentSessions.findIndex(s => s.id === activeId);

    let sessionTitle = "New Chat";
    if (sessionIndex !== -1) {
      sessionTitle = currentSessions[sessionIndex].title;
    }

    // Derive a clean, readable smart title when the first user message is sent
    if (sessionTitle === "New Chat" || sessionTitle === "Welcome Chat") {
      const firstUserMsg = updatedMessages.find(m => m.sender === 'user');
      if (firstUserMsg) {
        let derivedTitle = firstUserMsg.text
          .replace(/[#*`_\[\]]/g, '') // strip markdown
          .trim();
        
        // Remove helper prefix logs if present
        if (derivedTitle.startsWith('[Media uploaded:')) {
          const closeBracketIndex = derivedTitle.indexOf(']');
          if (closeBracketIndex !== -1) {
            derivedTitle = derivedTitle.substring(closeBracketIndex + 1).trim();
          }
        }

        if (derivedTitle.length > 28) {
          derivedTitle = derivedTitle.substring(0, 28) + '...';
        }
        sessionTitle = derivedTitle || "Chat Session";
      }
    }

    const sessionObj = {
      id: activeId,
      title: sessionTitle,
      messages: updatedMessages,
      updatedAt: Date.now()
    };

    if (sessionIndex !== -1) {
      currentSessions[sessionIndex] = sessionObj;
    } else {
      currentSessions.unshift(sessionObj);
    }

    // Sort: most recently active at the top
    currentSessions.sort((a, b) => b.updatedAt - a.updatedAt);

    setSessions(currentSessions);
    localStorage.setItem(sessionsKey, JSON.stringify(currentSessions));
    localStorage.setItem(activeIdKey, activeId);
  };

  const selectSession = (sessionId) => {
    const sessionsKey = getSessionsKey();
    const activeIdKey = getActiveIdKey();
    const storedSessions = localStorage.getItem(sessionsKey);
    if (storedSessions) {
      try {
        const currentSessions = JSON.parse(storedSessions);
        const session = currentSessions.find(s => s.id === sessionId);
        if (session) {
          setActiveSessionId(sessionId);
          setMessages(session.messages);
          localStorage.setItem(activeIdKey, sessionId);
          
          // Clear active action forms to prevent overlapping action states
          setActiveAction(null);
          setFormStep(0);
          setPublishingState('idle');
          setPendingMedia(null);
        }
      } catch (e) {}
    }
  };

  const startNewChat = () => {
    const activeIdKey = getActiveIdKey();
    const newSessionId = Date.now().toString();
    setActiveSessionId(newSessionId);
    setMessages([welcomeMessage]);
    localStorage.setItem(activeIdKey, newSessionId);
    
    setActiveAction(null);
    setFormStep(0);
    setPublishingState('idle');
    setPendingMedia(null);
  };

  const deleteSession = (sessionId, e) => {
    e.stopPropagation(); // Avoid selecting the deleted item
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      const sessionsKey = getSessionsKey();
      const storedSessions = localStorage.getItem(sessionsKey);
      if (storedSessions) {
        try {
          let currentSessions = JSON.parse(storedSessions);
          currentSessions = currentSessions.filter(s => s.id !== sessionId);
          setSessions(currentSessions);
          localStorage.setItem(sessionsKey, JSON.stringify(currentSessions));
          
          if (activeSessionId === sessionId) {
            startNewChat();
          }
        } catch (err) {}
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const [pendingTrigger, setPendingTrigger] = useState(null);

  useEffect(() => {
    const handleTriggerAssistant = (e) => {
      const query = e.detail?.query || '';
      setIsOpen(true);
      setHasUnread(false);
      setErrorState(null);
      if (query) {
        setPendingTrigger(query);
      }
    };

    window.addEventListener('trigger-founderx-assistant', handleTriggerAssistant);
    return () => window.removeEventListener('trigger-founderx-assistant', handleTriggerAssistant);
  }, []);

  useEffect(() => {
    if (pendingTrigger) {
      handleSendMessage(pendingTrigger);
      setPendingTrigger(null);
    }
  }, [pendingTrigger]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, activeAction, formStep, publishingState]);

  const toggleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      setHasUnread(false);
      setErrorState(null);
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setIsOpen(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('founderx_assistant_theme', nextTheme);
  };

  const clearChat = () => {
    if (window.confirm("Do you want to reset all conversation logs and cancel active form actions?")) {
      const resetState = [welcomeMessage];
      setMessages(resetState);
      saveHistory(resetState);
      cancelActiveAction();
    }
  };

  const cancelActiveAction = () => {
    setActiveAction(null);
    setFormStep(0);
    setPublishingState('idle');
    
    const cancelMsg = {
      id: Date.now().toString(),
      sender: 'ai',
      text: "❌ **Action Cancelled**\n\nI have cancelled the active process and cleared your inputs. What else can I help you operate or find on FounderX?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: quickActions
    };

    const updated = [...messages, cancelMsg];
    setMessages(updated);
    saveHistory(updated);
  };

  // INTENT INITIALIZATION INTERCEPTORS
  const handleActionActivation = (actionType) => {
    setActiveAction(actionType);
    setFormStep(0);
    setPublishingState('idle');
    setErrorState(null);

    let textPrompt = "";
    let actionsList = ['Cancel'];

    if (actionType === 'CREATE_STARTUP') {
      setStartupData({ name: '', oneLinePitch: '', description: '', industry: '', stage: '', contactEmail: '' });
      textPrompt = "🚀 **FounderX AI Operator Activated**\n\nGreat choice! Let's build your professional **Startup Profile** on FounderX. I will guide you through this step-by-step to optimize your details for VCs.\n\nFirst, **what is your startup name?**";
    } else if (actionType === 'CREATE_POST') {
      setPostData({ title: '', content: '', tags: '' });
      textPrompt = "🚀 **FounderX AI Operator Activated**\n\nAwesome! Let's write and publish an engaging **Startup Update Post** to the global feed.\n\nFirst, **what is the title of your post?**";
    } else if (actionType === 'EDIT_PROFILE') {
      setProfileData({ role: '', skills: '', bio: '' });
      textPrompt = "🚀 **FounderX AI Operator Activated**\n\nOutstanding! Let's optimize your **Founder Profile** details.\n\nFirst, **what is your current role/job title?** (e.g. Founder & CEO, Tech Architect)";
    } else if (actionType === 'UPLOAD_PITCH') {
      setPitchData({ title: '', fileName: '', fileSize: '' });
      textPrompt = "🚀 **FounderX AI Operator Activated**\n\nExcellent decision! Let's publish your **Pitch Presentation Deck** to your profile to capture investor attention.\n\nFirst, **what is the title of this pitch deck?** (e.g. Seed Overview, Core Pitch)";
    } else if (actionType === 'UPLOAD_VIDEO') {
      setVideoData({ title: '', description: '', fileName: '', fileSize: '' });
      textPrompt = "🚀 **FounderX AI Operator Activated**\n\nSplendid! Vertical pitch videos get **4.5x more click-throughs** on the Watch feed.\n\nFirst, **what is the title of your vertical pitch video?** (e.g. 60-Second Elevator Pitch)";
    } else if (actionType === 'CREATE_STARTUP_PLAN') {
      setStartupPlanData({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
      textPrompt = "🚀 **Startup Plan Builder**\nStep 1 of 6\n\nWhat is your **startup name**?";
    } else if (actionType === 'GENERATE_PITCH') {
      setPitchGeneratorData({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
      textPrompt = "🚀 **AI Pitch Generator**\nStep 1 of 5\n\nWhat is your **startup name**?";
    } else if (actionType === 'MATCH_INVESTORS') {
      setInvestorMatchData({ name: '', stage: 'Idea Stage', targetMarket: '', fundingNeed: '' });
      textPrompt = "🚀 **AI Investor Match Assistant**\nStep 1 of 5\n\nWhat is your **startup name**?";
    } else if (actionType === 'GENERATE_POST') {
      setPostData({ title: '', content: '', tags: '' }); // Uses shared postData for final submit!
      textPrompt = "🚀 **AI Post Generator**\n\nEnter a **rough update or startup idea** (e.g. 'we hit 10k users and launched a new referral code') and I will write a high-engagement social post for you!";
    } else if (actionType === 'GENERATE_OUTREACH') {
      setOutreachData({ investorName: '', startupName: '', uvp: '', oneLinePitch: '' });
      textPrompt = "🚀 **AI Investor Outreach Message**\nStep 1 of 3\n\nWhat is the **name of the investor or VC fund** you are reaching out to?";
    } else if (actionType === 'STARTUP_SCORE') {
      setStartupScoreData({ name: '', description: '', targetMarket: '', uvp: '', revenueModel: '' });
      textPrompt = "🚀 **AI Startup Score**\nStep 1 of 5\n\nWhat is your **startup name**?";
    }

    const triggerMsg = {
      id: Date.now().toString(),
      sender: 'ai',
      text: textPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: actionsList
    };

    const updated = [...messages, triggerMsg];
    setMessages(updated);
    saveHistory(updated);
  };

  // FILE UPLOAD HANDLER
  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check if the file is a document format
    const isDoc = file.name.endsWith('.pdf') || 
                  file.name.endsWith('.docx') || 
                  file.name.endsWith('.doc') || 
                  file.name.endsWith('.txt') ||
                  file.type === 'application/pdf' ||
                  file.type === 'text/plain' ||
                  file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isDoc) {
      setUploadingMedia(true);
      setErrorState(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sourceType', 'document');
        formData.append('visibility', 'private');

        const headers = {};
        const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (jwtToken) {
          headers['Authorization'] = `Bearer ${jwtToken}`;
        }

        // Add a user message showing the document being uploaded
        const userMsgId = Date.now().toString();
        const userMsg = {
          id: userMsgId,
          sender: 'user',
          text: `📄 Uploaded file: **${file.name}**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedWithUser = [...messages, userMsg];
        setMessages(updatedWithUser);

        const res = await fetch(`${API_URL}/api/rag/upload`, {
          method: 'POST',
          headers,
          body: formData
        });

        const data = await res.json();
        if (res.ok && data.success) {
          const confirmationText = `✅ Document **"${file.name}"** uploaded and indexed successfully. You can now ask questions about it in this session!`;
          const aiMsg = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: confirmationText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actions: ['Check my founder score', 'Search startups']
          };
          const updatedHistory = [...updatedWithUser, aiMsg];
          setMessages(updatedHistory);
          saveHistory(updatedHistory);
        } else {
          throw new Error(data.message || data.error || 'Upload and indexing failed');
        }
      } catch (err) {
        console.error('Document indexing failed:', err);
        const errorMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `❌ Failed to parse and index document "${file.name}": ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updatedHistory = [...messages, errorMsg];
        setMessages(updatedHistory);
        saveHistory(updatedHistory);
        setErrorState('Document indexing failed: ' + err.message);
      } finally {
        setUploadingMedia(false);
      }
      return;
    }

    setUploadingMedia(true);
    setErrorState(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const headers = {};
      const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPendingMedia({
          url: data.url,
          name: file.name,
          type: data.type
        });
        
        // Advance flow if active
        if (activeAction === 'UPLOAD_PITCH') {
          const pData = { ...pitchData, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB` };
          setPitchData(pData);
          setFormStep(2);
          setPublishingState('idle');
          pushPreviewMsg('PITCH_PREVIEW', pData, messages);
        } else if (activeAction === 'UPLOAD_VIDEO') {
          const vData = { ...videoData, fileName: file.name, fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB` };
          setVideoData(vData);
          setFormStep(3);
          setPublishingState('idle');
          pushPreviewMsg('VIDEO_PREVIEW', vData, messages);
        }
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setErrorState('File upload failed: ' + err.message);
    } finally {
      setUploadingMedia(false);
    }
  };

  // VOICE RECORDING CONTROLS
  const startRecording = async () => {
    // Stop any barge-in detection before starting full recording
    stopBargeInDetection();

    if (voiceRecognitionRef.current) {
      try { voiceRecognitionRef.current.stop(); } catch (e) {}
    }
    
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    try {
      transcriptRef.current = '';
      setInputValue('');
      setErrorState(null);
      usedVoiceInput.current = true;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        const fullTranscript = finalTranscript + interimTranscript;
        transcriptRef.current = fullTranscript;
        setInputValue(fullTranscript);

        // Reset silence timer in continuous mode
        if (isContinuousModeRef.current) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (transcriptRef.current.trim()) {
              stopRecording();
            }
          }, 1500); // 1.5 seconds of silence
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        voiceRecognitionRef.current = null;
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        const textToSend = transcriptRef.current.trim();
        if (textToSend) {
          handleSendMessage(textToSend);
        } else {
          // If in continuous mode and nothing was spoken, keep listening after a short delay
          if (isContinuousModeRef.current && !speakingMsgId && !isTyping) {
            setTimeout(() => {
              if (isContinuousModeRef.current && !speakingMsgId && !isTyping && !voiceRecognitionRef.current) {
                startRecording();
              }
            }, 1000);
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn("Voice recognition error:", event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted' && event.error !== 'not-allowed') {
          setErrorState("Voice input error: " + event.error);
        }
        setIsRecording(false);
        voiceRecognitionRef.current = null;
      };

      voiceRecognitionRef.current = recognition;
      setIsRecording(true);
      recognition.start();

    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access microphone/speech recognition. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (voiceRecognitionRef.current) {
      try {
        voiceRecognitionRef.current.stop();
      } catch (e) {}
      voiceRecognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleManualStop = () => {
    setIsContinuousMode(false);
    isContinuousModeRef.current = false;
    stopRecording();
    stopBargeInDetection();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const handleStopSpeakingOrRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    if (speakingMsgId) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
    }
  };

  // BARGE-IN DETECTION: Use SpeechRecognition to detect user speech during TTS
  const startBargeInDetection = useCallback(() => {
    const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = () => {
        // User started speaking — barge in!
        bargeInActiveRef.current = true;
        
        // 1. Cancel TTS immediately
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        setSpeakingMsgId(null);
        
        // 2. Stop detection recognition
        try { recognition.stop(); } catch (e) {}
        speechRecognitionRef.current = null;
        
        // 3. Start full recording
        startRecording();
      };

      recognition.onerror = (event) => {
        // Ignore 'no-speech' and 'aborted' errors silently
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Barge-in detection error:', event.error);
        }
        speechRecognitionRef.current = null;
        bargeInActiveRef.current = false;
      };

      recognition.onend = () => {
        // If continuous mode is still active and TTS is still playing, restart detection
        if (isContinuousModeRef.current && speakingMsgId && !bargeInActiveRef.current) {
          try { recognition.start(); } catch (e) {}
        } else {
          speechRecognitionRef.current = null;
        }
      };

      speechRecognitionRef.current = recognition;
      bargeInActiveRef.current = false;
      recognition.start();
    } catch (err) {
      console.warn('Could not start barge-in detection:', err);
    }
  }, [speakingMsgId]);

  const stopBargeInDetection = useCallback(() => {
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
      speechRecognitionRef.current = null;
    }
    bargeInActiveRef.current = false;
  }, []);

  // VOICE OUTPUT (TTS)
  const speakText = (text, msgId) => {
    if ('speechSynthesis' in window) {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      
      // Clean up markdown/emojis for speech
      const cleanText = text.replace(/[*_#]/g, '').replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = selectedLang;
      utterance.onend = () => {
        setSpeakingMsgId(null);
        if (isContinuousModeRef.current) {
          setTimeout(() => {
            startRecording();
          }, 800); // Small pause before auto-recording again
        }
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
        if (isContinuousModeRef.current) {
          setTimeout(() => {
            startRecording();
          }, 800);
        }
      };
      
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  // DISPATCHER INCOMING MESSAGES
  const handleSendMessage = async (textToSend, directAudioFile = null) => {
    const isTextEmpty = !textToSend.trim();
    if (isTextEmpty && !pendingMedia && !directAudioFile) return;

    const actualText = isTextEmpty && pendingMedia ? 'Analyze this uploaded media' : textToSend;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: actualText || '🎤 Voice Message',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      media: pendingMedia || (directAudioFile ? { name: 'Voice Note', type: 'audio' } : null)
    };

    const mediaToSend = directAudioFile ? { file: directAudioFile, type: 'audio' } : pendingMedia;
    setPendingMedia(null); // Clear pending media state instantly after capturing

    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    saveHistory(updatedWithUser);
    setInputValue('');

    // INTERCEPT IF ACTION FLOW ACTIVE
    if (activeAction) {
      if (actualText.toLowerCase().trim() === 'cancel' || actualText.toLowerCase().trim() === 'cancel creation') {
        cancelActiveAction();
        return;
      }

      setIsTyping(true);
      setTimeout(() => {
        processActionStep(actualText, updatedWithUser);
        setIsTyping(false);
      }, 750);
      return;
    }

    // GENERAL CHAT INTENT INTERCEPT
    // Combine text with media description if present for local/fallback routing
    const combinedPrompt = mediaToSend 
      ? `[Media uploaded: ${mediaToSend.name} (${mediaToSend.type}) url: ${mediaToSend.url}] ${actualText}`
      : actualText;

    const responseData = getAssistantResponse(combinedPrompt);

    if (responseData.actionTrigger) {
      handleActionActivation(responseData.actionTrigger);
      return;
    }

    setIsTyping(true);
    setErrorState(null);

    try {
      const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      let reqBody, reqHeaders;

      if (mediaToSend && mediaToSend.file) {
        // Send as FormData if there is a raw file (e.g. recorded voice)
        reqBody = new FormData();
        reqBody.append('messages', JSON.stringify(messages));
        reqBody.append('userPrompt', actualText);
        reqBody.append('file', mediaToSend.file);
        reqBody.append('language', selectedLang);
        
        reqHeaders = {};
        if (jwtToken) reqHeaders['Authorization'] = `Bearer ${jwtToken}`;
      } else {
        // Send as JSON
        reqBody = JSON.stringify({
          messages: messages, // Send history
          userPrompt: combinedPrompt,
          language: selectedLang
        });
        
        reqHeaders = {
          'Content-Type': 'application/json'
        };
        if (jwtToken) reqHeaders['Authorization'] = `Bearer ${jwtToken}`;
      }

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: reqHeaders,
        body: reqBody
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: data.actions || [],
          route: data.route || null,
          sources: data.sources || null,
          confidence: data.confidence !== undefined ? data.confidence : null,
          media: mediaToSend, // Bind media metadata to post if returned
          type: data.type || null,
          previewData: data.data || null
        };

        const updatedHistory = [...updatedWithUser, aiMsg];
        setMessages(updatedHistory);
        saveHistory(updatedHistory);
        if (isContinuousModeRef.current || usedVoiceInput.current) {
          speakText(aiMsg.text, aiMsg.id);
        }
      } else {
        throw new Error(data.message || 'Groq server returned an error');
      }
    } catch (err) {
      console.warn("Live assistant completions failed, falling back to local mentor engine:", err);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseData.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: responseData.actions || [],
        route: responseData.route || null,
        media: mediaToSend, // Bind media
        type: responseData.type || null,
        previewData: responseData.data || null
      };

      const updatedHistory = [...updatedWithUser, aiMsg];
      setMessages(updatedHistory);
      saveHistory(updatedHistory);
      if (isContinuousModeRef.current || usedVoiceInput.current) {
        speakText(aiMsg.text, aiMsg.id);
      }
    } finally {
      setIsTyping(false);
      usedVoiceInput.current = false;
    }
  };

  // ================= PARSED AUTO POST HELPER MODULES =================
  const parseAutoPost = (text) => {
    if (!text || !text.includes('---START_AUTO_POST---')) return null;
    try {
      const startIndex = text.indexOf('---START_AUTO_POST---') + '---START_AUTO_POST---'.length;
      const endIndex = text.indexOf('---END_AUTO_POST---');
      const block = text.substring(startIndex, endIndex !== -1 ? endIndex : text.length).trim();
      
      const lines = block.split('\n');
      const post = {
        title: '',
        description: '',
        hashtags: '',
        cta: '',
        imageConcept: ''
      };
      
      lines.forEach(line => {
        const cleanLine = line.trim();
        if (cleanLine.startsWith('TITLE:')) {
          post.title = cleanLine.replace('TITLE:', '').trim();
        } else if (cleanLine.startsWith('DESCRIPTION:')) {
          post.description = cleanLine.replace('DESCRIPTION:', '').trim();
        } else if (cleanLine.startsWith('HASHTAGS:')) {
          post.hashtags = cleanLine.replace('HASHTAGS:', '').trim();
        } else if (cleanLine.startsWith('CTA:')) {
          post.cta = cleanLine.replace('CTA:', '').trim();
        } else if (cleanLine.startsWith('IMAGE_CONCEPT:')) {
          post.imageConcept = cleanLine.replace('IMAGE_CONCEPT:', '').trim();
        }
      });
      return post;
    } catch (e) {
      console.error('Error parsing auto post block:', e);
      return null;
    }
  };

  const handleSavePostEdit = (msgId) => {
    if (!editedPost) return;
    const updatedMessages = messages.map(msg => {
      if (msg.id === msgId) {
        const introText = msg.text.split('---START_AUTO_POST---')[0] || '';
        const updatedText = `${introText}---START_AUTO_POST---
TITLE: ${editedPost.title}
DESCRIPTION: ${editedPost.description}
HASHTAGS: ${editedPost.hashtags}
CTA: ${editedPost.cta}
IMAGE_CONCEPT: ${editedPost.imageConcept}
---END_AUTO_POST---`;
        return {
          ...msg,
          text: updatedText
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setIsEditingPostId(null);
    setEditedPost(null);
  };

  const handleGenerateAIImage = (msgId, imageConcept) => {
    setIsGeneratingImage(true);
    // Simulate DALL-E generation
    setTimeout(() => {
      const mockImages = [
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=futuristic%20startup%20SaaS%20launch%20art%20gradient&image_size=landscape',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20developer%20writing%20code%20workspace&image_size=landscape',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=high-contrast%20digital%20dashboard%20infographics&image_size=landscape',
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=creative%20team%20collab%20neon%20whiteboard&image_size=landscape'
      ];
      const selectedImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      
      const updatedMessages = messages.map(msg => {
        if (msg.id === msgId) {
          return {
            ...msg,
            media: {
              url: selectedImage,
              type: 'image',
              name: 'ai_generated_concept.jpg'
            }
          };
        }
        return msg;
      });
      setMessages(updatedMessages);
      saveHistory(updatedMessages);
      setIsGeneratingImage(false);
    }, 1500);
  };

  const handleSchedulePost = (msgId, date, time) => {
    if (!date || !time) {
      alert("Please select a valid date and time!");
      return;
    }
    const updatedMessages = messages.map(msg => {
      if (msg.id === msgId) {
        return {
          ...msg,
          scheduledAt: `${date} at ${time}`
        };
      }
      return msg;
    });
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setSchedulingPostId(null);
    setScheduledDate('');
    setScheduledTime('');
  };

  const handlePublishParsedPost = async (parsedPost, mediaUrl, msgId) => {
    setPublishingPostId(msgId);
    const previewData = {
      title: parsedPost.title,
      content: `${parsedPost.description}\n\n${parsedPost.cta || ''}`,
      tags: parsedPost.hashtags,
      cleanTags: parsedPost.hashtags,
      mediaUrl: mediaUrl || ''
    };
    await handlePublishAction(previewData, 'CREATE_POST');
  };

  // ================= DYNAMIC AI ECOSYSTEM COMPLETION GENERATORS =================

  const generateFinalPlan = async (planData, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Synthesizing parameters and drafting your Startup Plan...");
    try {
      const promptText = `Act as an elite FounderX Operator. Synthesize a professional, highly detailed, and comprehensive startup plan based on these details:
Startup Name: ${planData.name}
Description: ${planData.description}
Target Market: ${planData.targetMarket}
Unique Value Proposition (UVP): ${planData.uvp}
Revenue Model: ${planData.revenueModel}

Format the response beautifully as a Startup Lean Canvas and Execution Roadmap. Keep sections actionable, direct, and structured.`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Startup Plan generated successfully!");
        const planMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **Startup Plan Generated!**\n\nI have created a premium, custom startup roadmap for **${planData.name}** based on your inputs. Check the interactive plan box below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'PLAN_PREVIEW',
          previewData: {
            startupName: planData.name,
            planText: data.text,
            inputs: planData
          }
        };
        setMessages([...currentHistory, planMsg]);
        saveHistory([...currentHistory, planMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live plan generation failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local fallback Startup Plan.");
      const fallbackPlanText = `🚀 **Startup Lean Canvas & Plan for ${planData.name}**

**1. Problem & Solution**
- Description: ${planData.description}

**2. Target Market**
- Customer Segment: ${planData.targetMarket}

**3. Unique Value Proposition (UVP)**
- Core Hook: ${planData.uvp}
- Unfair Advantage: Scalable architecture, first-mover positioning in ${planData.targetMarket}.

**4. Revenue Model**
- Monetization Strategy: ${planData.revenueModel}

**5. 30-60-90 Day Execution Roadmap**
- **Days 1-30**: Talk to 10 prospective target customers to validate description assumptions. Build a simple MVP landing page.
- **Days 31-60**: Launch early beta to waitlist signups. Set up feedback collection system.
- **Days 61-90**: Refine pricing, scale marketing channels, and prepare pitch deck for FounderX Investors portal.`;

      const planMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **Startup Plan Generated (Local Mode)!**\n\nI have generated a local Lean Canvas plan for **${planData.name}**. Check the interactive plan box below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'PLAN_PREVIEW',
        previewData: {
          startupName: planData.name,
          planText: fallbackPlanText,
          inputs: planData
        }
      };
      setMessages([...currentHistory, planMsg]);
      saveHistory([...currentHistory, planMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const generatePitchSuite = async (pitchDataObj, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Synthesizing fields and generating your Pitch Suite...");
    try {
      const promptText = `Act as an elite FounderX Operator. Generate a premium Pitch Suite including:
1. 30-Second Elevator Pitch (high-energy, punchy).
2. Investor Pitch Structure (10-slide outline).
3. Crisp One-Line Tagline.

Startup Details:
- Startup Name: ${pitchDataObj.name}
- Description: ${pitchDataObj.description}
- Target Market: ${pitchDataObj.targetMarket}
- Unique Value Proposition: ${pitchDataObj.uvp}
- Revenue Model: ${pitchDataObj.revenueModel}`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Pitch Suite generated successfully!");
        const pitchMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **AI Pitch Suite Generated!**\n\nI have generated a custom Elevator Pitch, Tagline, and Slide Outline for **${pitchDataObj.name}**. Review details below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'PITCH_PREVIEW',
          previewData: {
            startupName: pitchDataObj.name,
            pitchText: data.text,
            inputs: pitchDataObj
          }
        };
        setMessages([...currentHistory, pitchMsg]);
        saveHistory([...currentHistory, pitchMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live pitch generation failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local fallback Pitch Suite.");
      const fallbackPitchText = `🚀 **Pitch Suite for ${pitchDataObj.name}**

**1. One-Line Tagline**
"10x faster ${pitchDataObj.description.toLowerCase().replace(/\./g, '')} for ${pitchDataObj.targetMarket} powered by next-generation automation."

**2. 30-Second Elevator Pitch**
"Did you know that ${pitchDataObj.targetMarket} lose hours daily trying to solve their workflow blocks? That's why we built ${pitchDataObj.name}. We help them ${pitchDataObj.description} using our breakthrough ${pitchDataObj.uvp}. We monetize via a highly attractive ${pitchDataObj.revenueModel} model and have already seen massive early waitlist signups. Let's talk!"

**3. Investor Slide Structure**
- Slide 1: Title & Tagline
- Slide 2: The Pain Point of ${pitchDataObj.targetMarket}
- Slide 3: Our Solution (${pitchDataObj.name})
- Slide 4: Underlying Magic & ${pitchDataObj.uvp}
- Slide 5: Business & ${pitchDataObj.revenueModel} Model
- Slide 6: Go-to-Market Strategy
- Slide 7: Traction (Early feedback from co-founders)
- Slide 8: The Dream Team
- Slide 9: Financial Forecast
- Slide 10: The Investment Request`;

      const pitchMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **AI Pitch Suite Generated (Local Fallback)!**\n\nI have structured a premium pitch suite based on your startup. Review details below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'PITCH_PREVIEW',
        previewData: {
          startupName: pitchDataObj.name,
          pitchText: fallbackPitchText,
          inputs: pitchDataObj
        }
      };
      setMessages([...currentHistory, pitchMsg]);
      saveHistory([...currentHistory, pitchMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const matchInvestors = async (matchDataObj, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Analyzing investor segments and searching database...");
    try {
      const promptText = `Act as an elite FounderX Operator. Recommend 3 highly suitable investor types or matching categories for this startup:
- Startup Name: ${matchDataObj.name}
- Stage: ${matchDataObj.stage}
- Target Market: ${matchDataObj.targetMarket}
- Funding Needed: ${matchDataObj.fundingNeed}

Structure the output as a neat recommendation with scores and match reasons.`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Matches calculated successfully!");
        const matchMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **Investor Matches Formulated!**\n\nI have analyzed your stage and funding requirements to formulate 3 suitable investor classes. Review matches below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'MATCH_PREVIEW',
          previewData: {
            startupName: matchDataObj.name,
            matchText: data.text,
            inputs: matchDataObj
          }
        };
        setMessages([...currentHistory, matchMsg]);
        saveHistory([...currentHistory, matchMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live investor matching failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local matched Investor Report.");
      const fallbackMatchText = `🚀 **Investor Matching Report for ${matchDataObj.name}**

**1. Angel Syndicate Investors**
- **Match Score**: 94%
- **Match Reason**: At the ${matchDataObj.stage}, angels provide critical early cash buffers. Your target market (${matchDataObj.targetMarket}) is highly attractive to private tech angels.

**2. Pre-Seed Venture Funds**
- **Match Score**: 88%
- **Match Reason**: Micro-VCs look for founders raising early rounds (e.g. ${matchDataObj.fundingNeed}) with a clear product roadmap.

**3. FounderX Ecosystem Grants**
- **Match Score**: 85%
- **Match Reason**: Non-dilutive equity grant schemes are highly suited for early-stage builders validating workflows in ${matchDataObj.targetMarket}.`;

      const matchMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **Investor Matches Formulated (Local Fallback)!**\n\nReview your matched investor report below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'MATCH_PREVIEW',
        previewData: {
          startupName: matchDataObj.name,
          matchText: fallbackMatchText,
          inputs: matchDataObj
        }
      };
      setMessages([...currentHistory, matchMsg]);
      saveHistory([...currentHistory, matchMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const generateSocialPost = async (roughUpdateText, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Crafting an engaging social feed post using AI...");
    try {
      const promptText = `Convert this rough startup update into a highly professional, engaging, and premium milestone post for a startup community feed:
"${roughUpdateText}"
      
Keep the tone optimistic, traction-focused, and add 3-4 hashtags like #BuildingInPublic.`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Post formatted successfully!");
        const postMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **AI Post Formulated!**\n\nI have restructured your rough idea into a premium, traction-focused social update. You can publish it live to the global Community Feed below!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'POST_PREVIEW',
          previewData: {
            title: `Milestone Update: AI Post`,
            content: data.text,
            tags: '#BuildingInPublic #Traction #FounderX'
          }
        };
        setMessages([...currentHistory, postMsg]);
        saveHistory([...currentHistory, postMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live social post formatting failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local fallback Social Post.");
      const fallbackPostText = `🚀 **Startup Milestone Update!**

Exciting news! We are thrilled to share that we just: "${roughUpdateText}"! 

It's been a journey of intensive execution, customer validation, and co-founder sprints. Huge shoutout to the FounderX ecosystem for supporting us along the way! 

Stay tuned for more updates as we ship new features next week! 

#BuildingInPublic #StartupLife #Traction #FounderX`;

      const postMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **AI Post Formulated (Local Fallback)!**\n\nI have converted your rough update into a premium social update. You can publish it live below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'POST_PREVIEW',
        previewData: {
          title: `Startup Milestone Update`,
          content: fallbackPostText,
          tags: '#BuildingInPublic #Traction #FounderX'
        }
      };
      setMessages([...currentHistory, postMsg]);
      saveHistory([...currentHistory, postMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const generateInvestorOutreach = async (outreachDataObj, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Drafting your personalized Investor Outreach Pitch...");
    try {
      const promptText = `Act as an elite FounderX Operator. Write a professional, high-conversion email outreach message of under 150 words:
- Target Investor Name/Fund: ${outreachDataObj.investorName}
- Startup Name: ${outreachDataObj.startupName}
- UVP: ${outreachDataObj.uvp}
      
Make sure to include the exact phrase: "I'm interested in your startup. Let's connect and discuss investment possibilities." or a highly professional variation thereof.`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Outreach pitch drafted successfully!");
        const outreachMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **AI Investor Outreach Message Generated!**\n\nI have generated a high-impact email pitch for **${outreachDataObj.investorName}**. Review outreach copy below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'OUTREACH_PREVIEW',
          previewData: {
            investorName: outreachDataObj.investorName,
            outreachText: data.text,
            inputs: outreachDataObj
          }
        };
        setMessages([...currentHistory, outreachMsg]);
        saveHistory([...currentHistory, outreachMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live outreach message drafting failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local fallback Outreach Pitch.");
      const fallbackOutreachText = `Subject: Quick Intro: ${outreachDataObj.startupName} - Disrupting with ${outreachDataObj.uvp}

Dear ${outreachDataObj.investorName},

I have been following your investment track record and noticed your deep expertise in backing high-growth tech architectures.

I'm the founder of ${outreachDataObj.startupName}. We are solving core workflow blocks for our target market using our breakthrough value proposition: ${outreachDataObj.uvp}. We monetize through scalable recurring subscriptions and have already registered remarkable waitlist conversions.

I'm interested in your investment thesis. Let's connect and discuss investment possibilities. Do you have 10 minutes for a brief introductory call next Tuesday at 10 AM EST?

Best regards,
[Founder Name]
${outreachDataObj.startupName}`;

      const outreachMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **AI Investor Outreach Message Generated (Local Fallback)!**\n\nI have generated a customized outreach letter. Review details below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'OUTREACH_PREVIEW',
        previewData: {
          investorName: outreachDataObj.investorName,
          outreachText: fallbackOutreachText,
          inputs: outreachDataObj
        }
      };
      setMessages([...currentHistory, outreachMsg]);
      saveHistory([...currentHistory, outreachMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const calculateStartupScore = async (scoreDataObj, currentHistory) => {
    setIsTyping(true);
    setPublishingState('loading');
    setPublishingMessage("Analyzing startup dimensions and running VC scoring algorithms...");
    try {
      const promptText = `Analyze this startup and calculate an overall Startup Score out of 100 based on the 5 dimensions:
1. Problem Clarity (out of 20)
2. Market Size (out of 20)
3. Revenue Model (out of 20)
4. Scalability (out of 20)
5. Founder Readiness (out of 20)

Startup Details:
- Startup Name: ${scoreDataObj.name}
- Description: ${scoreDataObj.description}
- Target Market: ${scoreDataObj.targetMarket}
- UVP: ${scoreDataObj.uvp}
- Revenue Model: ${scoreDataObj.revenueModel}

Then, provide exactly 3 highly actionable VC improvement suggestions to raise the score.`;

      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], userPrompt: promptText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishingState('success');
        setPublishingMessage("Startup Score calculated successfully!");
        const scoreMsg = {
          id: Date.now().toString(),
          sender: 'ai',
          text: `🎉 **AI Startup Scorecard Calculated!**\n\nI have analyzed your pitch details to formulate a comprehensive investment index and VC scorecard. Review report below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'SCORE_PREVIEW',
          previewData: {
            startupName: scoreDataObj.name,
            scoreText: data.text,
            score: 84,
            breakdown: { problem: 18, market: 16, revenue: 17, scale: 17, readiness: 16 },
            inputs: scoreDataObj
          }
        };
        setMessages([...currentHistory, scoreMsg]);
        saveHistory([...currentHistory, scoreMsg]);
      } else {
        throw new Error('Groq failed');
      }
    } catch (err) {
      console.warn("Live startup score calculation failed, falling back to local builder:", err);
      setPublishingState('success');
      setPublishingMessage("Generated local fallback Startup Scorecard.");
      const fallbackScoreText = `🚀 **AI Startup Scorecard for ${scoreDataObj.name}**

**1. Dimensional Index Breakdown (82/100 Overall)**
- **Problem Clarity**: 17/20 (Clear and painfully defined problem for ${scoreDataObj.targetMarket})
- **Market Size**: 15/20 (Strong TAM potential but SAM SOM needs deeper data points)
- **Revenue Model**: 16/20 (${scoreDataObj.revenueModel} is highly valid; pricing structure looks solid)
- **Scalability**: 17/20 (Leverages ${scoreDataObj.uvp} for compounding growth)
- **Founder Readiness**: 17/20 (Excellent execution velocity shown in pitch setup)

**2. 3 Actionable VC Improvement Suggestions**
1. *Quantify the Market SOM*: Explicitly define the exact initial beachhead customer size in ${scoreDataObj.targetMarket} to demonstrate low acquisition drag.
2. *Document User Discovery data*: Add statistics from at least 15 customer discovery interviews to validate problem clarity points.
3. *Launch a 2-Week MVP Smoke Test*: Set up a waitlist conversion landing page displaying ${scoreDataObj.uvp} and measure signups to prove scalability index.`;

      const scoreMsg = {
        id: Date.now().toString(),
        sender: 'ai',
        text: `🎉 **AI Startup Scorecard Calculated (Local Fallback)!**\n\nI have compiled a VC scorecard index for **${scoreDataObj.name}**. Review report below.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'SCORE_PREVIEW',
        previewData: {
          startupName: scoreDataObj.name,
          scoreText: fallbackScoreText,
          score: 82,
          breakdown: { problem: 17, market: 15, revenue: 16, scale: 17, readiness: 17 },
          inputs: scoreDataObj
        }
      };
      setMessages([...currentHistory, scoreMsg]);
      saveHistory([...currentHistory, scoreMsg]);
    } finally {
      setIsTyping(false);
      setActiveAction(null);
      setFormStep(0);
      setTimeout(() => setPublishingState('idle'), 1500);
    }
  };

  const processActionStep = (inputText, currentHistory) => {
    let nextStep = formStep;

    // INTERCEPT TYPED TEXT IN NON-TEXT STEPS (Previews and Drag-and-Drop)
    const isStartupPreview = activeAction === 'CREATE_STARTUP' && formStep === 6;
    const isPostPreview = activeAction === 'CREATE_POST' && formStep === 3;
    const isProfilePreview = activeAction === 'EDIT_PROFILE' && formStep === 3;
    
    const isPitchUploader = activeAction === 'UPLOAD_PITCH' && formStep === 1;
    const isPitchPreview = activeAction === 'UPLOAD_PITCH' && formStep === 2;
    
    const isVideoUploader = activeAction === 'UPLOAD_VIDEO' && formStep === 2;
    const isVideoPreview = activeAction === 'UPLOAD_VIDEO' && formStep === 3;

    // AI ecosystem previews
    const isPlanPreview = activeAction === 'CREATE_STARTUP_PLAN' && formStep === 6;
    const isPitchGenPreview = activeAction === 'GENERATE_PITCH' && formStep === 5;
    const isMatchPreview = activeAction === 'MATCH_INVESTORS' && formStep === 5;
    const isPostGenPreview = activeAction === 'GENERATE_POST' && formStep === 1;
    const isOutreachPreview = activeAction === 'GENERATE_OUTREACH' && formStep === 3;
    const isScorePreview = activeAction === 'STARTUP_SCORE' && formStep === 5;

    if (isStartupPreview || isPostPreview || isProfilePreview || isPitchPreview || isVideoPreview) {
      pushAIMessage(`💡 **FounderX Assistant Guidance**\n\nI have already structured your preview card. Please click **Publish to FounderX** to commit live, **Edit Details** to start over, or **Cancel** to abort this operation.`, ['Cancel'], currentHistory);
      return;
    }

    if (isPlanPreview || isPitchGenPreview || isMatchPreview || isPostGenPreview || isOutreachPreview || isScorePreview) {
      pushAIMessage(`💡 **FounderX AI OS Guidance**\n\nYour details have been generated! Please use the interactive card buttons to **View Full Details**, **Copy**, **Download**, or **Edit** details below.`, ['Cancel'], currentHistory);
      return;
    }

    if (isPitchUploader) {
      pushAIMessage(`💡 **FounderX Assistant Guidance**\n\nI am waiting for your PDF Pitch Deck. Please drag-and-drop your file inside the uploader card above, or click the uploader card to select a mock file. You can also click **Cancel** to abort.`, ['Cancel'], currentHistory);
      return;
    }

    if (isVideoUploader) {
      pushAIMessage(`💡 **FounderX Assistant Guidance**\n\nI am waiting for your Watch Pitch Video. Please drag-and-drop your .mp4 file inside the uploader card above, or click the uploader card to select a mock file. You can also click **Cancel** to abort.`, ['Cancel'], currentHistory);
      return;
    }

    // A. Priority 1: CREATE STARTUP
    if (activeAction === 'CREATE_STARTUP') {
      const data = { ...startupData };
      switch (formStep) {
        case 0:
          data.name = inputText;
          nextStep = 1;
          setStartupData(data);
          setFormStep(nextStep);
          pushAIMessage(`Great Name! **${inputText}** is saved.\n\nWhat is your **one-line pitch**? (Under 200 characters).`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.oneLinePitch = inputText;
          nextStep = 2;
          setStartupData(data);
          setFormStep(nextStep);
          pushAIMessage(`Pitch saved!\n\nDescribe the **problem and solution** in 2-3 casual sentences. I'll optimize it to sound highly professional for VCs!`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.description = inputText;
          nextStep = 3;
          setStartupData(data);
          setFormStep(nextStep);
          pushAIMessage(`Description captured. Running optimizer...\n\nWhat **industry category** does your startup fit best? Click one:`, ['SaaS', 'AI/ML', 'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Cancel'], currentHistory);
          break;
        case 3:
          const normalizedInd = normalizeIndustry(inputText);
          data.industry = normalizedInd;
          nextStep = 4;
          setStartupData(data);
          setFormStep(nextStep);
          pushAIMessage(`Industry mapped: **${normalizedInd}**.\n\nWhat **development stage** are you in? Select one:`, ['Idea Stage', 'MVP built', 'First Customer acquired', 'Generating Revenue', 'Cancel'], currentHistory);
          break;
        case 4:
          let mappedStage = 'idea';
          if (inputText.toLowerCase().includes('mvp')) mappedStage = 'mvp';
          else if (inputText.toLowerCase().includes('customer')) mappedStage = 'first_customer';
          else if (inputText.toLowerCase().includes('revenue')) mappedStage = 'revenue';
          data.stage = mappedStage;
          nextStep = 5;
          setStartupData(data);
          setFormStep(nextStep);
          pushAIMessage(`Stage mapped: **${mappedStage}**.\n\nFinally, what is the **primary contact email** for your startup?`, ['Cancel'], currentHistory);
          break;
        case 5:
          if (!inputText.includes('@')) {
            pushAIMessage(`⚠️ Invalid email format. Please provide a valid contact email:`, ['Cancel'], currentHistory);
            return;
          }
          data.contactEmail = inputText;
          setStartupData(data);
          setFormStep(6);
          setPublishingState('idle');
          
          const optDesc = optimizeStartupDescription(data.name, data.description, data.industry);
          const sugTags = generateStartupHashtags(data.name, data.industry).split(' ');
          
          pushPreviewMsg('STARTUP_PREVIEW', { ...data, optimizedDescription: optDesc, tags: sugTags }, currentHistory);
          break;
      }
    }

    // AI Startup Plan Builder
    else if (activeAction === 'CREATE_STARTUP_PLAN') {
      const data = { ...startupPlanData };
      switch (formStep) {
        case 0:
          data.name = inputText;
          setStartupPlanData(data);
          setFormStep(1);
          pushAIMessage(`🚀 **Startup Plan Builder**\nStep 2 of 6\n\nWhat is your startup **description**? (What problem do you solve and how?)`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.description = inputText;
          setStartupPlanData(data);
          setFormStep(2);
          pushAIMessage(`🚀 **Startup Plan Builder**\nStep 3 of 6\n\nWho is your **target market**? (Who are your ideal customers?)`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.targetMarket = inputText;
          setStartupPlanData(data);
          setFormStep(3);
          pushAIMessage(`🚀 **Startup Plan Builder**\nStep 4 of 6\n\nWhat is your **Unique Value Proposition (UVP)**? (What makes you 10x better than competitors?)`, ['Cancel'], currentHistory);
          break;
        case 3:
          data.uvp = inputText;
          setStartupPlanData(data);
          setFormStep(4);
          pushAIMessage(`🚀 **Startup Plan Builder**\nStep 5 of 6\n\nWhat is your **revenue model**? (e.g. subscription SaaS, marketplace commission)`, ['Cancel'], currentHistory);
          break;
        case 4:
          data.revenueModel = inputText;
          setStartupPlanData(data);
          setFormStep(5);
          pushAIMessage(`🚀 **Startup Plan Builder**\nStep 6 of 6\n\nAll details collected! Click the button below to generate your final Startup Plan using live AI.`, ['Generate Final Plan', 'Cancel'], currentHistory);
          break;
        case 5:
          if (inputText.toLowerCase().includes('generate') || inputText.toLowerCase().includes('plan')) {
            setFormStep(6);
            generateFinalPlan(data, currentHistory);
          } else {
            pushAIMessage(`💡 **FounderX Assistant Guidance**\n\nI have collected all details. Please click **Generate Final Plan** to build it using AI, or click **Cancel** to abort.`, ['Generate Final Plan', 'Cancel'], currentHistory);
          }
          break;
      }
    }

    // AI Pitch Generator
    else if (activeAction === 'GENERATE_PITCH') {
      const data = { ...pitchGeneratorData };
      switch (formStep) {
        case 0:
          data.name = inputText;
          setPitchGeneratorData(data);
          setFormStep(1);
          pushAIMessage(`🚀 **AI Pitch Generator**\nStep 2 of 5\n\nWhat is your startup **description**? (Problem/Solution summary)`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.description = inputText;
          setPitchGeneratorData(data);
          setFormStep(2);
          pushAIMessage(`🚀 **AI Pitch Generator**\nStep 3 of 5\n\nWho is your **target market**?`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.targetMarket = inputText;
          setPitchGeneratorData(data);
          setFormStep(3);
          pushAIMessage(`🚀 **AI Pitch Generator**\nStep 4 of 5\n\nWhat is your startup's **Unique Value Proposition (UVP)**?`, ['Cancel'], currentHistory);
          break;
        case 3:
          data.uvp = inputText;
          setPitchGeneratorData(data);
          setFormStep(4);
          pushAIMessage(`🚀 **AI Pitch Generator**\nStep 5 of 5\n\nWhat is your **revenue model**?`, ['Cancel'], currentHistory);
          break;
        case 4:
          data.revenueModel = inputText;
          setPitchGeneratorData(data);
          setFormStep(5);
          generatePitchSuite({ ...data, revenueModel: inputText }, currentHistory);
          break;
      }
    }

    // AI Investor Match Assistant
    else if (activeAction === 'MATCH_INVESTORS') {
      const data = { ...investorMatchData };
      switch (formStep) {
        case 0:
          data.name = inputText;
          setInvestorMatchData(data);
          setFormStep(1);
          pushAIMessage(`🚀 **AI Investor Match Assistant**\nStep 2 of 5\n\nWhat is your startup's current **development stage**?`, ['Idea Stage', 'MVP built', 'First Customer acquired', 'Generating Revenue', 'Cancel'], currentHistory);
          break;
        case 1:
          data.stage = inputText;
          setInvestorMatchData(data);
          setFormStep(2);
          pushAIMessage(`🚀 **AI Investor Match Assistant**\nStep 3 of 5\n\nWho is your startup's **target market**?`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.targetMarket = inputText;
          setInvestorMatchData(data);
          setFormStep(3);
          pushAIMessage(`🚀 **AI Investor Match Assistant**\nStep 4 of 5\n\nHow much **funding** do you need to raise? (e.g. $150K, $1M)`, ['Cancel'], currentHistory);
          break;
        case 3:
          data.fundingNeed = inputText;
          setInvestorMatchData(data);
          setFormStep(4);
          pushAIMessage(`🚀 **AI Investor Match Assistant**\nStep 5 of 5\n\nReady to match with active startup investors? Click below!`, ['Match Me with Investors', 'Cancel'], currentHistory);
          break;
        case 4:
          setFormStep(5);
          matchInvestors(data, currentHistory);
          break;
      }
    }

    // AI Founder Post Generator
    else if (activeAction === 'GENERATE_POST') {
      const data = { ...postData };
      data.content = inputText;
      setPostData(data);
      setFormStep(1);
      generateSocialPost(inputText, currentHistory);
    }

    // AI Investor Outreach Message
    else if (activeAction === 'GENERATE_OUTREACH') {
      const data = { ...outreachData };
      switch (formStep) {
        case 0:
          data.investorName = inputText;
          setOutreachData(data);
          setFormStep(1);
          pushAIMessage(`🚀 **AI Investor Outreach Message**\nStep 2 of 3\n\nWhat is your **startup name**?`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.startupName = inputText;
          setOutreachData(data);
          setFormStep(2);
          pushAIMessage(`🚀 **AI Investor Outreach Message**\nStep 3 of 3\n\nWhat is your startup's **Unique Value Proposition (UVP)**?`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.uvp = inputText;
          setOutreachData(data);
          setFormStep(3);
          generateInvestorOutreach({ ...data, uvp: inputText }, currentHistory);
          break;
      }
    }

    // AI Startup Score
    else if (activeAction === 'STARTUP_SCORE') {
      const data = { ...startupScoreData };
      switch (formStep) {
        case 0:
          data.name = inputText;
          setStartupScoreData(data);
          setFormStep(1);
          pushAIMessage(`🚀 **AI Startup Score**\nStep 2 of 5\n\nWhat is your startup **description**? (Problem/Solution)`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.description = inputText;
          setStartupScoreData(data);
          setFormStep(2);
          pushAIMessage(`🚀 **AI Startup Score**\nStep 3 of 5\n\nWho is your **target market**?`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.targetMarket = inputText;
          setStartupScoreData(data);
          setFormStep(3);
          pushAIMessage(`🚀 **AI Startup Score**\nStep 4 of 5\n\nWhat is your startup's **Unique Value Proposition (UVP)**?`, ['Cancel'], currentHistory);
          break;
        case 3:
          data.uvp = inputText;
          setStartupScoreData(data);
          setFormStep(4);
          pushAIMessage(`🚀 **AI Startup Score**\nStep 5 of 5\n\nWhat is your startup's **revenue model**?`, ['Cancel'], currentHistory);
          break;
        case 4:
          data.revenueModel = inputText;
          setStartupScoreData(data);
          setFormStep(5);
          calculateStartupScore({ ...data, revenueModel: inputText }, currentHistory);
          break;
      }
    }

    // B. Priority 2: CREATE POST
    else if (activeAction === 'CREATE_POST') {
      const data = { ...postData };
      switch (formStep) {
        case 0:
          data.title = inputText;
          nextStep = 1;
          setPostData(data);
          setFormStep(nextStep);
          pushAIMessage(`Title saved!\n\nWhat would you like to **share in your post content**? Write details about your product update or milestones:`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.content = inputText;
          nextStep = 2;
          setPostData(data);
          setFormStep(nextStep);
          pushAIMessage(`Excellent content. Running formatting loops...\n\nWhat **tags or hashtags** would you like to associate? Click or type custom tags:`, ['#StartupLife', '#BuildingInPublic', '#SaaS', '#AI', '#Traction', 'Cancel'], currentHistory);
          break;
        case 2:
          data.tags = inputText.startsWith('#') ? inputText : '#' + inputText.replace(/\s+/g, ' #');
          setPostData(data);
          setFormStep(3);
          setPublishingState('idle');
          pushPreviewMsg('POST_PREVIEW', { ...data, cleanTags: formatTrendingPostTags(data.title, data.content) + ' ' + data.tags }, currentHistory);
          break;
      }
    }

    // C. Priority 2: EDIT PROFILE
    else if (activeAction === 'EDIT_PROFILE') {
      const data = { ...profileData };
      switch (formStep) {
        case 0:
          data.role = inputText;
          nextStep = 1;
          setProfileData(data);
          setFormStep(nextStep);
          pushAIMessage(`Job Role saved!\n\nProvide a **comma-separated list of your key professional skills** (e.g. React, Growth Marketing, Product Design):`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.skills = inputText;
          nextStep = 2;
          setProfileData(data);
          setFormStep(nextStep);
          pushAIMessage(`Skills recorded!\n\nProvide a brief **founder bio** explaining your startup journey. I will automatically optimize it into a premium executive summary!`, ['Cancel'], currentHistory);
          break;
        case 2:
          data.bio = inputText;
          setProfileData(data);
          setFormStep(3);
          setPublishingState('idle');
          const optBio = optimizeFounderBio(data.role, data.bio);
          pushPreviewMsg('PROFILE_PREVIEW', { ...data, optimizedBio: optBio }, currentHistory);
          break;
      }
    }

    // D. Priority 2: UPLOAD PITCH
    else if (activeAction === 'UPLOAD_PITCH') {
      const data = { ...pitchData };
      switch (formStep) {
        case 0:
          data.title = inputText;
          nextStep = 1;
          setPitchData(data);
          setFormStep(nextStep);
          pushAIMessage(`Pitch Deck Title saved!\n\nPlease **drag-and-drop or select your PDF Pitch Deck file** directly inside the uploader card above.`, ['Cancel'], currentHistory);
          break;
      }
    }

    // E. Priority 2: UPLOAD VIDEO
    else if (activeAction === 'UPLOAD_VIDEO') {
      const data = { ...videoData };
      switch (formStep) {
        case 0:
          data.title = inputText;
          nextStep = 1;
          setVideoData(data);
          setFormStep(nextStep);
          pushAIMessage(`Video Title saved!\n\nProvide a **brief 1-sentence description** of what this video showcases:`, ['Cancel'], currentHistory);
          break;
        case 1:
          data.description = inputText;
          nextStep = 2;
          setVideoData(data);
          setFormStep(nextStep);
          pushAIMessage(`Description saved!\n\nPlease **drag-and-drop or select your startup watch video** (.mp4 up to 50MB) directly inside the uploader card above.`, ['Cancel'], currentHistory);
          break;
      }
    }
  };

  const pushAIMessage = (text, actions, history) => {
    const formattedActions = actions.map(act => {
      if (typeof act === 'string') {
        return { label: act, type: 'prompt', prompt: act };
      }
      return act;
    });

    const msg = {
      id: Date.now().toString(),
      sender: 'ai',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: formattedActions
    };
    const updated = [...history, msg];
    setMessages(updated);
    saveHistory(updated);
  };

  const pushPreviewMsg = (type, data, history) => {
    const msg = {
      id: Date.now().toString(),
      sender: 'ai',
      text: `🎉 **Data Collected & AI Optimized!**\n\nI have structured a premium preview card. Review details and authorize publishing below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: type,
      previewData: data
    };
    const updated = [...history, msg];
    setMessages(updated);
    saveHistory(updated);
  };

  // MOCK FILE DRAG AND DROP SIMULATORS
  // ================= GENERAL API PUBLISHING ENGINE (Milestone 2 APIs) =================
  const handlePublishAction = async (previewData, actionType) => {
    // 1. SECURITY RULES: Check if user is logged in
    const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!jwtToken || !user) {
      setPublishingState('auth_required');
      setPublishingMessage("Authentication Required: Please login to your FounderX account to complete this action.");
      return;
    }

    setPublishingState('loading');
    setPublishingMessage("Connecting to database and validating authentication payloads...");

    let endpoint = "";
    let method = "POST";
    let bodyPayload = {};
    let redirectRoute = "/profile";
    let successLog = "";
    let draftStorageKey = "";

    switch (actionType) {
      case 'CREATE_STARTUP':
        endpoint = `${API_URL}/api/startups`;
        draftStorageKey = "founderx_startup_drafts";
        redirectRoute = "/profile";
        bodyPayload = {
          name: previewData.name,
          oneLinePitch: previewData.oneLinePitch,
          description: previewData.optimizedDescription,
          industry: previewData.industry,
          stage: previewData.stage,
          contactEmail: previewData.contactEmail,
          tags: previewData.tags
        };
        successLog = `🚀 Startup Profile "${previewData.name}" created successfully on the platform!`;
        break;

      case 'CREATE_POST':
        endpoint = `${API_URL}/api/posts`;
        draftStorageKey = "founderx_post_drafts";
        redirectRoute = "/";
        bodyPayload = {
          title: previewData.title,
          content: `${previewData.content}\n\n${previewData.cleanTags || ''}`,
          tags: (previewData.tags || '').split(' ').map(t => t.replace('#', '').trim()).filter(Boolean),
          mediaUrl: previewData.mediaUrl || ''
        };
        successLog = `📢 Startup update post "${previewData.title}" published successfully to feed!`;
        break;

      case 'EDIT_PROFILE':
        endpoint = `${API_URL}/api/users/update`;
        method = "PUT";
        draftStorageKey = "founderx_profile_drafts";
        redirectRoute = "/profile";
        bodyPayload = {
          role: previewData.role,
          bio: previewData.optimizedBio,
          skills: previewData.skills
        };
        successLog = `👤 Founder profile bio optimized and saved successfully!`;
        break;

      case 'UPLOAD_PITCH':
        // Cloudinary upload mock handshake
        endpoint = `${API_URL}/api/startups/pitch`; // Mock target
        draftStorageKey = "founderx_pitch_drafts";
        redirectRoute = "/profile";
        bodyPayload = {
          title: previewData.title,
          fileName: previewData.fileName,
          fileSize: previewData.fileSize
        };
        successLog = `📂 Pitch Presentation "${previewData.title}" uploaded successfully!`;
        break;

      case 'UPLOAD_VIDEO':
        endpoint = `${API_URL}/api/videos`;
        draftStorageKey = "founderx_video_drafts";
        redirectRoute = "/watch";
        bodyPayload = {
          title: previewData.title,
          description: previewData.description,
          videoUrl: 'https://cloudinary.com/founderx-video-mock.mp4'
        };
        successLog = `🎥 Vertical Pitch Video "${previewData.title}" published successfully to Watch feed!`;
        break;
    }

    try {
      // Direct REST fetch using JWT headers
      const res = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (res.ok) {
        setPublishingState('success');
        setPublishingMessage("Operational action complete! Synchronized live in database.");
        
        // Log success
        const systemMsg = {
          id: Date.now().toString(),
          sender: 'system',
          text: successLog,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [...messages, systemMsg];
        setMessages(updated);
        saveHistory(updated);

        // Success redirect after 2.2s
        setTimeout(() => {
          setIsOpen(false);
          setActiveAction(null);
          setFormStep(0);
          setPublishingState('idle');
          setPublishingPostId(null);
          if (redirectRoute === '/') {
            window.location.href = '/'; // Full refresh to show post on feed immediately!
          } else {
            router.push(redirectRoute);
          }
        }, 2200);

      } else {
        throw new Error(data.message || 'Platform server rejected the parameter inputs.');
      }
    } catch (err) {
      console.error(`Platform action execution failed for ${actionType}:`, err);
      
      // SECURITY RULE: Save failed actions as drafts, not fake success.
      const currentDrafts = JSON.parse(localStorage.getItem(draftStorageKey) || '[]');
      const newDraft = {
        id: Date.now().toString(),
        data: previewData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftStorageKey, JSON.stringify([...currentDrafts, newDraft]));

      setPublishingState('draft_saved');
      setPublishingMessage(`Saved as draft because server is unavailable. We have stored your data safely inside your browser drafts!`);
    }
  };

  const setInput = setInputValue;

  const handleActionClick = (action) => {
    if (!action) return;

    if (typeof action === "string") {
      setInputValue('');
      handleSendMessage(action);
      return;
    }

    if (action.type === "navigate" && action.href) {
      router.push(action.href);
      return;
    }

    if (action.type === "prompt" && action.prompt) {
      setInputValue('');
      handleSendMessage(action.prompt);
      return;
    }

    if (action.type === "callback" && typeof action.callback === "function") {
      action.callback();
      return;
    }

    console.warn("Unknown assistant action:", action);
  };

  return (
    <div className={`font-sans ${theme} ${isFullScreen ? 'fixed inset-0 z-[85] pointer-events-none' : 'fixed bottom-6 right-6 z-50'}`}>
      {/* Decoupled chatbot panel wrapper */}
      <AnimatePresence>
        {isOpen && (
          <>
            {isFullScreen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFullScreen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[85] pointer-events-auto cursor-pointer"
              />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => { 
                e.preventDefault(); 
                setIsDraggingFile(false); 
                const file = e.dataTransfer.files[0]; 
                if (file) handleFileUpload(file); 
              }}
              className={`
                pointer-events-auto
                ${isFullScreen 
                  ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[24px] z-[90] max-sm:inset-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:h-full max-sm:rounded-none shadow-2xl'
                  : 'fixed bottom-[96px] right-[24px] h-[580px] rounded-[24px] max-sm:bottom-[84px] max-sm:right-4 max-sm:left-4 max-sm:w-[calc(100vw-32px)] max-sm:h-[calc(100vh-110px)] max-sm:max-h-[560px]'
                }
                shadow-[0_24px_60px_rgba(10,102,194,0.22)] overflow-hidden flex flex-row border relative transition-all duration-305
                ${theme === 'light' 
                  ? 'bg-white/85 border-white/20 text-slate-900 backdrop-blur-xl' 
                  : 'bg-slate-950/85 border-slate-800/40 text-slate-100 backdrop-blur-xl'
                }
              `}
              style={{ 
                width: isFullScreen 
                  ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 'min(90vw, 1100px)') 
                  : (showHistory && typeof window !== 'undefined' && window.innerWidth >= 640 ? '640px' : '400px'),
                height: isFullScreen
                  ? (typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : 'min(85vh, 800px)')
                  : undefined
              }}
            >
            {/* Drag and Drop Visual Overlay */}
            {isDraggingFile && (
              <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-md z-[60] flex flex-col items-center justify-center border-2 border-dashed border-blue-500 rounded-[24px] pointer-events-none">
                <div className="p-4 rounded-full bg-blue-500 text-white shadow-lg animate-bounce">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="mt-3 font-bold text-sm text-blue-600 dark:text-blue-450">Drop your startup media here...</p>
                <p className="text-xs text-slate-450 mt-1">Images or videos up to 50MB</p>
              </div>
            )}

            {/* HISTORY SIDEBAR DRAWER */}
            {showHistory && (
              <div className={`w-[240px] h-full flex flex-col border-r shrink-0 overflow-hidden transition-all duration-300
                ${theme === 'light' ? 'border-slate-150 bg-slate-50/40' : 'border-slate-850 bg-slate-950/40'}
                max-sm:absolute max-sm:left-0 max-sm:top-0 max-sm:z-50 max-sm:h-full max-sm:w-[200px] max-sm:shadow-2xl
              `}>
                {/* Sidebar Header */}
                <div className={`p-3 flex items-center justify-between border-b
                  ${theme === 'light' ? 'border-slate-150' : 'border-slate-850'}
                `}>
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 select-none">
                    <History className="w-3.5 h-3.5" />
                    Chats
                  </span>
                  <button
                    onClick={startNewChat}
                    title="Start New Chat"
                    className="p-1 rounded-md text-blue-500 hover:bg-blue-500/10 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                  {sessions.filter(s => s.messages && s.messages.some(m => m.sender === 'user')).length === 0 ? (
                    <div className="text-center py-6 px-3">
                      <p className="text-xs text-slate-400 font-medium">No conversations</p>
                      <p className="text-[10px] text-slate-450 mt-1">Start chatting to save history.</p>
                    </div>
                  ) : (
                    sessions
                      .filter(s => s.messages && s.messages.some(m => m.sender === 'user'))
                      .map(s => {
                        const isActive = s.id === activeSessionId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => selectSession(s.id)}
                            className={`group relative p-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2 border
                              ${isActive
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-900 border-transparent text-slate-655 dark:text-slate-400'
                              }
                            `}
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0 text-slate-450 group-hover:text-blue-500 transition-colors" />
                            <div className="text-xs truncate flex-1 pr-6 leading-normal select-none">
                              {s.title}
                            </div>
                            <button
                              onClick={(e) => deleteSession(s.id, e)}
                              title="Delete chat"
                              className="absolute right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* MAIN CHAT AREA INNER CONTAINER */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* COMPONENT HEADER */}
              <div className={`px-4 py-3.5 flex items-center justify-between border-b 
                ${theme === 'light' ? 'border-slate-100 bg-gradient-to-r from-blue-500/5 to-sky-500/5' : 'border-slate-850 bg-gradient-to-r from-blue-950/10 to-sky-950/10'}
              `}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-md border-2 border-white/10"
                    >
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </motion.div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse"></span>
                  </div>
                  
                  <div>
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      FounderX AI 
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 dark:text-blue-400">Operator</span>
                    </div>
                    <span className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Ready to complete actions</span>
                  </div>
                </div>

                {/* Control triggers */}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-lg border focus:outline-none transition cursor-pointer mr-1
                      ${theme === 'light'
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850'
                      }`}
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="hi-IN">Hindi (हिंदी)</option>
                    <option value="te-IN">Telugu (తెలుగు)</option>
                    <option value="ta-IN">Tamil (தமிழ்)</option>
                    <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                    <option value="mr-IN">Marathi (मराठी)</option>
                    <option value="bn-IN">Bengali (বাংলা)</option>
                  </select>
                  <button 
                    onClick={() => setShowHistory(!showHistory)} 
                    title="Toggle Chat History"
                    className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 
                      ${showHistory 
                        ? 'bg-blue-500/15 text-blue-500 font-semibold' 
                        : theme === 'light' ? 'hover:bg-slate-100 hover:text-slate-700' : 'hover:bg-slate-900 hover:text-white'
                      }`}
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsFullScreen(!isFullScreen)} 
                    title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 
                      ${isFullScreen
                        ? 'bg-blue-500/15 text-blue-500'
                        : theme === 'light' ? 'hover:bg-slate-100 hover:text-slate-700' : 'hover:bg-slate-900 hover:text-white'
                      }`}
                  >
                    {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={toggleTheme} 
                    title="Toggle Light/Dark Theme"
                    className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 ${theme === 'light' ? 'hover:bg-slate-100 hover:text-slate-700' : 'hover:bg-slate-900 hover:text-white'}`}
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={clearChat} 
                    title="Reset Logs"
                    className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 ${theme === 'light' ? 'hover:bg-slate-100 hover:text-slate-700' : 'hover:bg-slate-900 hover:text-white'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={toggleOpen} 
                  title="Close card"
                  className={`p-1.5 rounded-full transition-all duration-200 hover:scale-105 ${theme === 'light' ? 'hover:bg-slate-100 hover:text-slate-700' : 'hover:bg-slate-900 hover:text-white'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MESSAGE SCROLLBOX */}
            <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin 
              ${theme === 'light' ? 'bg-slate-50/30' : 'bg-slate-950/20'}
            `}>
              {messages.map((msg, index) => {
                if (msg.sender === 'system') {
                  return (
                    <div key={msg.id || index} className="flex justify-center my-2">
                      <span className={`text-[10px] font-semibold px-3 py-1 rounded-full border 
                        ${theme === 'light' 
                          ? 'bg-blue-50/60 border-blue-100 text-blue-600' 
                          : 'bg-blue-950/30 border-blue-900/40 text-blue-400'
                        }
                      `}>
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                // ================= SPECIALIZED ACTION PREVIEW PANEL INJECTS =================
                if (msg.type && msg.type.endsWith('_PREVIEW')) {
                  const preview = msg.previewData;
                  const isStartup = msg.type === 'STARTUP_PREVIEW';
                  const isPost = msg.type === 'POST_PREVIEW';
                  const isProfile = msg.type === 'PROFILE_PREVIEW';
                  const isPitch = msg.type === 'PITCH_PREVIEW';
                  const isVideo = msg.type === 'VIDEO_PREVIEW';

                  const isPlan = msg.type === 'PLAN_PREVIEW';
                  const isPitchGen = msg.type === 'PITCH_PREVIEW';
                  const isMatch = msg.type === 'MATCH_PREVIEW';
                  const isPostGen = msg.type === 'POST_PREVIEW';
                  const isOutreach = msg.type === 'OUTREACH_PREVIEW';
                  const isScore = msg.type === 'SCORE_PREVIEW';

                  if (isPlan || isPitchGen || isMatch || isPostGen || isOutreach || isScore) {
                    const planText = preview.planText || preview.pitchText || preview.matchText || preview.outreachText || preview.scoreText || '';
                    const titleText = isPlan ? `🚀 Startup Plan: ${preview.startupName}`
                                    : isPitchGen ? `📢 AI Pitch Suite: ${preview.startupName}`
                                    : isMatch ? `🤝 Investor Matches: ${preview.startupName}`
                                    : isPostGen ? `✍️ AI Social Post`
                                    : isOutreach ? `✉️ Investor Outreach: ${preview.investorName}`
                                    : `📊 Startup Scorecard: ${preview.startupName}`;

                    const previewLines = planText.split('\n').slice(0, 4).join('\n');

                    const handleCopy = () => {
                      navigator.clipboard.writeText(planText || preview.content || '');
                      alert(`${titleText} copied to clipboard!`);
                    };

                    const handleDownload = () => {
                      const element = document.createElement("a");
                      const file = new Blob([planText || preview.content || ''], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = `${(preview.startupName || preview.investorName || 'AI_Document').replace(/\s+/g, '_')}_details.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    };

                    const handleEdit = () => {
                      if (isPlan) {
                        setStartupPlanData(preview.inputs);
                        setActiveAction('CREATE_STARTUP_PLAN');
                      } else if (isPitchGen) {
                        setPitchGeneratorData(preview.inputs);
                        setActiveAction('GENERATE_PITCH');
                      } else if (isMatch) {
                        setInvestorMatchData(preview.inputs);
                        setActiveAction('MATCH_INVESTORS');
                      } else if (isPostGen) {
                        setActiveAction('GENERATE_POST');
                      } else if (isOutreach) {
                        setOutreachData(preview.inputs);
                        setActiveAction('GENERATE_OUTREACH');
                      } else if (isScore) {
                        setStartupScoreData(preview.inputs);
                        setActiveAction('STARTUP_SCORE');
                      }
                      setFormStep(0);
                    };

                    return (
                      <div key={msg.id || index} className="w-full my-4">
                        <div className={`p-4 rounded-2xl border shadow-md space-y-3 text-left
                          ${theme === 'light' ? 'bg-white border-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
                        `}>
                          <div className="flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                            {isPlan && <Rocket className="w-5 h-5 text-blue-500" />}
                            {isPitchGen && <FileText className="w-5 h-5 text-emerald-500" />}
                            {isMatch && <Users className="w-5 h-5 text-indigo-500" />}
                            {isPostGen && <PenTool className="w-5 h-5 text-sky-500" />}
                            {isOutreach && <Mail className="w-5 h-5 text-rose-500" />}
                            {isScore && <TrendingUp className="w-5 h-5 text-amber-500" />}
                            
                            <h4 className="font-bold text-xs uppercase tracking-wider">
                              {titleText}
                            </h4>
                          </div>

                          {/* Dynamic Card Attributes */}
                          <div className="text-xs space-y-2 relative">
                            {isScore ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150/40 dark:border-slate-850">
                                  <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-bold text-lg shadow-md border-2 border-white/20">
                                    {preview.score}
                                  </div>
                                  <div>
                                    <h5 className="font-bold text-[13px]">Overall VC Index Score</h5>
                                    <p className="text-[10px] text-slate-400 font-medium">Highly attractive seed viability</p>
                                  </div>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                  {Object.entries({
                                    'Problem Clarity': preview.breakdown?.problem || 18,
                                    'Market Size': preview.breakdown?.market || 16,
                                    'Revenue Model': preview.breakdown?.revenue || 17,
                                    'Scalability': preview.breakdown?.scale || 17,
                                    'Founder Readiness': preview.breakdown?.readiness || 16
                                  }).map(([label, val]) => (
                                    <div key={label} className="space-y-1">
                                      <div className="flex justify-between items-center text-[10px] font-semibold">
                                        <span className="text-slate-500 dark:text-slate-400">{label}</span>
                                        <span className="text-slate-700 dark:text-slate-200">{val}/20</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                                        <div 
                                          style={{ width: `${(val / 20) * 100}%` }} 
                                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : isPostGen ? (
                              <div className="whitespace-pre-wrap leading-relaxed font-sans bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                                {preview.content}
                              </div>
                            ) : (
                              <div className="relative">
                                <p className="whitespace-pre-wrap leading-relaxed opacity-85 font-mono bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 h-[80px] overflow-hidden">
                                  {previewLines}
                                </p>
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent pointer-events-none" />
                              </div>
                            )}
                          </div>

                          {/* Plan Actions Buttons */}
                          <div className="flex flex-col gap-2 pt-1.5">
                            {isPostGen ? (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handlePublishAction(preview, 'CREATE_POST')}
                                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-1.5"
                                >
                                  Publish to FounderX Feed
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={handleCopy}
                                    className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                                  >
                                    Copy Content
                                  </button>
                                  <button
                                    onClick={handleEdit}
                                    className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                                  >
                                    Edit Details
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setActiveDocViewer({ title: titleText, text: planText })}
                                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                                  >
                                    View Full Details
                                  </button>
                                  <button
                                    onClick={handleCopy}
                                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                                  >
                                    Copy
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={handleDownload}
                                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={handleEdit}
                                    className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id || index} className="w-full my-4">
                      {publishingState === 'idle' && (
                        <div className={`p-4 rounded-2xl border shadow-md space-y-3 text-left
                          ${theme === 'light' ? 'bg-white border-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
                        `}>
                          <div className="flex items-center gap-2 border-b pb-2 border-slate-100 dark:border-slate-800">
                            {isStartup && <Rocket className="w-5 h-5 text-blue-500" />}
                            {isPost && <PenTool className="w-5 h-5 text-sky-500" />}
                            {isProfile && <Users className="w-5 h-5 text-indigo-500" />}
                            {isPitch && <FileText className="w-5 h-5 text-emerald-500" />}
                            {isVideo && <Video className="w-5 h-5 text-rose-500" />}
                            
                            <h4 className="font-bold text-xs uppercase tracking-wider">
                              {isStartup && 'Startup Profile Preview'}
                              {isPost && 'Update Feed Post Preview'}
                              {isProfile && 'Founder Bio Preview'}
                              {isPitch && 'Pitch Presentation Preview'}
                              {isVideo && 'Vertical Pitch Video Preview'}
                            </h4>
                          </div>

                          {/* Dynamic Card Attributes */}
                          <div className="space-y-2 text-xs">
                            {isStartup && (
                              <>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Startup Name</span>
                                  <p className="font-bold text-[14px]">{preview.name}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Pitch</span>
                                  <p className="font-semibold text-blue-600 dark:text-blue-400">{preview.oneLinePitch}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">AI Optimized Description</span>
                                  <p className="opacity-95 leading-relaxed italic">{preview.optimizedDescription}</p>
                                </div>
                                <div className="flex gap-4 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                                  <div>
                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Category</span>
                                    <p className="font-bold">{preview.industry}</p>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Stage</span>
                                    <p className="font-bold uppercase text-blue-500">{preview.stage}</p>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-400 font-semibold">{preview.contactEmail}</div>
                              </>
                            )}

                            {isPost && (
                              <>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Post Title</span>
                                  <p className="font-bold text-[13px]">{preview.title}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Feed Content</span>
                                  <p className="opacity-95 leading-relaxed whitespace-pre-line">{preview.content}</p>
                                </div>
                                <div className="text-[10px] font-bold text-sky-500">{preview.cleanTags}</div>
                              </>
                            )}

                            {isProfile && (
                              <>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Founder Role</span>
                                  <p className="font-bold text-[13px]">{preview.role}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Skills</span>
                                  <p className="font-semibold text-blue-500">{preview.skills}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">AI-Optimized Founder Bio</span>
                                  <p className="opacity-95 leading-relaxed italic">{preview.optimizedBio}</p>
                                </div>
                              </>
                            )}

                            {isPitch && (
                              <>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Pitch Deck Title</span>
                                  <p className="font-bold text-[13px]">{preview.title}</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                  <FileText className="w-8 h-8 text-emerald-500" />
                                  <div>
                                    <p className="font-bold text-[11px] truncate max-w-[200px]">{preview.fileName}</p>
                                    <p className="text-[10px] text-slate-400">{preview.fileSize} • ready to bind</p>
                                  </div>
                                </div>
                              </>
                            )}

                            {isVideo && (
                              <>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Video Title</span>
                                  <p className="font-bold text-[13px]">{preview.title}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Watch Description</span>
                                  <p className="opacity-95">{preview.description}</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                  <Video className="w-8 h-8 text-rose-500" />
                                  <div>
                                    <p className="font-bold text-[11px] truncate max-w-[200px]">{preview.fileName}</p>
                                    <p className="text-[10px] text-slate-400">{preview.fileSize} • ready to sync</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* INTERACTIVE CONFIRMATION BUTTONS */}
                          <div className="flex flex-col gap-2 pt-2.5">
                            <button
                              onClick={() => handlePublishAction(preview, activeAction)}
                              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-1.5"
                            >
                              Publish to FounderX
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setFormStep(0)}
                                className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                              >
                                Edit Details
                              </button>
                              <button
                                onClick={cancelActiveAction}
                                className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-450 font-bold text-xs rounded-xl border border-slate-200/50 dark:border-slate-750 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ACTIVE PROGRESS SKELETON */}
                      {publishingState === 'loading' && (
                        <div className={`p-6 rounded-2xl border text-center space-y-4
                          ${theme === 'light' ? 'bg-white border-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
                        `}>
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Synchronizing live details...</p>
                            <p className="text-xs text-slate-400 font-medium">{publishingMessage}</p>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '92%' }}
                              transition={{ duration: 2.2 }}
                              className="h-full bg-gradient-to-r from-blue-600 to-sky-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* SUCCESS SCREEN CHECKMARKS */}
                      {publishingState === 'success' && (
                        <div className={`p-6 rounded-2xl border text-center space-y-3 shadow-md
                          ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}
                        `}>
                          <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce mx-auto" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-450">Action Completed!</p>
                            <p className="text-xs text-slate-500 font-medium">{publishingMessage}</p>
                          </div>
                          <span className="text-[10px] bg-emerald-55/10 text-emerald-500 font-bold px-3 py-1 rounded-full animate-pulse">
                            Routing UI panels...
                          </span>
                        </div>
                      )}

                      {/* AUTHENTICATION REQUIREMENTS WARNING */}
                      {publishingState === 'auth_required' && (
                        <div className={`p-5 rounded-2xl border text-center space-y-3 shadow-md
                          ${theme === 'light' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-rose-950/10 border-rose-900/40 text-rose-300'}
                        `}>
                          <AlertTriangle className="w-8 h-8 text-rose-550 mx-auto" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Authentication Required</p>
                            <p className="text-xs opacity-90 font-semibold">{publishingMessage}</p>
                          </div>
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              router.push('/auth/login');
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                          >
                            Go to Login
                          </button>
                        </div>
                      )}

                      {/* SYSTEM-WIDE FAIL BAILS - SAVED LOCAL DRAFTS */}
                      {publishingState === 'draft_saved' && (
                        <div className={`p-5 rounded-2xl border space-y-3 shadow-md text-left
                          ${theme === 'light' ? 'bg-amber-50 border-amber-100 text-amber-900' : 'bg-amber-950/15 border-amber-900/40 text-amber-300'}
                        `}>
                          <div className="flex items-center gap-2 border-b pb-1.5 border-amber-150/40">
                            <FolderPlus className="w-5 h-5 text-amber-600" />
                            <h4 className="font-bold text-xs uppercase tracking-wider">Server Offline - Saved Draft</h4>
                          </div>
                          <p className="text-xs leading-relaxed font-semibold opacity-95">{publishingMessage}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handlePublishAction(preview, activeAction)}
                              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                            >
                              Retry Publishing
                            </button>
                            <button
                              onClick={() => {
                                setPublishingState('idle');
                                setActiveAction(null);
                                setFormStep(0);
                              }}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition border border-slate-200/50"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const isAI = msg.sender === 'ai';
                const parsedPost = parseAutoPost(msg.text);

                if (isAI && parsedPost) {
                  const isEditing = isEditingPostId === msg.id;
                  const isScheduling = schedulingPostId === msg.id;
                  const isThisPublishing = publishingPostId === msg.id && publishingState !== 'idle';
                  
                  if (isThisPublishing) {
                    return (
                      <div key={msg.id || index} className="w-full my-4 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-sm flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className={`p-5 rounded-2xl border text-center space-y-4 flex-1 max-w-[85%] shadow-lg
                          ${theme === 'light' ? 'bg-white border-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
                        `}>
                          {publishingState === 'loading' && (
                            <div className="space-y-4 py-2">
                              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                              <div className="space-y-1">
                                <p className="font-bold text-sm">Publishing post...</p>
                                <p className="text-[11px] text-slate-400 font-medium">{publishingMessage}</p>
                              </div>
                            </div>
                          )}

                          {publishingState === 'success' && (
                            <div className="space-y-3 py-2">
                              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce mx-auto" />
                              <div className="space-y-1">
                                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-450">Post Created!</p>
                                <p className="text-[11px] text-slate-400 font-medium">{publishingMessage}</p>
                              </div>
                            </div>
                          )}

                          {publishingState === 'auth_required' && (
                            <div className="space-y-3 py-1">
                              <AlertTriangle className="w-8 h-8 text-rose-550 mx-auto" />
                              <div className="space-y-1">
                                <p className="font-bold text-sm">Auth Required</p>
                                <p className="text-[11px] text-slate-450 dark:text-slate-400">{publishingMessage}</p>
                              </div>
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  router.push('/auth/login');
                                }}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-xl shadow-sm transition"
                              >
                                Go to Login
                              </button>
                            </div>
                          )}

                          {publishingState === 'draft_saved' && (
                            <div className="space-y-3 py-1 text-left">
                              <div className="flex items-center gap-2 border-b pb-1.5 border-amber-500/20">
                                <FolderPlus className="w-4 h-4 text-amber-500" />
                                <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600">Saved to Drafts</h4>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">{publishingMessage}</p>
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => handlePublishParsedPost(parsedPost, msg.media?.url, msg.id)}
                                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shadow-sm transition"
                                >
                                  Retry
                                </button>
                                <button
                                  onClick={() => {
                                    setPublishingState('idle');
                                    setPublishingPostId(null);
                                  }}
                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold text-[11px] rounded-xl transition border border-slate-200/50"
                                >
                                  Close
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id || index} className="w-full my-4 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-sm flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className={`p-4 rounded-2xl border shadow-lg space-y-3.5 text-left flex-1 max-w-[85%]
                        ${theme === 'light' ? 'bg-white border-slate-100 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'}
                      `}>
                        {/* Title Banner */}
                        <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <PenTool className="w-4 h-4 text-sky-500 animate-pulse" />
                            <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                              AI Startup Assistant
                            </h4>
                          </div>
                          {msg.scheduledAt && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold animate-pulse flex items-center gap-1">
                              📅 Scheduled: {msg.scheduledAt}
                            </span>
                          )}
                        </div>

                        {/* Media Preview inside Card */}
                        {msg.media && (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200/40 dark:border-slate-800 bg-slate-950/20 max-h-[140px]">
                            {msg.media.type === 'video' ? (
                              <div className="flex items-center justify-center p-6 text-slate-400 bg-slate-950/40">
                                <Video className="w-8 h-8 text-rose-500 animate-pulse mr-2" />
                                <span className="text-[11px] font-bold truncate max-w-[150px]">{msg.media.name}</span>
                              </div>
                            ) : (
                              <img src={msg.media.url} alt="Attached Startup Media" className="w-full object-cover max-h-[140px] hover:scale-102 transition duration-300" />
                            )}
                          </div>
                        )}

                        {/* Card Form Content / Editing Flow */}
                        {isEditing ? (
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Post Title</label>
                              <input 
                                type="text" 
                                value={editedPost.title} 
                                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                                className="w-full p-2 mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase">Description / Caption</label>
                              <textarea 
                                value={editedPost.description} 
                                rows={3}
                                onChange={(e) => setEditedPost({ ...editedPost, description: e.target.value })}
                                className="w-full p-2 mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed text-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase">Hashtags</label>
                                <input 
                                  type="text" 
                                  value={editedPost.hashtags} 
                                  onChange={(e) => setEditedPost({ ...editedPost, hashtags: e.target.value })}
                                  className="w-full p-2 mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase">Call to Action (CTA)</label>
                                <input 
                                  type="text" 
                                  value={editedPost.cta} 
                                  onChange={(e) => setEditedPost({ ...editedPost, cta: e.target.value })}
                                  className="w-full p-2 mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-xs leading-relaxed text-left">
                            <h3 className="font-extrabold text-[13.5px] leading-tight text-blue-600 dark:text-blue-400">{parsedPost.title}</h3>
                            <p className="opacity-95 text-slate-700 dark:text-slate-200 whitespace-pre-line font-medium leading-relaxed">{parsedPost.description}</p>
                            
                            <div className="flex flex-wrap gap-1.5 pt-1 text-sky-500 font-bold text-[10.5px]">
                              {parsedPost.hashtags.split(' ').map((tag, tIdx) => (
                                <span key={tIdx} className="hover:underline cursor-pointer">{tag}</span>
                              ))}
                            </div>

                            {parsedPost.cta && (
                              <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-600 dark:text-blue-450 font-bold text-[11px] flex items-center gap-1.5 mt-1">
                                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                                <span>{parsedPost.cta}</span>
                              </div>
                            )}

                            {!msg.media && parsedPost.imageConcept && (
                              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[10.5px] flex items-start gap-1.5">
                                <UploadCloud className="w-4 h-4 text-slate-450 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Suggested Image Concept:</span>
                                  {parsedPost.imageConcept}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Action Buttons Panel */}
                        <div className="space-y-2.5 pt-1">
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handleSavePostEdit(msg.id)}
                                className="py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-[11.5px] rounded-xl hover:opacity-95 shadow-sm transition active:scale-97 cursor-pointer text-center"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => { setIsEditingPostId(null); setEditedPost(null); }}
                                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold text-[11.5px] rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition active:scale-97 cursor-pointer text-center"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {/* Primary Publish Trigger */}
                              <button
                                onClick={() => handlePublishParsedPost(parsedPost, msg.media?.url, msg.id)}
                                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-bold text-[12px] rounded-xl shadow-md transition transform active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                Publish Post
                              </button>

                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => {
                                    setIsEditingPostId(msg.id);
                                    setEditedPost(parsedPost);
                                  }}
                                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl border border-slate-200/40 dark:border-slate-750 transition active:scale-97 cursor-pointer text-center"
                                >
                                  Edit Post
                                </button>
                                
                                <button
                                  onClick={() => handleGenerateAIImage(msg.id, parsedPost.imageConcept)}
                                  disabled={isGeneratingImage}
                                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl border border-slate-200/40 dark:border-slate-750 transition active:scale-97 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                                >
                                  {isGeneratingImage ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                  ) : (
                                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                  )}
                                  AI Image
                                </button>

                                <button
                                  onClick={() => setSchedulingPostId(isScheduling ? null : msg.id)}
                                  className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-[11px] rounded-xl border border-slate-200/40 dark:border-slate-750 transition active:scale-97 cursor-pointer text-center"
                                >
                                  Schedule
                                </button>
                              </div>

                              {/* Inline Interactive Scheduling Form */}
                              {isScheduling && (
                                <div className="p-3 mt-1.5 rounded-xl border border-dashed border-blue-500/30 bg-blue-500/5 space-y-2.5 text-xs text-left">
                                  <h5 className="font-bold text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    Simulated Post Scheduler
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1">Pick Date</label>
                                      <input 
                                        type="date" 
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-100"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1">Pick Time</label>
                                      <input 
                                        type="time" 
                                        value={scheduledTime}
                                        onChange={(e) => setScheduledTime(e.target.value)}
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-100"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleSchedulePost(msg.id, scheduledDate, scheduledTime)}
                                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-bold text-[11px] rounded-lg shadow-sm transition transform active:scale-98 cursor-pointer"
                                  >
                                    Confirm Schedule
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.type === 'search_results') {
                  const startupsList = msg.previewData || [];
                  return (
                    <div key={msg.id || index} className="w-full my-4 flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-sm flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-4 rounded-2xl border shadow-sm text-left flex-1 max-w-[85%] space-y-3 bg-white border-slate-200 text-slate-800">
                        <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
                          <Search className="w-4 h-4 text-blue-500" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Search Results</h4>
                        </div>
                        {startupsList.length === 0 ? (
                          <p className="text-xs text-slate-500 font-medium">No startups found matching your query.</p>
                        ) : (
                          <div className="space-y-3">
                            {startupsList.map((startup, sIdx) => {
                              const logoUrl = getSafeImageSrc(startup.logo);
                              return (
                                <div key={sIdx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition">
                                  <div className="h-10 w-10 rounded-lg overflow-hidden bg-blue-50/50 flex-shrink-0 flex items-center justify-center border border-slate-200/30">
                                    {logoUrl ? (
                                      <img src={logoUrl} alt={startup.name} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-blue-600 font-bold text-sm bg-blue-50">
                                        {getSafeInitial(startup.name)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h5 className="font-bold text-xs text-slate-900 truncate">{startup.name}</h5>
                                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md uppercase">
                                        {startup.stage}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-450 font-semibold mb-1 truncate">{startup.industry}</p>
                                    <p className="text-slate-600 text-[11px] line-clamp-1 mb-2 font-medium">{startup.oneLinePitch}</p>
                                    <button
                                      onClick={() => {
                                        setIsOpen(false);
                                        router.push(`/startups/${startup._id}`);
                                      }}
                                      className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 text-[10px] font-bold rounded-lg transition cursor-pointer"
                                    >
                                      View Startup
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || index} className={`flex items-start gap-2.5 ${!isAI ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm
                      ${isAI 
                        ? 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white' 
                        : 'bg-gradient-to-tr from-slate-650 to-slate-450 text-white border border-slate-200/20'
                      }
                    `}>
                      {isAI ? <Sparkles className="w-3.5 h-3.5" /> : 'ME'}
                    </div>

                    <div className="flex flex-col max-w-[80%]">
                      <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm
                        ${isAI 
                          ? theme === 'light'
                            ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                            : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-sm'
                          : 'bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-tr-sm'
                        }
                      `}>
                        <div className="whitespace-pre-line text-left">
                          {msg.text.split('\n').map((line, lIdx) => {
                            // Bold check
                            const boldRegex = /\*\*(.*?)\*\*/g;
                            let match;
                            const parts = [];
                            let lastIndex = 0;

                            while ((match = boldRegex.exec(line)) !== null) {
                              parts.push(line.substring(lastIndex, match.index));
                              parts.push(
                                <strong key={match.index} className="font-bold text-blue-600 dark:text-blue-400">
                                  {match[1]}
                                </strong>
                              );
                              lastIndex = boldRegex.lastIndex;
                            }
                            parts.push(line.substring(lastIndex));

                            // Checklist bullets check
                            const checklistRegex = /^-\s+\[\s*(x|X| )?\s*\]\s+(.*)$/;
                            const checkMatch = line.trim().match(checklistRegex);
                            if (checkMatch) {
                              const isChecked = checkMatch[1] && checkMatch[1].toLowerCase() === 'x';
                              return (
                                <div key={lIdx} className="flex items-start gap-2 my-1 pl-1 font-medium text-[12.5px]">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked} 
                                    readOnly 
                                    className="mt-1 rounded text-blue-500 focus:ring-0 w-3.5 h-3.5 pointer-events-none"
                                  />
                                  <span>{checkMatch[2]}</span>
                                </div>
                              );
                            }

                            // List bullet check
                            if (line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
                              return <div key={lIdx} className="pl-2.5 my-1.5 font-medium">{line}</div>;
                            }

                            return (
                              <p key={lIdx} className={line === '' ? 'h-2.5' : 'mb-1.5'}>
                                {parts.length > 1 ? parts : line}
                              </p>
                            );
                          })}
                        </div>

                        {/* Inline RAG Metadata Rendering */}
                        {isAI && ((msg.sources && msg.sources.length > 0) || (msg.confidence !== undefined && msg.confidence !== null)) && (
                          <div className="mt-3.5 pt-3 border-t border-slate-150/60 dark:border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                Cited Sources
                              </span>
                            </div>

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.sources.map((source, sIdx) => {
                                  const isDoc = source.sourceType === 'document';
                                  const isStartup = source.sourceType === 'startupDoc';
                                  const isInvestor = source.sourceType === 'founderDoc';
                                  const scorePct = Math.min(100, Math.max(0, Math.round((source.score || 0) * 100)));

                                  return (
                                    <div 
                                      key={sIdx} 
                                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-250 hover:scale-[1.01] hover:shadow-sm
                                        ${theme === 'light' 
                                          ? 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-700' 
                                          : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800 text-slate-300'
                                        }
                                      `}
                                    >
                                      {isDoc && <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                                      {isStartup && <Rocket className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                                      {isInvestor && <Users className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                                      {!isDoc && !isStartup && !isInvestor && <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}

                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold truncate" title={source.fileName || 'source document'}>
                                          {source.fileName || 'source document'}
                                        </p>
                                        <p className="text-[9px] text-slate-450 dark:text-slate-550 font-bold uppercase">
                                          {source.sourceType === 'document' ? 'Document' : source.sourceType === 'startupDoc' ? 'Startup Details' : 'Investor Profile'}
                                        </p>
                                      </div>

                                      {scorePct > 0 && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                                          ${theme === 'light' ? 'bg-slate-200/60 text-slate-600' : 'bg-slate-800 text-slate-400'}
                                        `}>
                                          {scorePct}% match
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {isAI && (
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={() => speakText(msg.text, msg.id)}
                              className={`p-1.5 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                                speakingMsgId === msg.id 
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                              }`}
                              title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"}
                            >
                              {speakingMsgId === msg.id ? (
                                <Square className="w-3.5 h-3.5 fill-current" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Info footer */}
                      <div className={`mt-1 flex items-center gap-2 text-[10px] px-1 text-slate-400
                        ${!isAI ? 'justify-end' : ''}
                      `}>
                        <span>{msg.timestamp}</span>
                        {isAI && <span className="text-slate-500">• FounderX AI Operator</span>}
                      </div>

                      {/* Actions */}
                      {isAI && msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.actions.filter(Boolean).map((act, actIdx) => {
                            const labelText = act.label || act.text || act;
                            const clean = labelText.toLowerCase();
                            
                            let icon = <Sparkles className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            if (clean.includes('create startup') || clean.includes('startup profile')) {
                              icon = <Rocket className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            } else if (clean.includes('create a post') || clean.includes('create post') || clean.includes('post')) {
                              icon = <PenTool className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            } else if (clean.includes('profile') || clean.includes('founder')) {
                              icon = <Users className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            } else if (clean.includes('pitch deck') || clean.includes('deck')) {
                              icon = <FileText className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            } else if (clean.includes('video') || clean.includes('watch')) {
                              icon = <Video className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            } else if (clean.includes('funding') || clean.includes('investor') || clean.includes('raise')) {
                              icon = <TrendingUp className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />;
                            }

                            return (
                              <motion.button
                                key={actIdx}
                                onClick={() => handleActionClick(act)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: actIdx * 0.05 }}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                className="group flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border-none shadow-sm transition-all duration-200 active:scale-[0.97] w-fit max-w-fit cursor-pointer text-left"
                              >
                                {icon}
                                <span>{labelText}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* HIGH FIDELITY DRAG AND DROP MOCK UPLOADER WIDGETS */}
              {activeAction === 'UPLOAD_PITCH' && formStep === 1 && (
                <div className="w-full my-3">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center hover:bg-blue-500/5 transition cursor-pointer flex flex-col items-center gap-2
                      ${isDragging ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'border-blue-500/35 dark:border-slate-800 text-slate-500'}
                    `}
                  >
                    <UploadCloud className="w-8 h-8 text-blue-500 animate-bounce" style={{ animationDuration: '3s' }} />
                    <p className="font-bold text-xs text-blue-500">Drag & Drop PDF Pitch Deck Here</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">or click to browse local files (PDF up to 20MB)</p>
                  </div>
                </div>
              )}

              {activeAction === 'UPLOAD_VIDEO' && formStep === 2 && (
                <div className="w-full my-3">
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFileUpload(file); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center hover:bg-blue-500/5 transition cursor-pointer flex flex-col items-center gap-2
                      ${isDragging ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'border-blue-500/35 dark:border-slate-800 text-slate-500'}
                    `}
                  >
                    <UploadCloud className="w-8 h-8 text-rose-500 animate-bounce" style={{ animationDuration: '3s' }} />
                    <p className="font-bold text-xs text-rose-500">Drag & Drop Startup Video Here</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-400">or click to browse local files (.mp4 up to 50MB)</p>
                  </div>
                </div>
              )}

              {/* AI STATE DOTS */}
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-sm flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3.5s' }} />
                  </div>
                  <div className={`px-4 py-3 rounded-2xl rounded-tl-sm text-[13px] shadow-sm flex items-center gap-2 border
                    ${theme === 'light' 
                      ? 'bg-white border-slate-100 text-slate-500' 
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                    }
                  `}>
                    <span className="font-semibold text-xs tracking-wider">AI is processing data inputs</span>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {errorState && (
                <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-2.5 shadow-sm
                  ${theme === 'light' 
                    ? 'bg-rose-50 border-rose-100 text-rose-600' 
                    : 'bg-rose-950/20 border-rose-900/40 text-rose-450'
                  }
                `}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold mb-0.5">Connectivity Interruption</p>
                    <p className="opacity-90">{errorState}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Media Upload Progress Bar */}
            {uploadingMedia && (
              <div className={`mx-3 mb-2 p-2 rounded-xl border flex items-center gap-2 text-[11px] font-bold animate-pulse
                ${theme === 'light' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-950/20 border-blue-900/40 text-blue-400'}
              `}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Uploading media to secure storage...</span>
              </div>
            )}

            {/* Pending Media File Preview */}
            {pendingMedia && (
              <div className={`mx-3 mb-2 p-2 rounded-xl border flex items-center justify-between text-[11px] font-bold shadow-sm
                ${theme === 'light' ? 'bg-slate-50 border-slate-150 text-slate-700' : 'bg-slate-950/40 border-slate-800 text-slate-350'}
              `}>
                <div className="flex items-center gap-2 min-w-0">
                  {pendingMedia.type === 'video' ? (
                    <Video className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                  <span className="truncate max-w-[200px]">{pendingMedia.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setPendingMedia(null)}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* INPUT PANEL CONTROLLER */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className={`p-3 border-t flex items-center gap-2
                ${theme === 'light' ? 'border-slate-100 bg-white' : 'border-slate-850 bg-slate-950'}
              `}
            >
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => { const file = e.target.files[0]; if (file) handleFileUpload(file); }}
                className="hidden" 
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" 
              />
              
              {/* Paperclip Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia || isTyping}
                title="Upload Image/Video"
                className={`p-2 rounded-xl transition-all flex items-center justify-center transform active:scale-95 disabled:opacity-50 cursor-pointer
                  ${theme === 'light' ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-slate-900 text-slate-400 hover:text-white'}
                `}
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={
                      isRecording
                        ? "Listening... Speak now..."
                        : activeAction 
                          ? `Step ${formStep + 1}: Provide details...`
                          : pendingMedia 
                            ? "Add description or hit send..." 
                            : "How can i help you?"
                    }
                    className={`w-full px-4 py-2.5 pr-10 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 transition-all border
                      ${isRecording
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10 text-emerald-800 dark:text-emerald-200 focus:ring-emerald-500/50'
                        : theme === 'light' 
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-blue-500/50' 
                          : 'bg-slate-900 border-slate-800 text-slate-100 focus:bg-slate-900 focus:ring-blue-500/50'
                      }
                    `}
                  />
                
                {(isRecording || (!isRecording && !inputValue.trim())) && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {(!isRecording || isContinuousMode) && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !isContinuousMode;
                          setIsContinuousMode(nextVal);
                          isContinuousModeRef.current = nextVal;
                          if (nextVal) {
                            startRecording();
                          } else {
                            stopRecording();
                            stopBargeInDetection();
                            if ('speechSynthesis' in window) {
                              window.speechSynthesis.cancel();
                            }
                            setSpeakingMsgId(null);
                          }
                        }}
                        title={isContinuousMode ? 'Disable Hands-Free Mode' : 'Enable Hands-Free Mode'}
                        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                          isContinuousMode
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-300/50 dark:ring-emerald-700/50' 
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-500 dark:hover:text-blue-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        {isContinuousMode && <span className="text-[9px] font-bold uppercase tracking-wider">ON</span>}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) {
                          stopRecording();
                        } else {
                          startRecording();
                        }
                      }}
                      disabled={uploadingMedia || isTyping}
                      title={isRecording ? "Stop listening" : "Click to speak (Push-to-Talk)"}
                      className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer select-none
                        ${isRecording 
                          ? 'bg-red-100 text-red-600 animate-pulse dark:bg-red-950/40 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60' 
                          : theme === 'light' 
                            ? 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 active:text-blue-700 active:scale-110' 
                            : 'text-slate-500 hover:text-blue-400 hover:bg-slate-850 active:bg-blue-900/40 active:text-blue-300 active:scale-110'
                        }
                      `}
                    >
                      {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Continuous mode listening/speaking indicator */}
                {isContinuousMode && isRecording && !inputValue.trim() && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Listening</span>
                    </span>
                  </div>
                )}
                {isContinuousMode && speakingMsgId && !isRecording && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      <Volume2 className="w-3 h-3 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Speaking</span>
                    </span>
                  </div>
                )}
              </div>
              {(isRecording || speakingMsgId) && (
                <button
                  type="button"
                  onClick={handleStopSpeakingOrRecording}
                  className="p-2.5 rounded-xl bg-red-550 hover:bg-red-650 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-red-500/20"
                  title={isRecording ? "Stop Recording" : "Stop Speaking"}
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>{isRecording ? "Stop" : "Stop Speaking"}</span>
                </button>
              )}
              <button
                type="submit"
                disabled={(!inputValue.trim() && !pendingMedia) || isTyping || uploadingMedia}
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center transform active:scale-95 disabled:scale-100 cursor-pointer
                  ${(inputValue.trim() || pendingMedia) 
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-500/20 hover:opacity-95' 
                    : theme === 'light'
                      ? 'bg-slate-100 text-slate-350 cursor-not-allowed'
                      : 'bg-slate-900 text-slate-650 cursor-not-allowed'
                  }
                `}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FULL SCREEN AI DOCUMENT VIEW PANEL MODAL */}
      <AnimatePresence>
        {activeDocViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-3xl h-[85vh] max-h-[700px] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/20 to-sky-950/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                  <h3 className="font-bold text-base tracking-tight">{activeDocViewer.title}</h3>
                </div>
                <button
                  onClick={() => setActiveDocViewer(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 transition text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Text Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-left select-text scrollbar-thin bg-slate-950/50">
                {activeDocViewer.text}
              </div>

              {/* Action bar */}
              <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeDocViewer.text);
                      alert("Content copied to clipboard!");
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition border border-slate-700/50"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      const element = document.createElement("a");
                      const file = new Blob([activeDocViewer.text], {type: 'text/plain'});
                      element.href = URL.createObjectURL(file);
                      element.download = `${activeDocViewer.title.replace(/[\s:]+/g, '_')}.txt`;
                      document.body.appendChild(element);
                      element.click();
                      document.body.removeChild(element);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition border border-slate-700/50"
                  >
                    Download .TXT
                  </button>
                </div>
                <button
                  onClick={() => setActiveDocViewer(null)}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition transform active:scale-98"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION TRIGGER TRIGGER */}
      {!(isFullScreen && isOpen) && (
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          zIndex: 50
        }}
        className={`
          rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(10,102,194,0.38)] border border-white/10 pointer-events-auto
          ${isOpen 
            ? 'bg-gradient-to-tr from-slate-700 to-slate-850 text-white' 
            : 'bg-gradient-to-tr from-blue-600 via-primary to-sky-400 text-white'
          }
        `}
      >
        {/* Pulsing notifications */}
        {hasUnread && !isOpen && (
          <>
            <span className="absolute inset-0 rounded-full border-4 border-blue-400/40 animate-ping" style={{ animationDuration: '2s' }}></span>
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-[8px] font-bold text-white shadow-sm z-10 animate-bounce">
              1
            </span>
          </>
        )}
        
        {isOpen ? (
          <X className="w-5.5 h-5.5" />
        ) : (
          <MessageCircle className="w-5.5 h-5.5" />
        )}
      </motion.button>
      )}
    </div>
  );
}
