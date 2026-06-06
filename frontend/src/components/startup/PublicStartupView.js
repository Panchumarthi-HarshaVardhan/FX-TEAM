'use client';
import { API_URL } from '@/utils/api';

import { useState } from 'react';
import Navbar from '../Navbar';
import SendInterestRequestModal from '../SendInterestRequestModal';
import ShareButton from '../ShareButton';
import Link from 'next/link';
import { MapPin, Calendar, Globe, ShieldCheck, Users, TrendingUp, DollarSign, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import QuestionForm from '../qa/QuestionForm';
import QAList from '../qa/QAList';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import FollowButton from '../FollowButton';

export default function PublicStartupView({ startup }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const [isFollowing, setIsFollowing] = useState(
    user && startup.saves ? startup.saves.some(s => s.userId === user._id || s.userId?._id === user._id) : false
  );
  const [interestModalOpen, setInterestModalOpen] = useState(false);

  const handleMessage = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    router.push(`/messages?userId=${startup.founderId?._id || startup.founderId}`);
  };

  const handleFollowToggle = async () => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/startups/save/${startup._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Startup Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-white p-8 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-24 w-24 md:h-32 md:w-32 rounded-xl border border-gray-200 bg-white p-2 shadow-sm flex-shrink-0 flex items-center justify-center">
                {startup.logo ? (
                  <img 
                    src={startup.logo} 
                    alt={startup.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-4xl font-bold text-gray-300">
                    {startup.name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{startup.name}</h1>
                  {startup.isVerified && (
                    <div className="text-blue-500" title="Verified Startup">
                      <ShieldCheck className="h-6 w-6 fill-blue-50" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl text-gray-700 font-medium">
                  {startup.oneLinePitch}
                </h2>
                
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {startup.industry}
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full uppercase">
                    {startup.stage}
                  </span>
                  {startup.location && (
                    <span className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      {startup.location.city}, {startup.location.country}
                    </span>
                  )}
                  {startup.website && (
                    <a 
                      href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary text-sm hover:underline"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[140px]">
                <ShareButton title={`Check out ${startup.name} on FounderX`} url={profileUrl} />
                <button 
                  onClick={handleFollowToggle}
                  className={`px-4 py-2 text-center font-medium rounded-lg transition shadow-sm ${
                    isFollowing ? 'bg-slate-200 text-slate-800' : 'bg-primary text-white hover:bg-blue-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                {user && user.role === 'investor' && (
                  <button 
                    onClick={() => setInterestModalOpen(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-center font-bold rounded-lg transition shadow-sm text-xs uppercase cursor-pointer"
                  >
                    Send Interest
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">About</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {startup.description}
                </p>
              </section>

              {/* Problem & Solution */}
              {(startup.problem || startup.solution) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {startup.problem && (
                    <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                      <h4 className="font-semibold text-red-900 mb-2">The Problem</h4>
                      <p className="text-red-800 text-sm">{startup.problem}</p>
                    </div>
                  )}
                  {startup.solution && (
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                      <h4 className="font-semibold text-green-900 mb-2">The Solution</h4>
                      <p className="text-green-800 text-sm">{startup.solution}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Founder */}
              {startup.founderId && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Founder</h3>
                  <Link href={`/f/${startup.founderId.username || startup.founderId._id}`} className="flex items-center gap-3 group">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-white border border-gray-200">
                      {startup.founderId.profileImage ? (
                        <img src={startup.founderId.profileImage} alt={startup.founderId.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                          {startup.founderId.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-primary transition">{startup.founderId.name}</div>
                      <div className="text-xs text-gray-500">Founder</div>
                    </div>
                  </Link>
                  {user && user._id !== startup.founderId._id && (
                    <div className="mt-3">
                      <FollowButton 
                        userId={startup.founderId._id} 
                        initialIsFollowing={startup.founderId.followers?.includes(user._id)} 
                        className="w-full text-xs h-8"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Stats/Details */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Founded</span>
                    <span className="font-medium text-gray-900">{startup.createdAt ? format(new Date(startup.createdAt), 'yyyy') : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Team Size</span>
                    <span className="font-medium text-gray-900">{startup.teamSize || '1-10'}</span>
                  </div>
                  {startup.fundingRequired > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                       <div className="text-gray-500 text-xs uppercase mb-1">Raising</div>
                       <div className="text-xl font-bold text-green-600">${startup.fundingRequired.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-gray-900" />
            <h2 className="text-2xl font-bold text-gray-900">Q&A</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
               <QuestionForm targetId={startup._id} targetType="Startup" />
            </div>
            <div className="lg:col-span-2">
               <QAList targetId={startup._id} targetType="Startup" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Interested in {startup.name}?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Join FounderX to see full details, pitch deck, and connect with the team.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition transform hover:-translate-y-0.5"
          >
            View Full Profile
          </Link>
        </div>
      </div>
      <SendInterestRequestModal
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        startup={startup}
      />
    </div>
  );
}
