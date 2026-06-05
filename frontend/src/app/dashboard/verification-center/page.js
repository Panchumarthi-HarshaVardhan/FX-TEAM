'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/utils/api';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Upload, Link as LinkIcon, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { uploadToCloudinary } from '@/utils/cloudinary'; // Or your local upload helper if it uses that, but this is the provided utility in the repo
import { useToast } from '@/context/ToastContext';

export default function VerificationCenter() {
  const { user, token, refreshUser, loading } = useAuth();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    documentUrl: '', // founder: Aadhaar/Passport
    panCardUrl: '', // both
    linkedinUrl: '', // both
    companyWebsite: '', // investor
    investmentProofUrl: '' // investor
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'founder' && user.founderVerificationData) {
        setFormData(prev => ({ ...prev, ...user.founderVerificationData }));
      } else if (user.role === 'investor' && user.investorVerificationData) {
        setFormData(prev => ({ ...prev, ...user.investorVerificationData }));
      }
    }
  }, [user]);

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      // Let's use the local API endpoint for generic uploads if cloudinary fails or isn't set up
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, [field]: data.url }));
        addToast('Document uploaded temporarily. Don\'t forget to submit!', 'success');
      } else {
        addToast('Upload failed', 'error');
      }
    } catch (err) {
      addToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setSubmitting(true);
    try {
      const endpoint = user.role === 'founder' 
        ? `${API_URL}/api/verification/founder` 
        : `${API_URL}/api/verification/investor`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        addToast(data.message, 'success');
        await refreshUser();
      } else {
        addToast(data.message || 'Submission failed', 'error');
      }
    } catch (err) {
      addToast('Submission failed due to network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const status = user.role === 'founder' ? user.founderVerificationStatus : user.investorVerificationStatus;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-24">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6 border-b pb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
              <p className="text-gray-500">Verify your identity to unlock premium features and build trust.</p>
            </div>
          </div>

          {/* Status Banner */}
          {status === 'approved' && (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-center gap-3 mb-8">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-bold text-green-900">You are verified!</h3>
                <p className="text-sm">Your documents have been approved. You now have full access to FounderX.</p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-center gap-3 mb-8">
              <Loader className="h-6 w-6 text-yellow-600 animate-spin" />
              <div>
                <h3 className="font-bold text-yellow-900">Verification Pending</h3>
                <p className="text-sm">Your documents are under review. This usually takes 24-48 hours.</p>
              </div>
            </div>
          )}

          {status === 'rejected' && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 mb-8">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-bold text-red-900">Verification Rejected</h3>
                <p className="text-sm mb-2">There was an issue with your documents. Please review our notes and re-upload.</p>
                {user.adminVerificationNotes && (
                  <div className="bg-white/50 p-3 rounded border border-red-100 text-sm italic">
                    " {user.adminVerificationNotes} "
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          {status !== 'approved' && status !== 'pending' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {user.role === 'founder' && (
                <>
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <label className="block font-semibold text-gray-900 mb-2">Aadhaar or Passport Document</label>
                    <p className="text-sm text-gray-500 mb-4">Upload a clear photo or PDF of your government ID.</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => handleUpload(e, 'documentUrl')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {formData.documentUrl && <p className="mt-2 text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4"/> Document uploaded successfully</p>}
                  </div>
                </>
              )}

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <label className="block font-semibold text-gray-900 mb-2">PAN Card</label>
                <p className="text-sm text-gray-500 mb-4">Upload a clear photo or PDF of your PAN Card.</p>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={(e) => handleUpload(e, 'panCardUrl')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {formData.panCardUrl && <p className="mt-2 text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4"/> PAN Card uploaded successfully</p>}
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <label className="block font-semibold text-gray-900 mb-2">LinkedIn Profile URL</label>
                <input 
                  type="url" 
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData(prev => ({...prev, linkedinUrl: e.target.value}))}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              {user.role === 'investor' && (
                <>
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <label className="block font-semibold text-gray-900 mb-2">Company Website</label>
                    <input 
                      type="url" 
                      value={formData.companyWebsite}
                      onChange={(e) => setFormData(prev => ({...prev, companyWebsite: e.target.value}))}
                      placeholder="https://yourfund.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <label className="block font-semibold text-gray-900 mb-2">Investment Proof Document</label>
                    <p className="text-sm text-gray-500 mb-4">Upload proof of previous investments or fund details.</p>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => handleUpload(e, 'investmentProofUrl')}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {formData.investmentProofUrl && <p className="mt-2 text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4"/> Investment proof uploaded successfully</p>}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-md"
              >
                {(submitting || uploading) ? <Loader className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {uploading ? 'Uploading File...' : submitting ? 'Submitting...' : 'Submit Verification Request'}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
