'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { API_URL } from '@/utils/api';

export default function SendInterestRequestModal({ isOpen, onClose, startup }) {
  const [message, setMessage] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [interestedAmount, setInterestedAmount] = useState('');
  const [investmentType, setInvestmentType] = useState('Equity');
  const [meetingRequest, setMeetingRequest] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startup) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/interest-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: startup._id,
          message,
          investmentRange,
          interestedAmount: interestedAmount || investmentRange,
          investmentType,
          meetingRequest,
          attachmentUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('Interest request sent successfully!', 'success');
        setMessage('');
        setInvestmentRange('');
        setInterestedAmount('');
        setInvestmentType('Equity');
        setMeetingRequest(false);
        setAttachmentUrl('');
        onClose(true);
      } else {
        addToast(data.error || 'Failed to send request', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const founderName = startup?.founderId?.fullName || startup?.founderId?.name || startup?.founderName || 'Founder';

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Send Interest Request</h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Startup Name</label>
              <input
                type="text"
                value={startup?.name || ''}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Founder Name</label>
              <input
                type="text"
                value={founderName}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the founder why you're interested..."
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interested Amount</label>
              <input
                type="text"
                value={interestedAmount}
                onChange={(e) => setInterestedAmount(e.target.value)}
                placeholder="e.g. $50,000"
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Investment Type</label>
              <select
                value={investmentType}
                onChange={(e) => setInvestmentType(e.target.value)}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                required
              >
                <option value="Equity">Equity</option>
                <option value="SAFE">SAFE</option>
                <option value="Convertible Note">Convertible Note</option>
                <option value="Debt">Debt</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Investment Range (Optional)</label>
            <select
              value={investmentRange}
              onChange={(e) => setInvestmentRange(e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="">Select a range</option>
              <option value="$10k-$50k">$10k - $50k</option>
              <option value="$50k-$100k">$50k - $100k</option>
              <option value="$100k-$250k">$100k - $250k</option>
              <option value="$250k-$500k">$250k - $500k</option>
              <option value="$500k+">$500k+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pitch Deck / Attachment Link (Optional)</label>
            <input
              type="text"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="meetingRequest"
              checked={meetingRequest}
              onChange={(e) => setMeetingRequest(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="meetingRequest" className="text-sm font-medium text-gray-700 cursor-pointer">
              Request a meeting with the founder
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
