'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Loader, Video, Search, Play, Clock, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WatchPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // latest, trending
  const [filterType, setFilterType] = useState('all'); // all, startup, podcast

  useEffect(() => {
    fetchVideoPosts();
  }, [sortBy, filterType]);

  const fetchVideoPosts = async () => {
    try {
      setLoading(true);
      const sortParam = sortBy === 'trending' ? '&sort=trending' : '';
      let url = `http://localhost:3000/api/posts?type=video${sortParam}`;
      
      // We'll handle filtering client-side for now or add query params if backend supports it
      // Backend supports filtering by startupId, but for "has startupId" vs "no startupId" (podcast maybe?) we might need logic.
      // For now, let's fetch all videos and filter in memory if the dataset is small, or just assume all videos are startup pitches unless tagged otherwise.
      // But the requirement says "Filters: Latest | Popular | Podcasts | Startups".
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        let fetchedPosts = data.data;
        
        // Client-side filtering for specific types
        if (filterType === 'startup') {
            fetchedPosts = fetchedPosts.filter(p => p.startupId);
        } else if (filterType === 'podcast') {
            // Assuming podcasts are videos > 10 mins or tagged "podcast"
            // For now, let's filter by duration > 600s (10m) or specific tag logic if we had it
            fetchedPosts = fetchedPosts.filter(p => p.videoLength > 600 || (p.tags && p.tags.includes('podcast')));
        }

        setPosts(fetchedPosts);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.startupId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.authorId?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Search Header */}
      <div className="pt-24 pb-8 px-4 border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-600 rounded-lg shadow-sm">
                        <Video className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Watch</h1>
                        <p className="text-gray-500 text-sm">Startup pitches, demos, and educational content</p>
                    </div>
                </div>

                <div className="relative w-full md:w-96">
                    <input 
                        type="text" 
                        placeholder="Search videos..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                    />
                    <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                    onClick={() => setSortBy('latest')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        sortBy === 'latest' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    suppressHydrationWarning
                >
                    Latest
                </button>
                <button 
                    onClick={() => setSortBy('trending')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        sortBy === 'trending' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    suppressHydrationWarning
                >
                    Popular
                </button>
                <div className="w-px h-6 bg-gray-200 mx-2" />
                <button 
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        filterType === 'all' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    suppressHydrationWarning
                >
                    All
                </button>
                <button 
                    onClick={() => setFilterType('startup')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        filterType === 'startup' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    suppressHydrationWarning
                >
                    Startups
                </button>
                <button 
                    onClick={() => setFilterType('podcast')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                        filterType === 'podcast' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                    suppressHydrationWarning
                >
                    Podcasts
                </button>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse flex flex-col"
              >
                <div className="aspect-video rounded-xl bg-gray-200 mb-3" />
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-xl p-8 text-center border border-red-100">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Video className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No videos found</h2>
            <p className="text-gray-500">
                {searchQuery ? "Try a different search term." : "Check back later for startup pitches and updates."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPosts.map(post => (
              <VideoGridItem key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoGridItem({ post }) {
    // Determine author info
    const authorName = post.startupId?.name || post.authorId?.name || 'Unknown';
    const authorImage = post.startupId?.logo || post.authorId?.profileImage;
    const isStartup = !!post.startupId;

    return (
        <Link href={`/watch/${post._id}`} className="group flex flex-col">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-3 shadow-sm group-hover:shadow-md transition">
                {post.thumbnailUrl ? (
                    <img 
                      src={post.thumbnailUrl} 
                      alt={post.content} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                ) : post.mediaUrl ? (
                    <video 
                      src={post.mediaUrl} 
                      muted 
                      loop 
                      playsInline 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <Play className="h-10 w-10 text-white opacity-50" />
                    </div>
                )}
                
                {/* Duration Badge (Mocked for now as we don't always have it) */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                    {post.videoLength ? `${Math.floor(post.videoLength/60)}:${String(post.videoLength%60).padStart(2, '0')}` : '00:00'}
                </div>
            </div>

            {/* Info */}
            <div className="flex gap-3">
                <div className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden">
                        {authorImage ? (
                            <img src={authorImage} alt={authorName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                {authorName.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight mb-1 group-hover:text-red-600 transition">
                        {post.content}
                    </h3>
                    <div className="text-xs text-gray-500">
                        <div className="flex items-center mb-0.5 hover:text-gray-700">
                            <span className="truncate max-w-[150px]">{authorName}</span>
                            {isStartup && <Building2 className="h-3 w-3 ml-1 text-gray-400" />}
                        </div>
                        <div className="flex items-center">
                            <span>{post.metrics?.views || 0} views</span>
                            <span className="mx-1">•</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
