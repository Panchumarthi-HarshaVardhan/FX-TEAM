'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Bell, MessageCircle, Menu, User, Search, LogIn, LogOut, Settings, ChevronDown, ShoppingBag, ShoppingCart, Heart, FileText, Film, Sun, Moon, Mail } from 'lucide-react';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import ConfirmationModal from './ConfirmationModal';
import { API_URL } from '@/utils/api';
import GlobalSearch from './GlobalSearch';

export default function Navbar({ dark = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const createDropdownRef = useRef(null);
  const { user, loading, logout, token } = useAuth();
  const showInvestorsNav =
    user?.role === "founder" || user?.role === "admin";
  const { socket } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [mailUnreadCount, setMailUnreadCount] = useState(0);
  const pathname = usePathname();

  const isActive = (path) => {
    if (!pathname) return false;
    if (path === '/') return pathname === '/';
    if (path === '/profile') {
      return pathname.startsWith('/profile') || pathname.startsWith('/u/') || pathname.startsWith('/f/');
    }
    if (path === '/messages') {
      return pathname.startsWith('/messages') || pathname.startsWith('/chat');
    }
    return pathname.startsWith(path);
  };

  const getLinkClass = (path) => {
    const active = isActive(path);
    if (isDark) {
      return `flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? 'bg-white/10 text-white font-semibold' : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`;
    } else {
      return `flex-shrink-0 px-3 py-2 rounded-md text-sm font-medium transition ${
        active ? 'bg-blue-50 text-primary font-semibold' : 'text-slate-700 hover:text-primary hover:bg-gray-50'
      }`;
    }
  };

  const getMobileLinkClass = (path) => {
    const active = isActive(path);
    if (isDark) {
      return `block px-3 py-2 rounded-md text-base font-medium transition ${
        active ? 'bg-white/10 text-white font-bold' : 'text-gray-300 hover:text-white hover:bg-white/5'
      }`;
    } else {
      return `block px-3 py-2 rounded-md text-base font-medium transition ${
        active ? 'bg-blue-50 text-primary font-bold' : 'text-slate-700 hover:text-primary hover:bg-gray-50'
      }`;
    }
  };

  const getIconClass = (path) => {
    const active = isActive(path);
    if (isDark) {
      return `transition relative ${active ? 'text-white' : 'text-gray-400 hover:text-white'}`;
    } else {
      return `transition relative ${active ? 'text-primary' : 'text-gray-400 hover:text-primary'}`;
    }
  };

  const getAvatarWrapperClass = () => {
    const active = isActive('/profile');
    if (isDark) {
      return `h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border transition-all ${
        active ? 'border-white ring-2 ring-white/20' : 'bg-[#111827] border-[rgba(255,255,255,0.08)] text-gray-100'
      }`;
    } else {
      return `h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border transition-all ${
        active ? 'border-primary ring-2 ring-primary/20' : 'bg-section text-primary border-gray-200'
      }`;
    }
  };


  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, createDropdownRef]);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const fetchMailUnreadCount = () => {
    if (!user || !token) return;
    fetch(`${API_URL}/api/mail/inbox`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
          const unreadMails = data.data.filter(m => !m.isRead).length;
          setMailUnreadCount(unreadMails);
        }
      })
      .catch(err => console.error('Mail count fetch error:', err));
  };

  const fetchConversationsForBadge = async () => {
    if (!user || !token) return;
    fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return null;
        }
        return res.json();
    })
      .then(data => {
        if (data?.success && Array.isArray(data.data)) {
            let totalUnread = 0;
            data.data.forEach(conv => {
                if (conv.unreadCount && conv.unreadCount[user._id]) {
                    totalUnread += conv.unreadCount[user._id];
                }
                if (conv.status === 'pending' && conv.lastMessage?.sender !== user._id) {
                    totalUnread += 1;
                }
            });
            setMessageUnreadCount(totalUnread);
        }
    })
      .catch(err => console.error('Error fetching conversations for badge:', err));
  };

  // Fetch initial unread count and watchlist count
  useEffect(() => {
    if (user && user._id && token) {
      fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Received non-JSON response");
            }
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        })
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            const unread = data.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
          }
        })
        .catch(err => console.error('Notification fetch error:', err));

      fetchMailUnreadCount();
      // Fetch watchlist count
      fetch(`${API_URL}/api/watchlist/count`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error("Received non-JSON response");
            }
            if (!res.ok) throw new Error('Failed to fetch watchlist count');
            return res.json();
        })
        .then(data => {
          if (data.success) {
            setWatchlistCount(data.data.count);
          }
        })
        .catch(err => console.error('Watchlist count fetch error:', err));
        
      // Fetch conversations for unread message count
      fetch(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              return null;
            }
            return res.json();
        })
        .then(data => {
          if (data?.success && Array.isArray(data.data)) {
            let totalUnread = 0;
            data.data.forEach(conv => {
              if (conv.unreadCount && conv.unreadCount[user._id]) {
                totalUnread += conv.unreadCount[user._id];
              }
              // Also count pending requests as unread
              if (conv.status === 'pending' && conv.lastMessage?.sender !== user._id) {
                totalUnread += 1;
              }
            });
            setMessageUnreadCount(totalUnread);
          }
        })
        .catch(err => console.error('Conversations fetch error:', err));
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', () => {
        setUnreadCount(prev => prev + 1);
        fetchMailUnreadCount();
      });
      
      socket.on('mail_read', () => {
        fetchMailUnreadCount();
      });

      socket.on('mail_unread', () => {
        fetchMailUnreadCount();
      });

      socket.on('new_message_request', () => {
        fetchConversationsForBadge();
      });

      socket.on('request_accepted', () => {
        fetchConversationsForBadge();
      });
    }
    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('mail_read');
        socket.off('mail_unread');
        socket.off('new_message_request');
        socket.off('request_accepted');
      }
    };
  }, [socket, user, token]);

  const navClass = isDark 
    ? "sticky top-0 z-50 bg-[#0B0F19]/80 border-b border-[rgba(255,255,255,0.08)] backdrop-blur-md shadow-lg text-white" 
    : "sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm text-gray-800";
  const chevronClass = `h-4 w-4 transition-transform ${
    isDark ? 'text-gray-400' : 'text-gray-500'
  } ${isDropdownOpen ? 'rotate-180' : ''}`;
  const dropdownClass = `absolute right-0 mt-2 w-56 rounded-xl shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100 ${
    isDark ? 'bg-[#111827] border border-[rgba(255,255,255,0.08)] text-gray-100' : 'bg-white text-gray-700'
  }`;
  const dropdownLinkClass = `block px-4 py-2 text-sm flex items-center transition-colors ${
    isDark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
  }`;
  const dropdownDividerClass = `border-t my-1 ${
    isDark ? 'border-[rgba(255,255,255,0.08)]' : 'border-gray-100'
  }`;
  const dropdownHeaderClass = `px-4 py-3 border-b mb-1 ${
    isDark ? 'border-[rgba(255,255,255,0.08)]' : 'border-gray-100'
  }`;
  const mobileMenuClass = `md:hidden border-t ${
    isDark ? 'bg-[#0B0F19] border-[rgba(255,255,255,0.08)] text-gray-100' : 'bg-white border-gray-100 text-gray-800'
  }`;

  return (
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center mr-6">
            <span className="text-2xl font-bold text-primary">FounderX</span>
          </Link>
          
          {/* Desktop Menu & Search */}
          <div className="hidden md:flex md:items-center md:gap-4 md:flex-nowrap">
            <div className="shrink w-full max-w-[400px]">
              <GlobalSearch />
            </div>

            <Link href="/" className={getLinkClass('/')}>
              Home
            </Link>
            <Link href="/startups" className={getLinkClass('/startups')}>
              Startups
            </Link>
            {showInvestorsNav && (
              <Link href="/investors" className={getLinkClass('/investors')}>
                Investors
              </Link>
            )}
            <Link href="/shop" className={`${getLinkClass('/shop')} flex items-center gap-1`}>
              <ShoppingBag className="h-4 w-4" />
              Shop
            </Link>
            <Link href="/foundertv" className={getLinkClass('/foundertv')}>
              FounderTV
            </Link>
            <Link href="/dashboard" className={getLinkClass('/dashboard')}>
              Dashboard
            </Link>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4 ml-auto">
            {!loading && user ? (
              <>
                {/* Create Dropdown */}
                <div className="relative mr-2" ref={createDropdownRef}>
                  <button 
                    onClick={() => setIsCreateDropdownOpen(!isCreateDropdownOpen)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition bg-primary hover:bg-blue-600 text-white shadow-sm cursor-pointer animate-none"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create</span>
                    <ChevronDown className="h-3 w-3 opacity-85" />
                  </button>

                  {isCreateDropdownOpen && (
                    <div className={dropdownClass + " left-0 mt-2"}>
                      <Link 
                        href="/create"
                        className={dropdownLinkClass}
                        onClick={() => setIsCreateDropdownOpen(false)}
                      >
                        <FileText className="h-4 w-4 mr-3 text-blue-500" />
                        Create Post
                      </Link>
                      <Link 
                        href="/upload"
                        className={dropdownLinkClass}
                        onClick={() => setIsCreateDropdownOpen(false)}
                      >
                        <Film className="h-4 w-4 mr-3 text-purple-500" />
                        Upload Video
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/dashboard/investor/watchlist" className={getIconClass('/dashboard/investor/watchlist')}>
                  <Heart className="h-6 w-6" />
                  {watchlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {watchlistCount}
                    </span>
                  )}
                </Link>
                <Link href="/notifications" className={getIconClass('/notifications')}>
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/inbox" className={getIconClass('/inbox')} title="Mailbox">
                  <Mail className="h-6 w-6" />
                  {mailUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {mailUnreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/messages" className={getIconClass('/messages')}>
                  <MessageCircle className="h-6 w-6" />
                  {messageUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {messageUnreadCount}
                    </span>
                  )}
                </Link>
                
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-1 focus:outline-none animate-none"
                  >
                    <div className={getAvatarWrapperClass()}>
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name || 'Profile'} 
                          className="h-full w-full object-cover" 
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'; }}
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <ChevronDown className={chevronClass} />
                  </button>

                  {isDropdownOpen && (
                    <div className={dropdownClass}>
                      <div className={dropdownHeaderClass}>
                        <p className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-450 truncate">{user.email}</p>
                      </div>
                      
                      <Link 
                        href="/profile"
                        className={dropdownLinkClass}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3 text-blue-500" />
                        Your Profile
                      </Link>
                      
                      <Link 
                        href="/settings"
                        className={dropdownLinkClass}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3 text-zinc-400" />
                        Settings
                      </Link>
                      
                      <div className={dropdownDividerClass}></div>
                      
                      <button
                        onClick={handleLogoutClick}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center transition-colors font-semibold"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className={dark ? "text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition" : "text-slate-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition"}>
                  Log in
                </Link>
                <Link href="/auth/signup" className="flex items-center justify-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 transition">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden ml-auto">
            <Link
              href="/cart"
              className={`mr-2 inline-flex items-center justify-center h-9 w-9 rounded-full ${dark ? 'bg-zinc-900 text-zinc-300' : 'bg-gray-100 text-gray-600'}`}
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md transition focus:outline-none ${dark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-gray-400 hover:text-primary hover:bg-gray-100'}`}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={mobileMenuClass}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className={getMobileLinkClass('/')}>
              Home
            </Link>
            <Link href="/startups" className={getMobileLinkClass('/startups')}>
              Startups
            </Link>
            {showInvestorsNav && (
              <Link href="/investors" className={getMobileLinkClass('/investors')}>
                Investors
              </Link>
            )}
            <Link href="/shop" className={getMobileLinkClass('/shop')}>
              Shop
            </Link>
            <Link href="/foundertv" className={getMobileLinkClass('/foundertv')}>
              FounderTV
            </Link>
            <Link href="/dashboard" className={getMobileLinkClass('/dashboard')}>
              Dashboard
            </Link>
            {!loading && user ? (
              <>
                <div className={dropdownDividerClass + " my-2 pt-2"}>
                  <div className="flex items-center px-3 mb-3">
                    <div className="flex-shrink-0">
                      {user.profileImage ? (
                         <img src={user.profileImage} className="h-10 w-10 rounded-full object-cover border border-zinc-800" alt="" />
                      ) : (
                         <div className={`h-10 w-10 rounded-full flex items-center justify-center border ${dark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-section border-gray-200 text-primary'}`}>
                           <User className="h-6 w-6" />
                         </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-zinc-900 dark:text-zinc-100">{user.name}</div>
                      <div className="text-sm font-medium text-gray-500 dark:text-zinc-450">{user.email}</div>
                    </div>
                  </div>
                  
                  <Link 
                    href="/profile" 
                    className={getMobileLinkClass('/profile')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link 
                    href="/inbox" 
                    className={getMobileLinkClass('/inbox')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mailbox {mailUnreadCount > 0 && `(${mailUnreadCount})`}
                  </Link>
                  <Link 
                    href="/settings" 
                    className={getMobileLinkClass('/settings')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <Link 
                    href="/create" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${dark ? 'text-blue-400 hover:bg-zinc-900' : 'text-primary hover:bg-gray-50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    + Create Post
                  </Link>
                  <Link 
                    href="/upload" 
                    className={`block px-3 py-2 rounded-md text-base font-medium ${dark ? 'text-purple-400 hover:bg-zinc-900' : 'text-purple-600 hover:bg-gray-50'}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    + Upload Video
                  </Link>
                  <button 
                    onClick={handleLogoutClick}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                 <Link href="/auth/login" className={getMobileLinkClass('/auth/login')}>
                  Log in
                </Link>
                <Link href="/auth/signup" className={`block px-3 py-2 rounded-md text-base font-medium ${dark ? 'text-blue-400 hover:bg-zinc-900' : 'text-primary hover:bg-gray-50'}`}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Sign out"
        message="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmText="Sign out"
        cancelText="Cancel"
      />
    </nav>
  );
}
