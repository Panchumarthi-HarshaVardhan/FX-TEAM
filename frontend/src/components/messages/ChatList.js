import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Search, User, Plus, Video, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatList({ 
  conversations, 
  activeConversation, 
  setActiveConversation, 
  currentUser,
  meetings = [],
  onOpenScheduleModal
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('messages'); // 'messages', 'requests', 'meetings'
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to get the other participant
  const getOtherParticipant = (conv) => {
    return conv?.participants?.find(p => p._id !== currentUser?._id) || {};
  };

  // Debug log
  console.log('[DEBUG] ChatList: conversations', conversations, 'currentUser', currentUser?._id);

  // Filter conversations based on tab and search
  const filteredConversations = (conversations || []).filter(conv => {
    const other = getOtherParticipant(conv);
    const matchesSearch = other.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          other.startup?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status check for tabs
    // Note: If I am the initiator, a 'pending' conversation is just a sent request, I should probably see it in messages but maybe marked?
    // Or maybe 'requests' tab is ONLY for incoming requests.
    // Logic: 
    // - Accepted: Show in Messages
    // - Pending AND I am NOT initiator: Show in Requests
    // - Pending AND I AM initiator: Show in Messages (as sent request) or separate? Let's put in Messages for now.
    
    if (activeTab === 'messages') {
        // Show accepted OR (pending and I initiated it)
        const isAccepted = conv.status === 'accepted';
        const isMySentRequest = conv.status === 'pending' && conv.initiator === currentUser?._id;
        return matchesSearch && (isAccepted || isMySentRequest);
    } else {
        // Show pending AND I did NOT initiate it (Incoming requests)
        const isIncomingRequest = conv.status === 'pending' && conv.initiator !== currentUser?._id;
        return matchesSearch && isIncomingRequest;
    }
  });

  const filteredMeetings = (meetings || []).filter(m => 
    m && (
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meetingCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.hostId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getMeetingStatus = (m) => {
    if (m.status === 'cancelled') return 'cancelled';
    
    // Check scheduledDate exists and is a valid format
    if (!m.scheduledDate || !m.startTime || !m.endTime) return 'upcoming';
    
    const dateStr = m.scheduledDate.split('T')[0];
    const start = new Date(`${dateStr}T${m.startTime}`);
    const end = new Date(`${dateStr}T${m.endTime}`);
    const now = new Date();
    
    if (now >= start && now <= end) return 'ongoing';
    if (now > end) return 'completed';
    return 'upcoming';
  };

  const upcomingMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'upcoming');
  const ongoingMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'ongoing');
  const completedMeetings = filteredMeetings.filter(m => getMeetingStatus(m) === 'completed' || getMeetingStatus(m) === 'cancelled');

  // Calculate unread requests count
  const requestsCount = conversations.filter(conv => 
    conv.status === 'pending' && conv.initiator !== currentUser?._id
  ).length;

  // Universal Meeting Search Logic
  const getMeetingCodeFromSearch = (query) => {
    const q = query.trim();
    if (!q) return null;
    
    // Check if it's a code like abc-defg-hij
    const codeRegex = /^[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}$/i;
    if (codeRegex.test(q)) return q.toLowerCase();
    
    // Check if it's a meeting link
    if (q.includes('/meet/')) {
      const parts = q.split('/meet/');
      const code = parts[1]?.split('?')[0]?.trim();
      if (code) return code.toLowerCase();
    }
    
    return null;
  };

  const detectedMeetingCode = getMeetingCodeFromSearch(searchQuery);

  return (
    <div className="w-1/3 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-heading">Messages</h2>
            {/* Optional: New Message Button */}
        </div>

        {/* Search */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                suppressHydrationWarning
            />
        </div>

        {/* Create Meeting Button */}
        <button 
          onClick={() => onOpenScheduleModal && onOpenScheduleModal()}
          className="w-full py-2 flex items-center justify-center gap-2 bg-blue-50 text-primary text-sm font-bold rounded-lg hover:bg-blue-100 transition border border-blue-100"
        >
          <Plus className="w-4 h-4" /> Create Meeting
        </button>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                    activeTab === 'messages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Chats
            </button>
            <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition flex items-center justify-center gap-2 ${
                    activeTab === 'requests' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Requests
                {requestsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {requestsCount}
                    </span>
                )}
            </button>
            <button
                onClick={() => setActiveTab('meetings')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
                    activeTab === 'meetings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                Meetings
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {detectedMeetingCode ? (
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Meeting Detected</h3>
              <p className="text-sm text-gray-500 mb-6 font-mono">{detectedMeetingCode}</p>
              <button 
                onClick={() => router.push(`/meet/${detectedMeetingCode}`)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-md flex justify-center items-center gap-2"
              >
                Join Meeting
              </button>
            </div>
          </div>
        ) : activeTab === 'meetings' ? (
          <div className="p-4 space-y-6">
            {filteredMeetings.length === 0 ? (
               <div className="text-center text-gray-500 text-sm py-8">
                 {searchQuery ? 'No meetings found.' : 'No meetings scheduled.'}
               </div>
            ) : (
              <>
                {ongoingMeetings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Ongoing
                    </h3>
                    {ongoingMeetings.map(m => <MeetingCard key={m._id} meeting={m} currentUser={currentUser} router={router} status="ongoing" />)}
                  </div>
                )}
                
                {upcomingMeetings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming</h3>
                    {upcomingMeetings.map(m => <MeetingCard key={m._id} meeting={m} currentUser={currentUser} router={router} status="upcoming" />)}
                  </div>
                )}

                {completedMeetings.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</h3>
                    {completedMeetings.map(m => <MeetingCard key={m._id} meeting={m} currentUser={currentUser} router={router} status="completed" />)}
                  </div>
                )}
              </>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No results found.' : (activeTab === 'messages' ? 'No conversations yet.' : 'No new message requests.')}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const isGroup = conv.type === 'group' || conv.isGroup;
            const other = getOtherParticipant(conv);
            const chatName = isGroup ? (conv.groupName || 'Group Chat') : (other.name || 'User');
            const isActive = activeConversation?._id === conv._id;
            const isUnread = conv.unreadCount?.[currentUser?._id] > 0;
            
            return (
              <div 
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition border-b border-gray-50 last:border-0 ${
                    isActive ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="relative h-12 w-12 flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                        {isGroup ? (
                            <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-750 font-bold text-sm">
                            {conv.groupName ? conv.groupName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase() : 'GP'}
                            </div>
                        ) : other.profileImage ? (
                            <img src={other.profileImage} alt={chatName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary font-bold">
                            {chatName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Online Status Indicator */}
                    {!isGroup && other.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {chatName}
                    </h3>
                    {conv.lastMessage?.createdAt && (
                      <span className={`text-xs flex-shrink-0 ${isUnread ? 'text-primary font-medium' : 'text-gray-400'}`} suppressHydrationWarning>
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate max-w-[85%] ${isUnread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                        {conv.status === 'pending' && conv.initiator === currentUser?._id ? (
                            <span className="italic text-gray-400">Request sent</span>
                        ) : (
                            <>
                                {conv.lastMessage?.sender === currentUser?._id ? 'You: ' : ''}
                                {conv.lastMessage?.content || 'Start a conversation'}
                            </>
                        )}
                    </p>
                    {isUnread && (
                        <div className="h-2 w-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, currentUser, router, status }) {
  const isHost = meeting.hostId?._id === currentUser?._id;
  
  const getOtherParticipants = () => {
    let others = meeting.participants?.filter(p => p.userId?._id !== currentUser?._id).map(p => p.userId?.name) || [];
    if (!isHost && meeting.hostId) others.unshift(meeting.hostId.name);
    return others.join(', ') || 'No one';
  };

  const handleJoin = (e) => {
    e.stopPropagation();
    router.push(`/meet/${meeting.roomId}`);
  };

  return (
    <div className={`p-3 rounded-xl border ${status === 'ongoing' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'} transition cursor-pointer`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`font-bold text-sm line-clamp-1 ${status === 'ongoing' ? 'text-blue-900' : 'text-gray-900'}`}>{meeting.title}</h4>
        {status === 'ongoing' && (
          <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse whitespace-nowrap">
            Live
          </span>
        )}
      </div>
      
      <div className="text-xs text-gray-500 flex items-center gap-2 mb-1.5">
        <Calendar className="w-3.5 h-3.5" />
        {new Date(meeting.scheduledDate).toLocaleDateString()}
      </div>
      <div className="text-xs text-gray-500 flex items-center gap-2 mb-2">
        <Video className="w-3.5 h-3.5" />
        {meeting.startTime} - {meeting.endTime}
      </div>
      
      <div className="text-xs text-gray-500 flex items-center gap-2 mb-3">
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className="line-clamp-1">With: {getOtherParticipants()}</span>
      </div>

      <div className="flex justify-end">
        {status === 'ongoing' ? (
          <button 
            onClick={handleJoin}
            className="w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            Join Meeting
          </button>
        ) : (
          <button 
            onClick={handleJoin}
            className="w-full py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition"
          >
            {status === 'completed' || meeting.status === 'cancelled' ? 'View Details' : 'Join / View'}
          </button>
        )}
      </div>
    </div>
  );
}
