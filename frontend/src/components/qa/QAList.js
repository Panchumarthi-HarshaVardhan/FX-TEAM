'use client';

import { useState, useEffect } from 'react';
import { User as UserIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function QAList({ targetId, targetType }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [targetId, targetType]);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/questions/${targetType}/${targetId}`);
      const data = await res.json();
      
      if (data.success) {
        setQuestions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch questions', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4 text-gray-500">Loading Q&A...</div>;

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">No answered questions yet.</p>
        <p className="text-sm text-gray-400">Be the first to ask!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <div key={q._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Question Header */}
          <div className="bg-gray-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              {q.authorId ? (
                <img 
                  src={q.authorId.profileImage || '/default-avatar.png'} 
                  alt={q.authorId.name} 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {q.authorId ? q.authorId.name : 'Anonymous'}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(q.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-5">
            <p className="text-lg text-gray-900 font-medium mb-4">
              &quot;{q.content}&quot;
            </p>

            {/* Answer */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 relative">
              <div className="absolute top-0 left-4 -translate-y-1/2 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 rotate-45 transform" />
              <div className="flex items-start gap-3">
                 {/* Maybe show who answered if targetType is Startup? For now, assume Founder. */}
                 <div className="flex-1">
                   <p className="text-sm font-bold text-blue-900 mb-1">Response:</p>
                   <p className="text-gray-700 whitespace-pre-wrap">{q.answer}</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
