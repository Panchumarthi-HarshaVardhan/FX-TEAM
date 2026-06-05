import { Check, X, ShieldAlert } from 'lucide-react';

export default function MessageRequest({ conversation, currentUser, onAccept, onDecline }) {
  const sender = conversation.participants.find(p => p._id !== currentUser?._id) || {};
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center h-full">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center">
        
        {/* Profile */}
        <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-white shadow-sm">
            {sender.profileImage ? (
                <img src={sender.profileImage} alt={sender.name} className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-primary text-2xl font-bold">
                    {sender.name?.charAt(0)}
                </div>
            )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{sender.name}</h2>
        <p className="text-sm text-gray-500 mb-2 capitalize">
            {sender.role} {sender.startup?.name && `at ${sender.startup.name}`}
        </p>

        <div className="bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full font-medium mb-6">
            Message Request
        </div>

        {/* Message Preview */}
        <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 italic">&quot;{conversation.lastMessage?.content}&quot;</p>
        </div>

        <div className="flex flex-col w-full gap-3">
            <button 
                onClick={() => onAccept(conversation._id)}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
                <Check className="h-4 w-4" />
                Accept Request
            </button>
            
            <button 
                onClick={() => onDecline(conversation._id)}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
                <X className="h-4 w-4" />
                Decline
            </button>
        </div>

        <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 text-left bg-gray-50 p-3 rounded-lg">
            <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
                If you accept, you can chat instantly. If you decline, this person won&apos;t be able to message you again unless you message them first.
            </p>
        </div>
      </div>
    </div>
  );
}
