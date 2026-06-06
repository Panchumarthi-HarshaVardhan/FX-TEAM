'use client';
import { API_URL } from '@/utils/api';

import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/navigation';
import { Building2, Globe, FileText, Loader, Rocket } from 'lucide-react';
import { API_URL } from '@/utils/api';

export default function CreateStartupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    oneLinePitch: '',
    description: '',
    industry: 'Technology',
    stage: 'idea',
    website: '',
    logo: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 
    'SaaS', 'AI/ML', 'Blockchain', 'CleanTech', 'FoodTech', 
    'Fashion', 'Real Estate', 'Transportation', 'Other'
  ];

  const stages = [
    { value: 'idea', label: 'Idea Stage' },
    { value: 'mvp', label: 'MVP / Prototype' },
    { value: 'revenue', label: 'Generating Revenue' },
    { value: 'scaling', label: 'Scaling' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData };

      if (!payload.contactEmail && user && user.email) {
        payload.contactEmail = user.email;
      }

      const res = await fetch(`${API_URL}/api/startups`, {
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
          router.push('/dashboard/founder');
        } else {
          setError(data.error || 'Something went wrong');
        }
      } else {
        setError('Server returned non-JSON response');
      }
    } catch (err) {
      setError('Failed to create startup');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (user && user.role !== 'founder') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <h1 className="text-2xl font-bold text-heading mb-2">Access Denied</h1>
        <p className="text-body mb-4">Only founders can register startups.</p>
        <button onClick={() => router.push('/')} className="text-primary hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-primary text-white rounded-lg">
                <Rocket className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-heading">Register Your Startup</h1>
            </div>
            <p className="text-body ml-12">Showcase your venture to investors and the world.</p>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Startup Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Acme Inc."
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                    <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Website (Optional)</label>
                  <div className="relative">
                    <input
                      type="url"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="https://acme.com"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                    <Globe className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-1">One Line Pitch</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="e.g. Uber for Dog Walking"
                  value={formData.oneLinePitch}
                  onChange={(e) => setFormData({...formData, oneLinePitch: e.target.value})}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{formData.oneLinePitch.length}/200</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-1">Description</label>
                <div className="relative">
                  <textarea
                    required
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    placeholder="Tell us more about your problem, solution, and vision..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                  <FileText className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Industry</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  >
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-heading mb-1">Stage</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                    value={formData.stage}
                    onChange={(e) => setFormData({...formData, stage: e.target.value})}
                  >
                    {stages.map(stage => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-heading mb-1">Logo URL (Optional)</label>
                <input
                  type="url"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="https://..."
                  value={formData.logo}
                  onChange={(e) => setFormData({...formData, logo: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-primary hover:bg-blue-600 transition shadow-md disabled:opacity-70"
                >
                  {isLoading && <Loader className="animate-spin h-5 w-5 mr-2" />}
                  Register Startup
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
