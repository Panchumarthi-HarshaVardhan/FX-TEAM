'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import FollowButton from './FollowButton';
import { API_URL } from '@/utils/api';

export default function GlobalSearch() {
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], startups: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.success && data.data) {
            setResults({
              users: data.data.users || [],
              startups: data.data.startups || [],
              posts: data.data.posts || []
            });
            setIsOpen(true);
          } else {
            setResults({ users: [], startups: [], posts: [] });
          }
        } catch (error) {
          console.error('Search error:', error);
          setResults({ users: [], startups: [], posts: [] });
        } finally {
          setLoading(false);
        }
      } else {
        setResults({ users: [], startups: [], posts: [] });
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleKeyDown = (e) => {
    // Keyboard navigation disabled for grouped complex search dropdown, click navigation preferred.
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const hasResults = results.users.length > 0 || results.startups.length > 0 || results.posts.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if(hasResults) setIsOpen(true); }}
          placeholder="Search users, startups, posts..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-section placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
          suppressHydrationWarning
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 md:left-0 md:right-auto mt-3 w-full sm:w-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[80vh] overflow-y-auto z-50 ring-1 ring-black ring-opacity-5">
          {hasResults ? (
            <div className="py-2">
              {/* ACCOUNTS */}
              {results.users.length > 0 && (
                <div>
                  <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                    Accounts
                  </div>
                  {results.users.map((user) => {
                     const isFollowing = currentUser && user.followers ? user.followers.includes(currentUser._id) : false;
                     
                     return (
                      <div 
                        key={user._id}
                        className="flex items-center justify-between p-4 transition border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      >
                        <Link 
                          href={currentUser && (currentUser._id === user._id || (currentUser.username && user.username && currentUser.username === user.username)) ? `/profile` : `/profile/${user.username || user._id}`}
                          className="flex items-center flex-1 min-w-0 gap-4 mr-4"
                          onClick={clearSearch}
                        >
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                            {user.profileImage ? (
                              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{user.name}</h4>
                              {user.role === 'founder' && (
                                <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase leading-none">
                                  Founder
                                </span>
                              )}
                              {user.role === 'investor' && (
                                <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase leading-none">
                                  Investor
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                          </div>
                        </Link>
                        
                        <div className="flex-shrink-0">
                          {currentUser && currentUser._id !== user._id && (
                              <FollowButton 
                                  userId={user._id} 
                                  initialIsFollowing={isFollowing} 
                                  className="px-4 py-1.5 text-xs font-semibold h-9"
                              />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* STARTUPS */}
              {results.startups.length > 0 && (
                <div>
                  <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100 border-t border-gray-100">
                    Startups
                  </div>
                  {results.startups.map((startup) => (
                    <Link 
                      key={startup._id}
                      href={`/startups/${startup._id}`}
                      className="flex items-center p-4 transition border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      onClick={clearSearch}
                    >
                      <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                        {startup.logo ? (
                          <img src={startup.logo} alt={startup.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-primary font-bold">{startup.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 ml-4">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{startup.name}</h4>
                          <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 uppercase leading-none">
                            {startup.stage}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{startup.oneLinePitch}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* POSTS */}
              {results.posts.length > 0 && (
                <div>
                  <div className="px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100 border-t border-gray-100">
                    Posts
                  </div>
                  {results.posts.map((post) => (
                    <Link 
                      key={post._id}
                      href={`/post/${post._id}`}
                      className="flex flex-col p-4 transition border-b border-gray-50 last:border-0 hover:bg-gray-50"
                      onClick={clearSearch}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                          {post.authorId?.profileImage ? (
                            <img src={post.authorId.profileImage} alt={post.authorId.name} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{post.authorId?.name || 'Anonymous'}</span>
                        <span className="text-xs text-gray-400">@{post.authorId?.username || 'user'}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
