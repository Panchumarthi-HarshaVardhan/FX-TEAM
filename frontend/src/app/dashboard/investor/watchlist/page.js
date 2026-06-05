'use client';

import { useAuth } from '../../../../context/AuthContext';
import { useToast } from '../../../../context/ToastContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../../components/Navbar';
import Link from 'next/link';
import { TrendingUp, Eye, Heart, ArrowLeft, Search, Filter, Check, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_URL } from '@/utils/api';

export default function WatchlistPage() {
  const { user, loading, token } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState([]);
  const [filteredWatchlist, setFilteredWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [fetching, setFetching] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!token) return;
      try {
        setFetching(true);
        const res = await fetch(`${API_URL}/api/watchlist`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setWatchlist(data.data);
          setFilteredWatchlist(data.data);
        }
      } catch (error) {
        console.error('Watchlist fetch error:', error);
        addToast('Failed to load watchlist', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchWatchlist();
  }, [token, addToast]);

  useEffect(() => {
    let result = [...watchlist];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(startup => 
        startup.name.toLowerCase().includes(query) ||
        startup.industry.toLowerCase().includes(query) ||
        (startup.oneLinePitch && startup.oneLinePitch.toLowerCase().includes(query))
      );
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'aiScore') {
      result.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    }

    setFilteredWatchlist(result);
  }, [searchQuery, sortBy, watchlist]);

  const handleRemove = async (startupId) => {
    setRemoving(startupId);
    try {
      const res = await fetch(`${API_URL}/api/watchlist/remove/${startupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setWatchlist(prev => prev.filter(s => s._id !== startupId));
        addToast('Removed from Watchlist', 'success');
      }
    } catch (error) {
      console.error(error);
      addToast('Failed to remove startup', 'error');
    } finally {
      setRemoving(null);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          Loading watchlist...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/investor')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-heading">Watchlist</h1>
              <p className="text-body mt-1">Track your favorite startups</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name A-Z</option>
              <option value="aiScore">AI Score</option>
            </select>
          </div>
        </div>

        {/* Watchlist Grid */}
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-20">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto h-32 w-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6"
            >
              <Heart className="h-14 w-14 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your watchlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start exploring startups and add them to your watchlist to track them easily
            </p>
            <Link href="/startups" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 rounded-2xl">
              <Plus className="h-5 w-5" />
              Explore Startups
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWatchlist.map((startup) => (
              <motion.div
                key={startup._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-primary">
                    {startup.name[0]}
                  </div>
                  <button
                    onClick={() => handleRemove(startup._id)}
                    disabled={removing === startup._id}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition disabled:opacity-50"
                  >
                    {removing === startup._id ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <Heart className="h-5 w-5 fill-current" />
                    )}
                  </button>
                </div>
                <h3 className="font-bold text-xl text-foreground mb-2">{startup.name}</h3>
                <p className="text-body text-sm mb-4 line-clamp-2">{startup.oneLinePitch}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {startup.stage}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {startup.industry}
                  </span>
                  {startup.aiScore && (
                    <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full">
                      AI Score: {startup.aiScore}
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/startups/${startup._id}`}
                    className="flex-1 btn-primary text-center"
                  >
                    View Startup
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
