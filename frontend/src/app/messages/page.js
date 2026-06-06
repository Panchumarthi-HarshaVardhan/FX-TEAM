'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Loader, User, MessageSquare } from 'lucide-react';
import ChatList from '../../components/messages/ChatList';
import ScheduleMeetingModal from '../../components/messages/ScheduleMeetingModal';
import dynamic from 'next/dynamic';

const ChatWindow = dynamic(() => import('../../components/messages/ChatWindow'), { 
  ssr: false,
  loading: () => <div className="flex-1 flex justify-center items-center"><Loader className="animate-spin h-8 w-8 text-primary" /></div>
});

function MessagesPageContent() {
  const { user, loading: authLoading, token } = useAuth();
  const { socket } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  
  const [meetings, setMeetings] = useState([]);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetingModalParticipant, setMeetingModalParticipant] = useState(null);

  const targetUserId = searchParams.get('userId');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Initial load & State Reset
  useEffect(() => {
    if (user && token) {
        fetchConversations();
        fetchMeetings();
    } else {
        setConversations([]);
        setActiveConversation(null);
        setMessages([]);
        setMeetings([]);
    }
  }, [user, token]);

  // Handle target user from URL (Start new chat)
  useEffect(() => {
      if (!loading && conversations.length >= 0 && targetUserId) {
          const existingConv = conversations.find(c => 
              c.participants.some(p => p._id === targetUserId)
          );
          
          if (existingConv) {
              setActiveConversation(existingConv);
              router.replace('/messages');
          } else {
              // Create new conversation
              createNewConversation(targetUserId);
          }
      }
  }, [loading, conversations, targetUserId]);

  const createNewConversation = async (recipientId) => {
      try {
          if (!token) return;
          // We can use the same endpoint as sendMessage but with empty content? 
          // Or usually we just want to get the conversation object.
          // Let's assume sending a message creates it, OR we have a dedicated create endpoint.
          // Based on my previous work, `sendMessage` creates it.
          // But I want to open the window without sending a message yet.
          
          // Let's call the `conversations` endpoint with a filter or create a specific endpoint.
          // Since I didn't create a specific "create conversation empty" endpoint, 
          // I'll check if I can fetch it by user ID or just let the UI handle a "fake" active conversation
          // until the first message is sent.
          
          // Better approach: Create a temporary conversation object for the UI
          // fetch user details first
          const res = await fetch(`${API_URL}/api/users/${recipientId}`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          
          if (data.success) {
              const recipient = data.data;
              const tempConv = {
                  _id: 'temp_' + Date.now(),
                  participants: [user, recipient],
                  initiator: user._id,
                  status: 'pending',
                  isTemp: true // Flag to know it's not saved yet
              };
              setActiveConversation(tempConv);
              setMessages([]);
              router.replace('/messages');
          }
      } catch (err) {
          console.error('Error preparing new conversation:', err);
      }
  };


  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (message) => {
        // If the message belongs to the active conversation, append it
        if (activeConversation && (message.conversationId === activeConversation._id || message.conversation === activeConversation._id)) {
            setMessages((prev) => {
                // Prevent duplicates
                if (prev.some(m => m._id === message._id)) return prev;
                return [...prev, message];
            });
            setIsOtherTyping(false); // Stop typing indicator if message received
            
            // Mark as read immediately if window is open
            markAsRead(activeConversation._id, [message._id]);
        }
        
        // Update the conversation list (last message, unread count)
        updateConversationWithNewMessage(message);
    });

    socket.on('message-status-updated', ({ messageIds, status, conversationId }) => {
        if (activeConversation && activeConversation._id === conversationId) {
            setMessages(prev => prev.map(msg => 
                messageIds.includes(msg._id) ? { ...msg, status } : msg
            ));
        }
    });

    socket.on('message_updated', ({ messageId, content, isEdited }) => {
        setMessages(prev => prev.map(msg => 
            msg._id === messageId ? { ...msg, content, isEdited } : msg
        ));
        
        // Update last message in conversation list if needed
        setConversations(prev => prev.map(c => {
            if (c.lastMessage?._id === messageId) {
                return { ...c, lastMessage: { ...c.lastMessage, content, isEdited } };
            }
            return c;
        }));
    });

    socket.on('message_deleted', ({ messageId }) => {
        // Option 1: Remove from list
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
        
        // Option 2: Show as deleted (if you want to keep the bubble)
        // setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, content: 'This message was deleted', isDeleted: true } : msg));

        // Update conversation list
        // If last message was deleted, this is tricky without fetching. 
        // For now, let's just leave the old preview or maybe fetch conversations again.
        fetchConversations();
    });

    socket.on('user_online', ({ userId }) => {
        setConversations(prev => prev.map(c => ({
            ...c,
            participants: c.participants.map(p => p._id === userId ? { ...p, isOnline: true } : p)
        })));
        
        if (activeConversation) {
            setActiveConversation(prev => ({
                ...prev,
                participants: prev.participants.map(p => p._id === userId ? { ...p, isOnline: true } : p)
            }));
        }
    });

    socket.on('user_offline', ({ userId, lastSeen }) => {
        setConversations(prev => prev.map(c => ({
            ...c,
            participants: c.participants.map(p => p._id === userId ? { ...p, isOnline: false, lastSeen } : p)
        })));
        
        if (activeConversation) {
            setActiveConversation(prev => ({
                ...prev,
                participants: prev.participants.map(p => p._id === userId ? { ...p, isOnline: false, lastSeen } : p)
            }));
        }
    });

    socket.on('typing', (data) => {
        if (activeConversation && data.conversationId === activeConversation._id && data.userId !== user._id) {
            setIsOtherTyping(true);
        }
    });

    socket.on('stop_typing', (data) => {
        if (activeConversation && data.conversationId === activeConversation._id && data.userId !== user._id) {
            setIsOtherTyping(false);
        }
    });

    socket.on('request_accepted', (data) => {
        // Refresh conversations to show updated status
        fetchConversations();
        if (activeConversation && activeConversation._id === data.conversationId) {
             setActiveConversation(prev => ({ ...prev, status: 'accepted' }));
        }
    });

    socket.on('new_message_request', () => {
        fetchConversations();
    });

    return () => {
        socket.off('receive_message');
        socket.off('message-status-updated');
        socket.off('message_updated');
        socket.off('message_deleted');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('typing');
        socket.off('stop_typing');
        socket.off('request_accepted');
        socket.off('new_message_request');
    };
  }, [socket, activeConversation, user]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
        setMessages([]); // Clear previous messages immediately
        if (activeConversation.isTemp) {
            setMessages([]);
        } else {
            fetchMessages(activeConversation._id);
            // We pass null for messageIds to mark ALL as read, or handle in backend
            markAsRead(activeConversation._id);
            setIsOtherTyping(false);
        }
    } else {
        setMessages([]);
    }
  }, [activeConversation?._id]);

  const markAsRead = async (convId, specificMessageIds = null) => {
    try {
        if (!token) return;
        // If specificMessageIds is provided, we might want to use a different endpoint or just the general one 
        // which usually marks all as read up to now.
        // For now, using the general 'read' endpoint which marks all unread as seen.
        
        await fetch(`${API_URL}/api/messages/${convId}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // Emit socket event to notify sender
        // The backend endpoint likely handles this, but if not:
        // socket.emit('mark-seen', { conversationId: convId, ... });
        // Based on previous work, the backend controller emits 'mark-seen' or updates status.
        // Actually, the backend `markAsRead` should emit the event.
        
    } catch (err) {
        console.error(err);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
      try {
          if (!token) return;
          const res = await fetch(`${API_URL}/api/message/${messageId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ content: newContent })
          });
          
          const data = await res.json();
          if (data.success) {
              // Update local state
              setMessages(prev => prev.map(msg => 
                  msg._id === messageId ? { ...msg, content: newContent, isEdited: true } : msg
              ));
          } else {
              alert(data.error || "Failed to edit message");
          }
      } catch (err) {
          console.error(err);
          alert("Error editing message");
      }
  };

  const handleDeleteMessage = async (messageId) => {
       if (!confirm("Are you sure you want to delete this message for everyone?")) return;
       
       try {
           if (!token) return;
           const res = await fetch(`${API_URL}/api/message/${messageId}?deleteForEveryone=true`, {
               method: 'DELETE',
               headers: { Authorization: `Bearer ${token}` }
           });
           
           const data = await res.json();
           if (data.success) {
               // Remove from local state
               setMessages(prev => prev.filter(msg => msg._id !== messageId));
           } else {
               alert(data.error || "Failed to delete message");
           }
       } catch (err) {
           console.error(err);
           alert("Error deleting message");
       }
   };

  const handleBlockUser = async (userId) => {
    if (!confirm("Are you sure you want to block this user? You won't receive messages from them anymore.")) return;

    try {
        if (!token) return;
        const res = await fetch(`${API_URL}/api/users/block/${userId}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
             // Update local state to reflect block immediately
             if (activeConversation) {
                 setActiveConversation(prev => ({ ...prev, status: 'blocked' }));
             }
             
             alert("User blocked successfully");
             fetchConversations();
         } else {
            alert(data.error || "Failed to block user");
        }
    } catch (err) {
        console.error(err);
        alert("Error blocking user");
    }
  };

  const handleTyping = (isTyping) => {
      if (!socket || !activeConversation) return;
      
      const event = isTyping ? 'typing' : 'stop_typing';
      socket.emit(event, { 
          conversationId: activeConversation._id,
          recipientId: activeConversation.participants.find(p => p._id !== user._id)._id
      });
  };

  const fetchConversations = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setConversations(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setMeetings(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (convId) => {
    setLoadingMessages(true);
    try {
      if (!token) return;
      const res = await fetch(`${API_URL}/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content, replyToId = null) => {
    if (!activeConversation) return;

    try {
      if (!token) return;
      const recipient = activeConversation.participants.find(p => p._id !== user._id);
      
      const payload = {
        recipientId: recipient._id,
        content: content
      };
      
      if (replyToId) {
        payload.replyTo = replyToId;
      }

      const res = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          const sentMessage = { ...data.data, sender: user }; // Optimistic
          setMessages([...messages, sentMessage]);
          
          // If it was a temp conversation, update it with the real one from response (if available)
          // The message object usually contains the conversation ID
          if (activeConversation.isTemp) {
              // We need to fetch the new conversation details or construct it
              // For simplicity, let's just update the ID and status
              const newConvId = sentMessage.conversation || sentMessage.conversationId;
              const updatedConv = { 
                  ...activeConversation, 
                  _id: newConvId, 
                  isTemp: false, 
                  lastMessage: sentMessage,
                  status: 'pending' // Defaults to pending on creation
              };
              setActiveConversation(updatedConv);
              
              // Add to conversations list
              setConversations(prev => [updatedConv, ...prev]);
          } else {
              // Update conversation list locally
              updateConversationWithNewMessage(sentMessage);
          }
        } else {
            // Handle error (e.g., must follow to message)
            alert(data.error || "Failed to send message");
        }
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while sending the message");
    }
  };

  const handleAcceptRequest = async (convId) => {
    try {
        if (!token) return;
        // Correct endpoint: /api/messages/:id/accept
        const res = await fetch(`${API_URL}/api/messages/${convId}/accept`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            // Update local state
            setActiveConversation(prev => ({ ...prev, status: 'accepted' }));
            setConversations(prev => prev.map(c => c._id === convId ? { ...c, status: 'accepted' } : c));
            
            // If socket doesn't update it fast enough
            fetchConversations();
        } else {
             console.error('Failed to accept request:', data.error);
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleDeclineRequest = async (convId) => {
    try {
        if (!token) return;
        // Correct endpoint: /api/messages/:id/decline
        const res = await fetch(`${API_URL}/api/messages/${convId}/decline`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
             // Update local state - maybe remove from list or show as declined
             setActiveConversation(prev => ({ ...prev, status: 'declined' }));
             setConversations(prev => prev.map(c => c._id === convId ? { ...c, status: 'declined' } : c));
        } else {
            console.error('Failed to decline request:', data.error);
        }
    } catch (err) {
        console.error(err);
    }
  };

  // Helper to update conversation list when new message arrives/sent
  const updateConversationWithNewMessage = (message) => {
    setConversations(prevConvs => {
        const convIndex = prevConvs.findIndex(c => c._id === message.conversation || c._id === message.conversationId);
        if (convIndex > -1) {
            const updatedConv = { ...prevConvs[convIndex], lastMessage: message, updatedAt: new Date().toISOString() };
            // Move to top
            const newConvs = [...prevConvs];
            newConvs.splice(convIndex, 1);
            return [updatedConv, ...newConvs];
        }
        // If conversation not found (new one?), re-fetch might be safer or just ignore
        return prevConvs;
    });
  };

  if (loading || authLoading) {
    return (
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 flex gap-4 overflow-hidden">
        
        {/* Left Panel: Chat List */}
        <ChatList 
            conversations={conversations} 
            activeConversation={activeConversation} 
            setActiveConversation={setActiveConversation} 
            currentUser={user}
            meetings={meetings}
            onOpenScheduleModal={(participant = null) => {
              setMeetingModalParticipant(participant);
              setIsMeetingModalOpen(true);
            }}
        />

        {/* Right Panel: Chat Window */}
        {activeConversation ? (
            <ChatWindow 
                conversation={activeConversation}
                currentUser={user}
                messages={messages}
                meetings={meetings}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                onBlockUser={handleBlockUser}
                loadingMessages={loadingMessages}
                onTyping={handleTyping}
                isOtherTyping={isOtherTyping}
                onOpenScheduleModal={(participant) => {
                  setMeetingModalParticipant(participant);
                  setIsMeetingModalOpen(true);
                }}
            />
        ) : (
            <div className="w-2/3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col items-center justify-center text-gray-400 h-full">
                <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Your Messages</h3>
                <p className="max-w-xs text-center text-gray-500">
                    Select a conversation from the list or start a new one to begin messaging.
                </p>
            </div>
        )}
      </div>

      <ScheduleMeetingModal 
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        initialParticipant={meetingModalParticipant}
        connectedUsers={conversations
          .filter(c => c.status === 'accepted' && c.type !== 'group')
          .map(c => c.participants.find(p => p._id !== user._id))
          .filter(Boolean)
        }
        onMeetingCreated={(newMeeting) => {
          setMeetings(prev => [...prev, newMeeting]);
          console.log("Redirecting to:", newMeeting.roomId || newMeeting.meetingCode);
          router.push(`/meet/${newMeeting.roomId}`);
        }}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-background overflow-hidden flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <Loader className="animate-spin h-8 w-8 text-primary" />
        </div>
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
}
