'use client';
import { API_URL } from '@/utils/api';

import { useState } from 'react';
import { Send, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function QuestionForm({ targetId, targetType }) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true); // Default to anon
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Check if user is logged in if they want to ask non-anonymously
    if (!isAnonymous && !user) {
      addToast('You must be logged in to ask as yourself.', 'error');
      return;
    }
    
    // Check if user is logged in at all (assuming auth required for spam prevention)
    if (!user) {
      addToast('Please log in to ask a question.', 'info');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content,
          targetId,
          targetType,
          isAnonymous
        })
      });

      const data = await res.json();

      if (data.success) {
        addToast('Question sent! It will appear once answered.', 'success');
        setContent('');
      } else {
        addToast(data.error || 'Failed to send question', 'error');
      }
    } catch (err) {
      addToast('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask a Question</h3>
      <p className="text-sm text-gray-500 mb-4">
        Ask anything! Your question will be private until answered.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What would you like to know?"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px] text-gray-800 mb-3"
          maxLength={500}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isAnonymous ? 'bg-gray-800 border-gray-800' : 'border-gray-300'}`}>
                {isAnonymous && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <input 
                type="checkbox" 
                checked={isAnonymous} 
                onChange={() => setIsAnonymous(!isAnonymous)} 
                className="hidden"
              />
              <span className={`text-sm font-medium ${isAnonymous ? 'text-gray-900' : 'text-gray-500'}`}>
                Ask Anonymously
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : (
              <>
                <Send className="h-4 w-4" />
                Ask
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
