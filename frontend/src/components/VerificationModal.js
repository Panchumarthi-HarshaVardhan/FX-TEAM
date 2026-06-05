'use client';
import { API_URL } from '@/utils/api';

import { useState } from 'react';
import { X, Loader, Upload, Link as LinkIcon, ShieldCheck } from 'lucide-react';

export default function VerificationModal({ isOpen, onClose, targetType, targetId, onSuccess }) {
  const [type, setType] = useState('linkedin');
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          type,
          proof
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Verification request submitted successfully! We will review it shortly.');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <h2 className="text-xl font-bold text-gray-900">Get Verified</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6 text-sm">
            Verify your identity to build trust with investors and founders. 
            {targetType === 'Startup' ? ' Verified startups get higher visibility.' : ' Verified users get a badge on their profile.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('linkedin')}
                  className={`p-3 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                    type === 'linkedin' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  LinkedIn
                </button>
                <button
                  type="button"
                  onClick={() => setType('domain_email')}
                  className={`p-3 rounded-xl border text-sm font-medium transition flex items-center justify-center gap-2 ${
                    type === 'domain_email' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Domain Email
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'linkedin' ? 'LinkedIn Profile URL' : 'Work Email Address'}
              </label>
              <input
                type={type === 'linkedin' ? 'url' : 'email'}
                required
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder={type === 'linkedin' ? 'https://linkedin.com/in/username' : 'you@company.com'}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                {type === 'linkedin' 
                  ? 'We will check if the profile matches your account details.' 
                  : 'We will send a verification link to this email (Manual check for now).'}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="h-5 w-5 animate-spin" />}
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
