import { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Phone, Video, Info, Smile, Paperclip, Check, CheckCheck, Edit2, Trash2, X, Reply, Ban, Calendar, ListVideo } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MessageRequest from './MessageRequest';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/utils/api';

export default function ChatWindow({ 
  conversation, 
  currentUser, 
  messages, 
  onSendMessage, 
  onEditMessage,
  onDeleteMessage,
  onAcceptRequest, 
  onDeclineRequest,
  loadingMessages,
  onTyping,
  isOtherTyping,
  meetings = [],
  onOpenScheduleModal
}) {
  const router = useRouter();
  const { token } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(null); // messageId
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMeetingHistory, setShowMeetingHistory] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const isGroup = conversation?.type === 'group' || conversation?.isGroup;
  const otherParticipant = conversation?.participants?.find(p => p._id !== currentUser?._id) || {};
  const chatName = isGroup ? (conversation?.groupName || 'Group Chat') : (otherParticipant.name || 'User');
  const isPending = conversation?.status === 'pending';
  const isAccepted = conversation?.status === 'accepted';
  const isDeclined = conversation?.status === 'declined';
  const isBlocked = conversation?.status === 'blocked';
  
  const iAmInitiator = conversation?.initiator === currentUser?._id;
  const isIncomingRequest = isPending && !iAmInitiator;

  // Auto-scroll to bottom
  useEffect(() => {
    if (!editingMessageId) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOtherTyping, editingMessageId]);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (onTyping) {
        onTyping(true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        // Set new timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage, replyingTo?._id);
    setNewMessage('');
    setReplyingTo(null);
    if (onTyping) {
        onTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleReply = (msg) => {
    setReplyingTo(msg);
    // Focus input
    const input = document.querySelector('input[type="text"]');
    if (input) input.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
    setShowDeleteMenu(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleSaveEdit = () => {
    if (editContent.trim() !== '') {
        onEditMessage(editingMessageId, editContent);
        setEditingMessageId(null);
        setEditContent('');
    }
  };

  const handleDelete = (msgId) => {
      onDeleteMessage(msgId);
      setShowDeleteMenu(null);
  };

  const handleInstantVideoMeet = async () => {
    if (!token) return;
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      
      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `Instant Meeting with ${currentUser.name}`,
          agenda: 'Instant Video Meeting',
          scheduledDate: now.toISOString().split('T')[0],
          startTime: now.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          participants: [otherParticipant._id]
        })
      });
      const data = await res.json();
      if (data.success) {
        onSendMessage(`I've started an instant video meeting! Join here: /meet/${data.data.roomId}`);
        router.push(`/meet/${data.data.roomId}`);
      } else {
        alert(data.error || 'Failed to start meeting');
      }
    } catch (err) {
      console.error(err);
      alert('Error starting meeting');
    }
  };

  const relevantMeetings = meetings.filter(m => 
    m.participants?.some(p => p.userId?._id === otherParticipant._id) || 
    m.hostId?._id === otherParticipant._id
  );

  if (isIncomingRequest) {
    return (
        <MessageRequest 
            conversation={conversation} 
            currentUser={currentUser} 
            onAccept={onAcceptRequest} 
            onDecline={onDeclineRequest} 
        />
    );
  }

  return (
    <div className="w-2/3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden relative flex-shrink-0">
            {isGroup ? (
              <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-750 font-bold text-sm">
                {conversation.groupName ? conversation.groupName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() : 'GP'}
              </div>
            ) : otherParticipant.profileImage ? (
              <img src={otherParticipant.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold">
                {chatName.charAt(0)}
              </div>
            )}
            {!isGroup && otherParticipant.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-heading">{chatName}</h3>
            <div className="flex items-center text-xs text-gray-500 space-x-2">
                {isGroup ? (
                    <span className="truncate max-w-[280px]">
                      Members: {conversation?.participants?.map(p => p.name || p.fullName || 'User').join(', ')}
                    </span>
                ) : (
                    <>
                      <span className="capitalize">{otherParticipant.role || 'User'}</span>
                      {otherParticipant.isOnline && (
                          <span className="text-green-500 font-medium ml-1">Online</span>
                      )}
                      {!otherParticipant.isOnline && otherParticipant.lastSeen && (
                          <span className="text-gray-400 ml-1" suppressHydrationWarning>
                              Last seen {formatDistanceToNow(new Date(otherParticipant.lastSeen), { addSuffix: true })}
                          </span>
                      )}
                    </>
                )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-400">
            {/* Meeting Actions */}
            {!isGroup && !isBlocked && !isDeclined && !isIncomingRequest && (
              <>
                <button 
                    onClick={handleInstantVideoMeet}
                    className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full transition"
                    title="Start Video Meet"
                >
                    <Video className="h-5 w-5" />
                </button>

                <button 
                    onClick={() => setShowMeetingHistory(!showMeetingHistory)}
                    className={`p-2 hover:bg-blue-50 hover:text-blue-600 rounded-full transition ${showMeetingHistory ? 'bg-blue-50 text-blue-600' : ''}`}
                    title="View Meetings"
                >
                    <ListVideo className="h-5 w-5" />
                </button>
              </>
            )}

            <button 
                onClick={() => onBlockUser && onBlockUser(otherParticipant._id)}
                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition"
                title="Block User"
            >
                <Ban className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <Info className="h-5 w-5" />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {showMeetingHistory ? (
          <div className="bg-white p-4 rounded-xl shadow-sm h-full overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Meeting History with {otherParticipant.name}</h3>
              <button onClick={() => setShowMeetingHistory(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {relevantMeetings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">No previous or upcoming meetings.</div>
            ) : (
              <div className="space-y-3">
                {relevantMeetings.map(m => (
                  <div key={m._id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{m.title}</h4>
                      <div className="text-xs text-gray-500">{new Date(m.scheduledDate).toLocaleDateString()} • {m.startTime} - {m.endTime}</div>
                    </div>
                    <button onClick={() => router.push(`/meet/${m.roomId}`)} className="text-xs font-bold text-primary hover:underline px-3 py-1.5 bg-blue-50 rounded-lg">Join / View</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : loadingMessages ? (
            <div className="flex justify-center pt-10">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        ) : !messages || messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                <div className="h-20 w-20 bg-gray-200 rounded-full mb-4"></div>
                <p>No messages yet</p>
            </div>
        ) : (
            (messages || []).map((msg, index) => {
                if (!msg) return null;
                const isMe = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
                const showAvatar = !isMe && (index === 0 || messages[index-1]?.sender?._id !== msg.sender?._id);
                const isEditing = editingMessageId === msg._id;
                
                return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start items-end space-x-2'} group relative`}>
                        {!isMe && (
                            <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mb-1" style={{ opacity: showAvatar ? 1 : 0 }} title={msg.sender?.name || otherParticipant.name}>
                                {msg.sender?.profileImage ? (
                                    <img src={msg.sender.profileImage} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary text-xs font-bold">
                                        {(msg.sender?.name || otherParticipant.name || '?').charAt(0)}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {isMe && !isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mr-2 space-x-1">
                                <button 
                                    onClick={() => handleReply(msg)}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                    title="Reply"
                                >
                                    <Reply className="h-3 w-3" />
                                </button>
                                <button 
                                    onClick={() => handleStartEdit(msg)}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                    title="Edit"
                                >
                                    <Edit2 className="h-3 w-3" />
                                </button>
                                <button 
                                    onClick={() => setShowDeleteMenu(showDeleteMenu === msg._id ? null : msg._id)}
                                    className="p-1 hover:bg-red-100 rounded-full text-gray-500 hover:text-red-500 relative"
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {showDeleteMenu === msg._id && (
                                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-20">
                                            <div 
                                                className="px-4 py-2 hover:bg-red-50 text-red-600 text-xs font-medium cursor-pointer whitespace-nowrap"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(msg._id);
                                                }}
                                            >
                                                Delete Message
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className={`max-w-[70%] relative`}>
                            <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                isMe 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                            }`}>
                                {!isMe && isGroup && (
                                    <div className="text-[11px] font-bold text-primary mb-1">
                                        {msg.sender?.name || 'User'}
                                    </div>
                                )}
                                {msg.replyTo && (
                                    <div className={`mb-2 p-2 rounded text-xs border-l-2 ${
                                        isMe 
                                        ? 'bg-white/10 border-white/50 text-white/80' 
                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                    }`}>
                                        <div className="font-bold mb-0.5">
                                            {msg.replyTo.sender?._id === currentUser?._id ? 'You' : msg.replyTo.sender?.name}
                                        </div>
                                        <div className="line-clamp-1 opacity-80">
                                            {msg.replyTo.content}
                                        </div>
                                    </div>
                                )}
                                {isEditing ? (
                                    <div className="flex flex-col space-y-2 min-w-[200px]">
                                        <input
                                            type="text"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-white/10 text-white border border-white/30 rounded px-2 py-1 text-sm focus:outline-none focus:border-white"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit();
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                        />
                                        <div className="flex justify-end space-x-2 text-xs">
                                            <button onClick={handleCancelEdit} className="text-white/70 hover:text-white">Cancel</button>
                                            <button onClick={handleSaveEdit} className="font-bold hover:text-white">Save</button>
                                        </div>
                                    </div>
                                 ) : (
                                    <>
                                        {msg.type === 'image' && msg.mediaUrl ? (
                                            <div className="mb-2 rounded-lg overflow-hidden max-w-[200px]">
                                                <img src={msg.mediaUrl} alt="Shared image" className="w-full h-auto object-cover" />
                                            </div>
                                        ) : null}
                                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    </>
                                 )}
                             </div>
                            
                            <div className={`flex items-center space-x-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] text-gray-400 flex items-center">
                                    {msg.isEdited && <span className="mr-1 italic">edited •</span>}
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </span>
                                {isMe && (
                                    <span title={msg.status}>
                                        {msg.status === 'seen' ? (
                                            <CheckCheck className="h-3 w-3 text-blue-500" />
                                        ) : msg.status === 'delivered' ? (
                                            <CheckCheck className="h-3 w-3 text-gray-400" />
                                        ) : (
                                            <Check className="h-3 w-3 text-gray-400" />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!isMe && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-2 space-x-1">
                                <button 
                                    onClick={() => handleReply(msg)}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                    title="Reply"
                                >
                                    <Reply className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })
        )}
        
        {isOtherTyping && (
            <div className="flex justify-start items-end space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mb-1">
                    {isGroup ? (
                        <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-650 text-[10px] font-bold">
                            ...
                        </div>
                    ) : otherParticipant.profileImage ? (
                        <img src={otherParticipant.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary text-xs font-bold">
                            {otherParticipant.name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isBlocked || isDeclined ? (
          <div className="p-4 bg-gray-100 text-center text-gray-500 text-sm border-t border-gray-200">
              {isBlocked ? 'You cannot message this user.' : 'This conversation has been declined.'}
          </div>
      ) : (
        <div className="p-3 bg-white border-t border-gray-100">
            {isPending && iAmInitiator && (
                <div className="mb-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs rounded-lg flex items-center justify-center">
                    Message request pending. They will see your message once they accept.
                </div>
            )}
            
            {replyingTo && (
                <div className="mb-2 px-3 py-2 bg-gray-50 border-l-4 border-primary rounded-r-lg flex items-center justify-between">
                    <div className="overflow-hidden pr-4">
                        <div className="text-xs font-bold text-primary mb-0.5">
                            Replying to {replyingTo.sender?._id === currentUser?._id ? 'yourself' : replyingTo.sender?.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                            {replyingTo.content}
                        </div>
                    </div>
                    <button onClick={cancelReply} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                <button type="button" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                    <Paperclip className="h-5 w-5" />
                </button>
                
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 outline-none max-h-32 py-1"
                        suppressHydrationWarning
                    />
                    <button type="button" className="ml-2 text-gray-400 hover:text-gray-600">
                        <Smile className="h-5 w-5" />
                    </button>
                </div>

                <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-primary text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
      )}
    </div>
  );
}
