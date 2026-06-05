'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Bell, Heart, MessageCircle, Repeat, UserPlus, Check, X, DollarSign, Users, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (user) {
      fetchNotifications();
    }
  }, [user, loading, router]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
         setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } else if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      setNotifications(prev => prev.map(n => n._id === id ? ({ ...n, isRead: true }) : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleAction = async (e, type, id, action) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = localStorage.getItem('token');
    try {
      let method = 'PUT';
      let url = '';
      let body = {};
      
      if (type === 'co_founder_invite') {
        url = `http://localhost:3000/api/team-invitations/${id}/status`;
        body = { status: action === 'accept' ? 'accepted' : 'rejected' };
      } else if (type === 'investment_request') {
        url = `http://localhost:3000/api/startups/investment-requests/${id}/status`;
        body = { status: action === 'accept' ? 'accepted' : 'rejected' };
      } else if (type === 'role_request') {
        url = `http://localhost:3000/api/founder/role-requests/${id}/status`;
        body = { status: action === 'accept' ? 'accepted' : 'rejected' };
        method = 'PATCH';
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Invitation/Request ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
        fetchNotifications();
      } else {
        alert(data.error || 'Failed to update status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />;
      case 'repost': return <Repeat className="w-5 h-5 text-green-500" />;
      case 'reply':
      case 'mention': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'investor_interest': return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'co_founder_invite': return <Users className="w-5 h-5 text-indigo-500" />;
      case 'invite_accepted': return <Check className="w-5 h-5 text-green-500" />;
      case 'invite_rejected': return <X className="w-5 h-5 text-red-500" />;
      case 'investment_request': return <DollarSign className="w-5 h-5 text-emerald-500" />;
      case 'role_request': return <Briefcase className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getLink = (notification) => {
    switch (notification.type) {
      case 'follow': return `/profile/${notification.sender.username || notification.sender._id}`;
      case 'post': 
      case 'like':
      case 'repost':
      case 'reply':
      case 'mention':
        return `/post/${notification.entityId?._id || notification.entityId}`;
      case 'co_founder_invite':
      case 'invite_accepted':
      case 'invite_rejected':
      case 'investment_request':
        return `/messages`;
      case 'role_request':
        return `/dashboard/founder`;
      default: return '#';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto pt-20 px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-primary hover:text-blue-700 font-medium flex items-center"
              >
                <Check className="w-4 h-4 mr-1" /> Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification._id);
                    const dest = getLink(notification);
                    if (dest !== '#') router.push(dest);
                  }}
                  className={`block bg-white p-4 rounded-xl border transition-colors cursor-pointer ${
                    !notification.isRead ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src={notification.sender.profileImage || 'https://via.placeholder.com/40'} 
                          alt={notification.sender.name}
                          className="w-8 h-8 rounded-full object-cover" 
                        />
                        <span className="font-semibold text-gray-900">{notification.sender.name}</span>
                        <span className="text-gray-500 text-sm">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {notification.type === 'follow' && 'followed you'}
                        {notification.type === 'like' && 'liked your post'}
                        {notification.type === 'repost' && 'reposted your post'}
                        {notification.type === 'reply' && `replied: "${notification.content}"`}
                        {notification.type === 'mention' && `mentioned you: "${notification.content}"`}
                        {notification.type === 'investor_interest' && 'is interested in your startup'}
                        {notification.type === 'co_founder_invite' && (notification.content || 'invited you to join their startup team')}
                        {notification.type === 'invite_accepted' && (notification.content || 'accepted your team invitation')}
                        {notification.type === 'invite_rejected' && (notification.content || 'declined your team invitation')}
                        {notification.type === 'investment_request' && (notification.content || 'sent you an investment request')}
                        {notification.type === 'role_request' && (notification.content || 'sent you a startup role request')}
                      </p>

                      {/* Action buttons for pending invites/requests */}
                      {(notification.type === 'co_founder_invite' || notification.type === 'investment_request' || notification.type === 'role_request') && 
                       notification.entityId && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => handleAction(e, notification.type, notification.entityId?._id || notification.entityId, 'accept')}
                            className="bg-primary hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleAction(e, notification.type, notification.entityId?._id || notification.entityId, 'reject')}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {notification.type === 'role_request' && (
                        <div className="flex gap-2 mt-3 font-sans">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.isRead) markAsRead(notification._id);
                              router.push('/dashboard/founder');
                            }}
                            className="bg-primary hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            View in Recruitment Hub
                          </button>
                        </div>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
