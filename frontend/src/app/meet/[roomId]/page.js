'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';
import { 
  Video, VideoOff, Mic, MicOff, MessageSquare, 
  Users, LogOut, Loader2, AlertTriangle, Send, User, Copy, Check,
  MonitorUp, Smile, ClosedCaption, Hand, MoreVertical, Info, Shapes, Lock,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { getApiUrl } from '@/utils/api';

const API_URL = getApiUrl();

export default function MeetingRoom() {
  const params = useParams();
  const roomId = params?.roomId;
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { addToast } = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Access States
  const [waitingRoom, setWaitingRoom] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // States
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  
  // Sidebar & Overlays
  const [activeSidebar, setActiveSidebar] = useState(null); // 'chat', 'people', 'info', 'host'
  const [reactions, setReactions] = useState([]); 
  const [raisedHands, setRaisedHands] = useState([]); 
  
  // Media streams and peers
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const peersRef = useRef({}); // { socketId: RTCPeerConnection }
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [remoteUsers, setRemoteUsers] = useState({}); // { socketId: userId }

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // Time validation
  const [timeToStart, setTimeToStart] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Meeting Data
  useEffect(() => {
    if (!token) return;
    const fetchMeeting = async () => {
      try {
        const res = await fetch(`${API_URL}/api/meetings/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          setMeeting(data.data);
          setChatMessages(data.data.chatMessages || []);
          
          if (data.accessStatus === 'waiting_room') {
            setWaitingRoom(true);
            if (socket && user) {
              socket.emit('request-to-join-meeting', { meetingId: data.data._id, user: { _id: user.id || user._id, name: user.name, profileImage: user.profileImage } });
            }
          } else {
            setWaitingRoom(false);
          }

          // Check Time Logic (10 mins before)
          const now = new Date();
          const scheduledDate = new Date(data.data.scheduledDate);
          const [hours, minutes] = data.data.startTime.split(':');
          scheduledDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          
          const diffMs = scheduledDate - now;
          if (diffMs > 10 * 60 * 1000 && data.accessStatus !== 'waiting_room') {
            setTimeToStart(diffMs);
          }
        } else {
          setError(data.error || 'Failed to load meeting');
        }
      } catch (err) {
        setError('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [roomId, token]);

  // Request Media on Mount (Preview)
  useEffect(() => {
    if (!joined && !timeToStart && !error && !waitingRoom) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
        })
        .catch(err => {
          console.warn("Media permissions denied or not available", err);
          setCameraOn(false);
          setMicOn(false);
          // Try audio only
          navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            setLocalStream(stream);
            setMicOn(true);
          }).catch(() => {
            addToast('Camera and Microphone access denied', 'error');
          });
        });
    }
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [joined, timeToStart, error, waitingRoom]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeSidebar]);

  // Ensure local video stream stays attached when UI transitions or camera toggles
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, joined, cameraOn]);

  // Handle Socket Events & WebRTC Signaling
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for access events even before joining WebRTC
    socket.on('meeting-join-request', ({ user }) => {
      setPendingRequests(prev => {
        if (!prev.find(req => req._id === user._id)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    socket.on('user-admitted', ({ userId }) => {
      if (userId === (user.id || user._id)) {
        setWaitingRoom(false);
      }
    });

    socket.on('user-rejected', ({ userId }) => {
      if (userId === (user.id || user._id)) {
        setWaitingRoom(false);
        setError('Host denied your request.');
      }
    });

    if (!joined) return;

    socket.emit('join-meeting', { roomId, userId: user.id || user._id });

    // When a new user joins, we (already in room) create an offer for them
    socket.on('user-joined', async ({ userId, socketId }) => {
      setRemoteUsers(prev => ({ ...prev, [socketId]: userId }));
      const pc = createPeerConnection(socketId);
      peersRef.current[socketId] = pc;
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { offer, to: socketId, from: socket.id });
    });

    socket.on('webrtc-offer', async ({ offer, from }) => {
      const pc = createPeerConnection(from);
      peersRef.current[from] = pc;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { answer, to: from, from: socket.id });
    });

    socket.on('webrtc-answer', async ({ answer, from }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on('webrtc-ice-candidate', async ({ candidate, from }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on('user-left', ({ userId, socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setRemoteStreams(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setRemoteUsers(prev => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on('meeting-chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('meeting-reaction', ({ userId, reaction }) => {
      const id = Math.random().toString(36).substr(2, 9);
      setReactions(prev => [...prev, { id, reaction, userId }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    });

    socket.on('meeting-hand-raise', ({ userId, isRaised }) => {
      if (isRaised) {
        setRaisedHands(prev => {
           if (!prev.includes(userId)) return [...prev, userId];
           return prev;
        });
      } else {
        setRaisedHands(prev => prev.filter(id => id !== userId));
      }
    });

    return () => {
      socket.emit('leave-meeting', { roomId, userId: user.id || user._id });
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-left');
      socket.off('meeting-chat-message');
      socket.off('meeting-join-request');
      socket.off('user-admitted');
      socket.off('user-rejected');
      socket.off('meeting-reaction');
      socket.off('meeting-hand-raise');
      
      Object.values(peersRef.current).forEach(pc => pc.close());
      peersRef.current = {};
    };
  }, [socket, joined, roomId, user]);

  const createPeerConnection = (socketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc-ice-candidate', { candidate: event.candidate, to: socketId, from: socket.id });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [socketId]: event.streams[0]
      }));
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    return pc;
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOn(videoTrack.enabled);
        if (socket) socket.emit('toggle-camera', { roomId, userId: user.id || user._id, isVideoOff: !videoTrack.enabled });
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
        if (socket) socket.emit('toggle-mic', { roomId, userId: user.id || user._id, isMuted: !audioTrack.enabled });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const videoTrack = displayStream.getVideoTracks()[0];
        
        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(videoTrack);
        }
        
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });

        videoTrack.onended = () => {
          stopScreenShare();
        };

        setScreenSharing(true);
      } catch (err) {
        console.error("Screen sharing failed", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newVideoTrack = videoStream.getVideoTracks()[0];
      
      if (!cameraOn) newVideoTrack.enabled = false;

      if (localStream) {
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) {
          localStream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        localStream.addTrack(newVideoTrack);
      }

      Object.values(peersRef.current).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
      });
      
      setScreenSharing(false);
    } catch (err) {
      console.error("Error reverting screen share", err);
    }
  };

  const sendReaction = (emoji) => {
    const id = Math.random().toString(36).substr(2, 9);
    const userId = user.id || user._id;
    setReactions(prev => [...prev, { id, reaction: emoji, userId }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
    if (socket) socket.emit('meeting-reaction', { roomId, userId, reaction: emoji });
    setShowReactions(false);
  };

  const toggleHandRaise = () => {
    const userId = user.id || user._id;
    const isRaised = !handRaised;
    setHandRaised(isRaised);
    if (isRaised) {
      setRaisedHands(prev => [...prev, userId]);
    } else {
      setRaisedHands(prev => prev.filter(id => id !== userId));
    }
    if (socket) socket.emit('meeting-hand-raise', { roomId, userId, isRaised });
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const msgObj = {
      senderId: {
        _id: user.id || user._id,
        name: user.name,
        fullName: user.fullName,
        profileImage: user.profileImage
      },
      text: messageInput,
      timestamp: new Date()
    };

    if (socket) socket.emit('meeting-chat-message', { roomId, message: msgObj });
    setChatMessages(prev => [...prev, msgObj]);
    setMessageInput('');

    try {
      await fetch(`${API_URL}/api/meetings/${meeting._id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: messageInput })
      });
    } catch (e) {}
  };

  const leaveMeeting = () => {
    if (socket) socket.emit('leave-meeting', { roomId, userId: user.id || user._id });
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    router.push('/inbox');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/meet/${meeting.meetingCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAdmit = (pendingUser) => {
    if (socket) socket.emit('admit-user', { meetingId: meeting._id, userId: pendingUser._id });
    setPendingRequests(prev => prev.filter(u => u._id !== pendingUser._id));
  };

  const handleReject = (pendingUser) => {
    if (socket) socket.emit('reject-user', { meetingId: meeting._id, userId: pendingUser._id });
    setPendingRequests(prev => prev.filter(u => u._id !== pendingUser._id));
  };

  // UI Renders
  if (authLoading || loading) {
    return <div className="h-screen w-screen bg-[#202124] flex items-center justify-center">
      <Loader2 className="h-10 w-10 text-white animate-spin" />
    </div>;
  }

  if (error) {
    return <div className="h-screen w-screen bg-[#202124] flex flex-col items-center justify-center text-white">
      <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-normal">Access Denied</h1>
      <p className="text-gray-400 mt-2">{error}</p>
      <button onClick={() => router.push('/inbox')} className="mt-6 px-6 py-2 bg-blue-600 rounded-full font-medium">Return to home</button>
    </div>;
  }

  if (timeToStart && timeToStart > 0) {
    return <div className="h-screen w-screen bg-[#202124] flex flex-col items-center justify-center text-white p-6">
      <div className="bg-[#3c4043] p-8 rounded-2xl max-w-md text-center shadow-xl">
        <Video className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h1 className="text-2xl font-normal">{meeting.title}</h1>
        <p className="text-gray-400 mt-2 text-sm">Scheduled for {new Date(meeting.scheduledDate).toLocaleDateString()} at {meeting.startTime}</p>
        <div className="mt-6 p-4 bg-yellow-500/10 text-yellow-500 rounded-xl font-medium">
          Meeting has not started yet. You can join 10 minutes before.
        </div>
        <button onClick={() => router.push('/inbox')} className="mt-6 px-6 py-2 border border-gray-500 rounded-full font-medium hover:bg-[#4a4d51] w-full transition">Return</button>
      </div>
    </div>;
  }

  if (waitingRoom) {
    return <div className="h-screen w-screen bg-[#202124] flex flex-col items-center justify-center text-white p-6">
      <div className="bg-[#3c4043] p-8 rounded-2xl max-w-md text-center shadow-xl">
        <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
        <h1 className="text-2xl font-normal">Waiting for host</h1>
        <p className="text-gray-400 mt-2 text-sm">You'll join the meeting once the host admits you.</p>
        <div className="mt-6 flex justify-center">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
        </div>
        <button onClick={() => router.push('/inbox')} className="mt-6 px-6 py-2 border border-gray-500 rounded-full font-medium hover:bg-[#4a4d51] w-full transition">Leave</button>
      </div>
    </div>;
  }

  // Pre-join Screen (Google Meet style)
  if (!joined) {
    return (
      <div className="h-screen w-screen bg-[#202124] flex flex-col items-center justify-center text-white p-6 font-sans">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="bg-[#3c4043] rounded-xl overflow-hidden aspect-video relative shadow-2xl">
            {cameraOn ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#3c4043]">
                <div className="h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-medium">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="mt-4 text-white font-medium">Camera is off</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button 
                onClick={toggleMic}
                className={`p-4 rounded-full transition ${micOn ? 'bg-black/50 hover:bg-black/70 text-white border border-gray-500' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'}`}
              >
                {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
              <button 
                onClick={toggleCamera}
                className={`p-4 rounded-full transition ${cameraOn ? 'bg-black/50 hover:bg-black/70 text-white border border-gray-500' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'}`}
              >
                {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-3xl font-normal text-white mb-2">{meeting.title}</h1>
            <p className="text-gray-400 mb-8">{meeting.agenda || 'No agenda provided'}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => setJoined(true)}
                className="px-8 py-3 bg-[#8ab4f8] hover:bg-[#93c5fd] text-[#202124] rounded-full font-medium text-sm transition"
              >
                Join now
              </button>
              <button 
                onClick={() => setJoined(true)}
                className="px-8 py-3 bg-transparent border border-gray-500 hover:bg-[#3c4043] text-[#8ab4f8] rounded-full font-medium text-sm transition flex items-center justify-center gap-2"
              >
                <MonitorUp className="w-4 h-4" /> Present
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const numStreams = Object.keys(remoteStreams).length;

  // Live Meeting Room (Google Meet style)
  return (
    <div className="h-screen w-screen bg-[#202124] flex flex-col font-sans overflow-hidden text-white relative">
      
      {/* Top Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex items-center gap-3 text-white drop-shadow-md bg-black/20 px-3 py-1.5 rounded-md pointer-events-auto">
          <span className="font-medium text-[15px]">{format(currentTime, 'HH:mm')}</span>
          <span className="w-px h-3 bg-gray-400"></span>
          <span className="font-medium text-[15px] tracking-wide">{meeting.meetingCode}</span>
          <button className="hover:text-gray-300 ml-1" onClick={() => setActiveSidebar('info')}><Info className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center bg-[#3c4043] hover:bg-[#4a4d51] cursor-pointer rounded-full px-3 py-1.5 gap-2 transition" onClick={() => setActiveSidebar('people')}>
             <Users className="w-4 h-4" />
             <span className="text-sm font-medium">{1 + Object.keys(remoteUsers).length}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shadow-md cursor-pointer">
             {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      {/* Floating Reactions overlay */}
      {reactions.map(r => (
         <div key={r.id} className="absolute bottom-28 left-1/2 transform -translate-x-1/2 text-5xl animate-bounce z-50 pointer-events-none">
           {r.reaction}
         </div>
      ))}

      {/* Main Area */}
      <main className="flex-1 flex overflow-hidden p-4 pb-24 relative">
        <div className={`flex-1 transition-all duration-300 ${activeSidebar ? 'mr-4' : ''} flex items-center justify-center`}>
           
           <div className={`w-full h-full max-h-[80vh] grid gap-4 ${
             numStreams === 0 ? 'grid-cols-1' : 
             numStreams === 1 ? 'grid-cols-2' : 
             numStreams <= 3 ? 'grid-cols-2 auto-rows-fr' : 
             'grid-cols-3 auto-rows-fr'
           }`}>
              
              {/* Local Video */}
              <div className="relative bg-[#3c4043] rounded-xl overflow-hidden shadow-sm group h-full">
                {cameraOn ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#3c4043]">
                    <div className="h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-normal text-white">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 text-sm font-medium text-white drop-shadow-md">
                  {user?.name || user?.fullName || 'You'}
                </div>
                {!micOn && (
                  <div className="absolute top-4 right-4 bg-black/50 rounded-full p-1.5 shadow-md">
                    <MicOff className="h-4 w-4 text-white" />
                  </div>
                )}
                {raisedHands.includes(user?.id || user?._id) && (
                  <div className="absolute top-4 left-4 bg-blue-500 rounded-full p-1.5 shadow-md">
                    <Hand className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Remote Streams */}
              {Object.entries(remoteStreams).map(([socketId, stream]) => {
                const isRaised = raisedHands.includes(remoteUsers[socketId]);
                return (
                  <div key={socketId} className="relative bg-[#3c4043] rounded-xl overflow-hidden shadow-sm group h-full">
                    <video 
                      autoPlay playsInline 
                      ref={el => { if (el) el.srcObject = stream }} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute bottom-4 left-4 text-sm font-medium text-white drop-shadow-md">
                      Participant
                    </div>
                    {isRaised && (
                      <div className="absolute top-4 left-4 bg-blue-500 rounded-full p-1.5 shadow-md">
                        <Hand className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                )
              })}

           </div>
        </div>

        {/* Sidebar Panel */}
        {activeSidebar && (
           <aside className="w-[360px] bg-white rounded-2xl flex flex-col overflow-hidden text-gray-900 relative z-20 shadow-2xl h-full animate-in slide-in-from-right">
              <div className="p-4 flex justify-between items-center border-b border-gray-100">
                 <h2 className="text-lg font-normal text-gray-800">
                   {activeSidebar === 'chat' && 'In-call messages'}
                   {activeSidebar === 'people' && 'People'}
                   {activeSidebar === 'info' && 'Meeting details'}
                   {activeSidebar === 'host' && 'Host controls'}
                 </h2>
                 <button onClick={() => setActiveSidebar(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                    <X className="h-5 w-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50">
                 
                 {activeSidebar === 'chat' && (
                    <div className="flex flex-col h-full bg-white">
                       <div className="p-3 bg-gray-100 text-xs text-gray-500 text-center mx-4 mt-4 rounded">
                          Messages can only be seen by people in the call and are deleted when the call ends.
                       </div>
                       <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {chatMessages.map((msg, i) => {
                            const isMe = msg.senderId?._id === (user.id || user._id);
                            return (
                              <div key={i} className="flex flex-col">
                                <span className="text-[12px] font-bold text-gray-800 mb-1">
                                  {isMe ? 'You' : (msg.senderId?.fullName || msg.senderId?.name)}
                                  <span className="text-gray-400 font-normal ml-2">{format(new Date(msg.timestamp), 'HH:mm')}</span>
                                </span>
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{msg.text}</div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                       </div>
                       <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-200 flex gap-2 bg-white">
                          <input 
                            type="text" 
                            value={messageInput} 
                            onChange={e => setMessageInput(e.target.value)}
                            placeholder="Send a message" 
                            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button type="submit" disabled={!messageInput.trim()} className="p-3 text-blue-600 disabled:text-gray-400 transition"><Send className="h-5 w-5" /></button>
                       </form>
                    </div>
                 )}

                 {activeSidebar === 'people' && (
                    <div className="p-4 bg-white min-h-full">
                       {pendingRequests.length > 0 && (
                         <div className="mb-6">
                           <h3 className="text-sm font-medium text-gray-500 mb-3">Waiting ({pendingRequests.length})</h3>
                           <div className="space-y-3">
                             {pendingRequests.map(req => (
                               <div key={req._id} className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                   <img src={req.profileImage || `https://ui-avatars.com/api/?name=${req.name}`} className="w-8 h-8 rounded-full" />
                                   <span className="text-sm font-medium">{req.name || req.fullName}</span>
                                 </div>
                                 <div className="flex gap-2">
                                   <button onClick={() => handleReject(req)} className="text-red-500 text-sm font-medium hover:underline">Deny</button>
                                   <button onClick={() => handleAdmit(req)} className="text-blue-600 text-sm font-medium hover:underline">Admit</button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       <h3 className="text-sm font-medium text-gray-500 mb-3">In call</h3>
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">{user?.name?.[0]?.toUpperCase()}</div>
                             <span className="text-sm font-medium">{user?.name || user?.fullName} (You)</span>
                           </div>
                           <div className="flex items-center gap-2 text-gray-400">
                             {!micOn && <MicOff className="w-4 h-4" />}
                             {raisedHands.includes(user?.id || user?._id) && <Hand className="w-4 h-4 text-blue-500" />}
                           </div>
                         </div>
                         {Object.keys(remoteUsers).map(socketId => {
                           const participantId = remoteUsers[socketId];
                           const isRaised = raisedHands.includes(participantId);
                           return (
                             <div key={socketId} className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm"><User className="w-4 h-4" /></div>
                                 <span className="text-sm font-medium">Participant</span>
                               </div>
                               <div className="flex items-center gap-2 text-gray-400">
                                 {isRaised && <Hand className="w-4 h-4 text-blue-500" />}
                               </div>
                             </div>
                           );
                         })}
                       </div>
                    </div>
                 )}

                 {activeSidebar === 'info' && (
                    <div className="p-4 bg-white min-h-full">
                       <h3 className="text-sm font-medium text-gray-800 mb-2">Joining info</h3>
                       <div className="text-sm text-gray-600 mb-4">{window.location.origin}/meet/{meeting.meetingCode}</div>
                       <button onClick={handleCopyLink} className="text-blue-600 text-sm font-medium flex items-center gap-2 hover:bg-blue-50 py-2 px-3 rounded-md transition -ml-3">
                         {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} 
                         {copiedLink ? 'Copied meeting link' : 'Copy joining info'}
                       </button>
                    </div>
                 )}

                 {activeSidebar === 'host' && (
                    <div className="p-4 bg-white min-h-full">
                       <h3 className="text-sm font-medium text-gray-800 mb-2">Meeting moderation</h3>
                       <p className="text-sm text-gray-500 mb-6">Host controls let you manage who can join and what they can do.</p>
                       <div className="space-y-4">
                         <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                           <span className="text-sm font-medium text-gray-800">Meeting access</span>
                           <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Open</span>
                         </div>
                       </div>
                    </div>
                 )}
              </div>
           </aside>
        )}
      </main>

      {/* Bottom Controls Bar */}
      <footer className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-10 pointer-events-none">
        
        {/* Left Space (Can be used for time/code but we moved it top left) */}
        <div className="w-64"></div>

        {/* Center Controls */}
        <div className="flex items-center gap-3 relative pointer-events-auto">
          
          {showReactions && (
            <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-[#3c4043] rounded-full px-6 py-3 flex gap-4 shadow-xl">
               {['💖','👍','🎉','👏','😂','😮','😢','🤔','👎'].map(emoji => (
                 <button key={emoji} onClick={() => sendReaction(emoji)} className="text-2xl hover:scale-125 transition transform">
                   {emoji}
                 </button>
               ))}
            </div>
          )}

          <button onClick={toggleMic} className={`p-3.5 rounded-full transition ${micOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'}`}>
             {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>
          
          <button onClick={toggleCamera} className={`p-3.5 rounded-full transition ${cameraOn ? 'bg-[#3c4043] hover:bg-[#4a4d51] text-white' : 'bg-[#ea4335] hover:bg-[#d93025] text-white'}`}>
             {cameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button onClick={toggleScreenShare} className={`p-3.5 rounded-full transition ${screenSharing ? 'bg-[#a8c7fa] text-[#0b57d0]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}>
             <MonitorUp className="h-5 w-5" />
          </button>

          <button onClick={() => setShowReactions(!showReactions)} className={`p-3.5 rounded-full transition ${showReactions ? 'bg-[#a8c7fa] text-[#0b57d0]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}>
             <Smile className="h-5 w-5" />
          </button>

          <button onClick={toggleHandRaise} className={`p-3.5 rounded-full transition ${handRaised ? 'bg-[#a8c7fa] text-[#0b57d0]' : 'bg-[#3c4043] hover:bg-[#4a4d51] text-white'}`}>
             <Hand className="h-5 w-5" />
          </button>

          <button className="p-3.5 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white transition hidden md:block">
             <MoreVertical className="h-5 w-5" />
          </button>

          <button onClick={leaveMeeting} className="px-5 bg-[#ea4335] hover:bg-[#d93025] text-white rounded-full font-bold flex items-center justify-center transition ml-2 h-12">
             <LogOut className="h-5 w-5 transform rotate-180" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="w-64 flex justify-end gap-1 pointer-events-auto text-white">
           <button onClick={() => setActiveSidebar(activeSidebar === 'info' ? null : 'info')} className={`p-2.5 rounded-full transition ${activeSidebar === 'info' ? 'text-[#8ab4f8]' : 'hover:bg-[#3c4043]'}`}>
              <Info className="h-5 w-5" />
           </button>
           <button onClick={() => setActiveSidebar(activeSidebar === 'people' ? null : 'people')} className={`p-2.5 rounded-full transition ${activeSidebar === 'people' ? 'text-[#8ab4f8]' : 'hover:bg-[#3c4043]'}`}>
              <Users className="h-5 w-5" />
           </button>
           <button onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')} className={`p-2.5 rounded-full transition ${activeSidebar === 'chat' ? 'text-[#8ab4f8]' : 'hover:bg-[#3c4043]'}`}>
              <MessageSquare className="h-5 w-5" />
           </button>
           <button onClick={() => setActiveSidebar(activeSidebar === 'host' ? null : 'host')} className={`p-2.5 rounded-full transition ${activeSidebar === 'host' ? 'text-[#8ab4f8]' : 'hover:bg-[#3c4043]'}`}>
              <Lock className="h-5 w-5" />
           </button>
        </div>
      </footer>
    </div>
  );
}
