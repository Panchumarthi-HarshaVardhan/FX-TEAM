import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Video } from 'lucide-react';
import { API_URL } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  initialParticipant = null,
  connectedUsers = [],
  onMeetingCreated
}) {
  const { token, user } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialParticipant) {
        setSelectedParticipants([initialParticipant]);
        setIsLocked(true);
      } else {
        setSelectedParticipants([]);
        setIsLocked(false);
      }
      
      setTitle('');
      setAgenda('');
    }
  }, [isOpen, initialParticipant]);

  const toggleParticipant = (u) => {
    if (isLocked) return;
    if (selectedParticipants.some(p => p._id === u._id)) {
      setSelectedParticipants(selectedParticipants.filter(p => p._id !== u._id));
    } else {
      setSelectedParticipants([...selectedParticipants, u]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

      const res = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || 'Instant Meeting',
          agenda: agenda || 'Quick Connect',
          scheduledDate: now.toISOString().split('T')[0],
          startTime: now.toTimeString().slice(0, 5),
          endTime: end.toTimeString().slice(0, 5),
          participants: selectedParticipants.map(p => p._id)
        })
      });
      
      const data = await res.json();
      console.log("Meeting create response:", data);
      
      if (data.success) {
        if (!data.meeting || !data.meeting.roomId) {
            addToast('Meeting created but roomId missing', 'error');
            return;
        }
        
        console.log("Redirecting host to:", data.meeting.roomId);
        addToast('Meeting scheduled successfully!', 'success');
        if (onMeetingCreated) onMeetingCreated(data.meeting);
        onClose();
      } else {
        addToast(data.error || 'Failed to schedule meeting', 'error');
      }
    } catch (err) {
      addToast('An error occurred while scheduling', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Create Meeting
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="meeting-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Participants */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Participants</label>
              {isLocked ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={initialParticipant?.profileImage || 'https://via.placeholder.com/40'} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-200" />
                    <span className="font-semibold text-gray-800">{initialParticipant?.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsLocked(false)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Add more participants
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 bg-gray-50">
                  {connectedUsers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No connected users available.</p>
                  ) : (
                    connectedUsers.map(u => {
                      const isSelected = selectedParticipants.some(p => p._id === u._id);
                      return (
                        <div 
                          key={u._id}
                          onClick={() => toggleParticipant(u)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-gray-100 border border-transparent'}`}
                        >
                          <input type="checkbox" checked={isSelected} readOnly className="rounded text-primary focus:ring-primary" />
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-primary font-bold text-xs">{u.name?.charAt(0)}</div>
                            )}
                          </div>
                          <span className={`text-sm ${isSelected ? 'font-bold text-primary' : 'font-medium text-gray-700'}`}>{u.name}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting Title (Optional)</label>
              <input 
                type="text" 
                placeholder="E.g. Investment Discussion"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>


            {/* Agenda */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Agenda</label>
              <textarea 
                rows="3"
                placeholder="What will you discuss?"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              ></textarea>
            </div>

          </form>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="meeting-form"
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            {submitting ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
