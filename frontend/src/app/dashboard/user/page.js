'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';
import { 
  Plus, 
  ShoppingBag, 
  Heart, 
  Sparkles, 
  Users, 
  TrendingUp, 
  Rocket, 
  MessageSquare, 
  Zap,
  Clock,
  ArrowUpRight,
  Eye,
  CheckCircle2
} from 'lucide-react';

// Demo data for user dashboard
const demoData = {
  analytics: {
    postsCreated: 12,
    startupsFollowed: 8,
    productsSaved: 5,
    investorConnections: 3,
    founderScore: 78,
    profileViews: 234
  },
  aiRecommendations: [
    { type: 'startup', name: 'Nexus AI', tagline: 'AI-powered pitch deck generator', industry: 'AI/ML', match: 94 },
    { type: 'founder', name: 'Sarah Chen', role: 'Founder, Nexus AI', industry: 'AI/ML', mutual: 2 },
    { type: 'startup', name: 'BlockVault', tagline: 'Blockchain treasury management', industry: 'Fintech', match: 87 }
  ],
  activityFeed: [
    { type: 'post', author: 'Alex Johnson', startup: 'FlowSaaS', content: 'Just launched our new AI analytics feature! 🚀', time: '2h ago', likes: 47, comments: 12 },
    { type: 'launch', startup: 'GreenLeaf', tagline: 'Carbon footprint tracking for SMEs', time: '5h ago', likes: 89, comments: 23 },
    { type: 'funding', startup: 'HealthSync', amount: '$2M', stage: 'Seed', time: '1d ago' },
    { type: 'post', author: 'Jamie Lee', startup: 'EduCloud', content: 'Reached 1000 active users! Thank you all!', time: '2d ago', likes: 124, comments: 31 }
  ],
  founderSuggestions: [
    { name: 'Sarah Chen', role: 'CEO, Nexus AI', industry: 'AI/ML', score: 87, avatar: null },
    { name: 'Marcus Johnson', role: 'CTO, BlockVault', industry: 'Fintech', score: 82, avatar: null },
    { name: 'Emily Rodriguez', role: 'Founder, GreenLeaf', industry: 'GreenTech', score: 84, avatar: null }
  ],
  trendingStartups: [
    { name: 'Nexus AI', tagline: 'AI-powered pitch deck generator', industry: 'AI/ML', stage: 'Seed', aiScore: 87 },
    { name: 'BlockVault', tagline: 'Blockchain treasury management', industry: 'Fintech', stage: 'Pre-Seed', aiScore: 81 },
    { name: 'GreenLeaf', tagline: 'Carbon footprint tracking', industry: 'GreenTech', stage: 'Series A', aiScore: 89 },
    { name: 'HealthSync', tagline: 'Patient data synchronization', industry: 'Healthcare', stage: 'Seed', aiScore: 84 }
  ],
  notifications: [
    { text: '2 investors viewed your profile', time: '1h ago', type: 'view' },
    { text: 'Your startup gained 10 followers', time: '3h ago', type: 'follow' },
    { text: 'AI found a startup matching your interests', time: '5h ago', type: 'ai' },
    { text: 'A founder replied to your comment', time: '1d ago', type: 'comment' }
  ],
  badges: [
    { name: 'Startup Creator', earned: true },
    { name: 'Early Builder', earned: true },
    { name: 'Investor Connected', earned: true },
    { name: 'Product Launcher', earned: false }
  ],
  myOrders: [
    { productId: { name: 'Pitch Deck Pro Template' }, founderId: { name: 'Sarah Chen' }, totalAmount: 49, status: 'Completed' },
    { productId: { name: 'Startup Launch Checklist' }, founderId: { name: 'Marcus Johnson' }, totalAmount: 29, status: 'Processing' }
  ]
};

// User Analytics Component
function UserAnalytics({ analytics }) {
  const metricItems = [
    { icon: MessageSquare, label: 'Posts', value: analytics.postsCreated, color: 'text-primary' },
    { icon: Rocket, label: 'Startups Followed', value: analytics.startupsFollowed, color: 'text-purple-600' },
    { icon: Heart, label: 'Products Saved', value: analytics.productsSaved, color: 'text-red-500' },
    { icon: Users, label: 'Investor Connections', value: analytics.investorConnections, color: 'text-green-600' },
    { icon: Zap, label: 'Founder Score', value: analytics.founderScore, color: 'text-yellow-600' },
    { icon: Eye, label: 'Profile Views', value: analytics.profileViews, color: 'text-blue-600' }
  ];

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Your Activity
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricItems.map((item, i) => (
          <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
            <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color}`} />
            <div className="text-xl font-bold text-foreground">{item.value}</div>
            <div className="text-xs text-muted">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Recommendation Hub Component
function AIRecommendationHub({ recommendations }) {
  const [currentRec, setCurrentRec] = useState(0);

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        FounderX AI Recommendations
      </h3>

      {recommendations.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-blue-100 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-foreground">{recommendations[currentRec].name}</h4>
              <p className="text-sm text-muted">
                {recommendations[currentRec].tagline || recommendations[currentRec].role}
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {recommendations[currentRec].industry}
              </span>
            </div>
            {recommendations[currentRec].match && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{recommendations[currentRec].match}%</div>
                <div className="text-xs text-muted">Match</div>
              </div>
            )}
            {recommendations[currentRec].mutual && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{recommendations[currentRec].mutual}</div>
                <div className="text-xs text-muted">Mutual</div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button className="btn-primary text-sm px-4 py-2">Explore</button>
            <button className="btn-secondary text-sm px-4 py-2">Follow</button>
            <button className="btn-secondary text-sm px-4 py-2">Save</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {recommendations.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentRec(i)}
              className={`h-2 w-2 rounded-full transition-all ${i === currentRec ? 'bg-primary w-4' : 'bg-gray-300'}`}
            ></button>
          ))}
        </div>
        <button className="text-primary text-sm font-medium flex items-center gap-1">
          View all recommendations <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// Activity Feed Component
function ActivityFeed({ activities }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Your Feed
      </h3>
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl">
            {activity.type === 'post' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
                    {activity.author[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{activity.author}</p>
                    <p className="text-xs text-muted">{activity.startup}</p>
                  </div>
                </div>
                <p className="text-foreground mb-3">{activity.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {activity.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {activity.comments}</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            )}
            {activity.type === 'launch' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Rocket className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{activity.startup} launched!</p>
                  </div>
                </div>
                <p className="text-foreground mb-3">{activity.tagline}</p>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {activity.likes}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {activity.comments}</span>
                  <span>{activity.time}</span>
                </div>
              </div>
            )}
            {activity.type === 'funding' && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{activity.startup} raised {activity.amount}</p>
                  <p className="text-xs text-muted">{activity.stage} round · {activity.time}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Founder Suggestions Component
function FounderSuggestions({ founders }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Suggested Founders
      </h3>
      <div className="space-y-4">
        {founders.map((founder, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-bold">
                {founder.name[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">{founder.name}</p>
                <p className="text-xs text-muted">{founder.role}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-full">
                  {founder.industry}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-secondary text-xs px-3 py-1.5">Follow</button>
              <button className="btn-primary text-xs px-3 py-1.5">Connect</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trending Startups Component
function TrendingStartups({ startups }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-primary" />
        Trending Startups
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {startups.map((startup, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary font-bold">
                {startup.name[0]}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{startup.aiScore}</div>
                <div className="text-xs text-muted">AI Score</div>
              </div>
            </div>
            <h4 className="font-bold text-foreground">{startup.name}</h4>
            <p className="text-sm text-muted mb-2">{startup.tagline}</p>
            <div className="flex gap-2 mb-3">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {startup.stage}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                {startup.industry}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 btn-primary text-xs py-2">Follow</button>
              <button className="btn-secondary text-xs py-2 px-3">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Smart Notifications Component
function SmartNotifications({ notifications }) {
  return (
    <div className="card p-6 mb-6">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        Smart Notifications
      </h3>
      <div className="space-y-3">
        {notifications.map((notification, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              notification.type === 'view' ? 'bg-blue-50' :
              notification.type === 'follow' ? 'bg-green-50' :
              notification.type === 'ai' ? 'bg-purple-50' :
              'bg-yellow-50'
            }`}>
              {notification.type === 'view' && <Eye className="h-3 w-3 text-blue-600" />}
              {notification.type === 'follow' && <Users className="h-3 w-3 text-green-600" />}
              {notification.type === 'ai' && <Sparkles className="h-3 w-3 text-purple-600" />}
              {notification.type === 'comment' && <MessageSquare className="h-3 w-3 text-yellow-600" />}
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">{notification.text}</p>
              <p className="text-xs text-muted mt-1">{notification.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Quick Actions Component
function AIQuickActions() {
  const actions = [
    'Need help writing a startup post?',
    'Generate startup idea',
    'Improve your founder bio',
    'Find co-founder',
    'Match with investors'
  ];

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-purple-50 to-white">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        AI Quick Actions
      </h3>
      <div className="space-y-2">
        {actions.map((action, i) => (
          <button key={i} className="w-full text-left p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-200 hover:bg-purple-50 transition">
            <p className="text-sm text-foreground">{action}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(demoData);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!token) return;
        const res = await fetch('http://localhost:3000/api/dashboard/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success && json.data) {
          setData({
            ...demoData,
            ...json.data,
            analytics: {
              ...demoData.analytics,
              ...json.data.analytics
            }
          });
        }
      } catch (err) {
        console.error('Error fetching user dashboard:', err);
      } finally {
        setFetching(false);
      }
    };

    if (user && token) {
      fetchDashboardData();
    } else if (!loading && !user) {
      setFetching(false);
    }
  }, [user, token, loading]);

  if (loading || (fetching && token)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-gray-500">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-heading">Welcome back, {user?.name || 'Founder'} 👋</h1>
            <p className="text-body mt-1">Your startup journey continues today.</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                Founder Score: {data.analytics.founderScore}
              </span>
              <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-sm font-semibold rounded-full flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Level 3
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create Post
            </button>
            <Link href="/startups/create" className="btn-secondary flex items-center gap-1">
              <Rocket className="h-4 w-4" />
              Launch Startup
            </Link>
            <Link href="/startups" className="btn-secondary flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Explore Startups
            </Link>
          </div>
        </div>

        <UserAnalytics analytics={data.analytics} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 space-y-6">
            <ActivityFeed activities={data.activityFeed} />
            <TrendingStartups startups={data.trendingStartups} />
          </div>
          
          <div className="space-y-6">
            <AIRecommendationHub recommendations={data.aiRecommendations} />
            <FounderSuggestions founders={data.founderSuggestions} />
            <SmartNotifications notifications={data.notifications} />
            <AIQuickActions />
          </div>
        </div>

        {/* My Orders */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-heading flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              My Orders
            </h2>
            <button className="text-primary text-sm font-medium flex items-center gap-1">
              View All <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          
          <div className="space-y-4">
            {data.myOrders.map((order, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{order.productId?.name || 'Unknown Product'}</h3>
                  <p className="text-sm text-body">Sold by {order.founderId?.name || 'Unknown'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${order.totalAmount}</p>
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-heading mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Your Badges
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.badges.map((badge, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-xl text-center ${
                  badge.earned 
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100' 
                    : 'bg-gray-50 border border-gray-100 opacity-50'
                }`}
              >
                <div className={`h-10 w-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  badge.earned ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className={`font-semibold text-sm ${badge.earned ? 'text-foreground' : 'text-muted'}`}>
                  {badge.name}
                </p>
                {badge.earned && (
                  <p className="text-xs text-primary mt-1">Earned</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
