'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileText, 
  BarChart2, 
  Users, 
  Send, 
  Brain, 
  TrendingUp, 
  Hash, 
  DollarSign, 
  MessageSquare, 
  Heart, 
  Share2, 
  Bookmark,
  Rocket,
  Zap,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  MoreHorizontal,
  Loader
} from 'lucide-react';
import PostCard from './PostCard';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import Link from 'next/link';
import FollowButton from './FollowButton';
import { getSafeImageSrc, getSafeInitial } from '../utils/helpers';

// Demo data
const demoPosts = [
  {
    id: 1,
    type: 'launch',
    user: {
      name: 'Sarah Chen',
      username: 'sarahchen',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20asian%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      role: 'founder',
      verified: true
    },
    startup: {
      name: 'Nexus AI',
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20AI%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Seed',
      industry: 'AI'
    },
    title: 'Just launched Nexus AI! ',
    content: 'After 8 months of building, we are finally launching our AI-powered pitch deck generator. Thank you to the entire FounderX community for the support!',
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20pitch%20deck%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
    likes: 423,
    comments: 67,
    shares: 24,
    investorInterest: 18,
    time: new Date(Date.now() - 3600000)
  },
  {
    id: 2,
    type: 'funding',
    user: {
      name: 'Marcus Johnson',
      username: 'marcusj',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20black%20male%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      role: 'founder',
      verified: true
    },
    startup: {
      name: 'BlockVault',
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20fintech%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Pre-seed',
      industry: 'FinTech'
    },
    title: 'We raised $750K pre-seed! ',
    content: 'Thrilled to announce our pre-seed round led by K2 Partners. This is just the beginning of our journey to revolutionize treasury management for startups.',
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20fintech%20funding%20announcement%20graphic%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
    likes: 891,
    comments: 124,
    shares: 56,
    investorInterest: 42,
    time: new Date(Date.now() - 7200000)
  },
  {
    id: 3,
    type: 'lesson',
    user: {
      name: 'Emily Rodriguez',
      username: 'emilyr',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20hispanic%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      role: 'founder',
      verified: true
    },
    startup: {
      name: 'GreenLeaf',
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20sustainability%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Series A',
      industry: 'Sustainability'
    },
    title: '5 Lessons from My First Year as a Founder',
    content: '1. Ship fast, iterate faster 2. Listen to customers, not just investors 3. Hire slowly, fire quickly 4. Focus on revenue, not vanity metrics 5. Take care of your mental health',
    likes: 1247,
    comments: 89,
    shares: 78,
    investorInterest: 12,
    time: new Date(Date.now() - 14400000)
  }
];

const demoTrendingStartups = [
  { name: 'Nexus AI', logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20AI%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square', upvotes: 1247 },
  { name: 'BlockVault', logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20fintech%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square', upvotes: 892 },
  { name: 'GreenLeaf', logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20sustainability%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square', upvotes: 756 }
];

const demoHashtags = ['#AIStartups', '#BuildInPublic', '#SaaS', '#FounderLife', '#StartupLaunch'];

const demoActiveInvestors = [
  { name: 'David Kim', firm: 'K2 Partners', avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20asian%20male%20investor%2C%20headshot%2C%20neutral%20background&image_size=square', active: '5m ago' },
  { name: 'Lisa Anderson', firm: 'GreenLeaf Capital', avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20white%20female%20investor%2C%20headshot%2C%20neutral%20background&image_size=square', active: '12m ago' }
];

const demoSuggestedFounders = [
  { name: 'Jessica Williams', startup: 'SocialFlow', avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20black%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square' },
  { name: 'Michael Brown', startup: 'FinancePro', avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20white%20male%20founder%2C%20headshot%2C%20neutral%20background&image_size=square' }
];

const demoFundingNews = [
  { headline: 'NeuroFlow raised $50K', time: '2h ago' },
  { headline: 'Trendly gained 1K users', time: '4h ago' },
  { headline: '12 founders launched products today', time: '6h ago' },
  { headline: '5 investors joined FounderX', time: '8h ago' }
];

const demoAISuggestions = [
  'Need help writing your first startup update?',
  'Want AI to improve your pitch?',
  'Looking for investors in your industry?'
];

// Feed Tabs Component
function FeedTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'forYou', label: 'For You' },
    { id: 'founders', label: 'Founders' },
    { id: 'investors', label: 'Investors' },
    { id: 'startups', label: 'Startups' },
    { id: 'launches', label: 'Launches' },
    { id: 'videos', label: 'Videos' }
  ];

  return (
    <div className="relative z-10 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-3 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-gray-200 text-muted hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Post Composer Component
function PostComposer({ user }) {
  const router = useRouter();
  const avatarSrc = getSafeImageSrc(user?.profileImage);

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-50">
          {user ? (
            avatarSrc ? (
              <img src={avatarSrc} alt={user.name || "User"} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-blue-50 flex items-center justify-center text-primary font-bold">
                {getSafeInitial(user?.name)}
              </div>
            )
          ) : (
            <div className="h-full w-full bg-blue-50 flex items-center justify-center text-primary font-bold">
              U
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <button 
            onClick={() => router.push('/create')}
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-muted rounded-xl text-left transition cursor-pointer font-medium focus:outline-none"
          >
            Share your startup progress, product launch, funding update, founder insight, or idea…
          </button>
        </div>
      </div>
    </div>
  );
}

// Startup Post Card Component
function StartupPostCard({ post }) {
  const userAvatarSrc = getSafeImageSrc(post.user.avatar);
  const startupLogoSrc = getSafeImageSrc(post.startup?.logo);
  const postImageSrc = getSafeImageSrc(post.image);

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-blue-50">
          {userAvatarSrc ? (
            <img src={userAvatarSrc} alt={post.user.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-bold">
              {getSafeInitial(post.user?.name)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground">{post.user.name}</h3>
                {post.user.verified && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted">
                <span className="font-medium">@{post.user.username}</span>
                <span>·</span>
                <span>{format(post.time, 'h:mm a')}</span>
              </div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-lg">
              <MoreHorizontal className="h-4 w-4 text-muted" />
            </button>
          </div>
          
          {post.startup && (
            <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-xl">
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-blue-50">
                {startupLogoSrc ? (
                  <img src={startupLogoSrc} alt={post.startup.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                    {getSafeInitial(post.startup?.name)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{post.startup.name}</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {post.startup.stage}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                    {post.startup.industry}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {post.type === 'funding' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Raising Funds
              </span>
            </div>
          )}
        </div>
      </div>
      
      <h2 className="text-lg font-bold text-foreground mb-2">{post.title}</h2>
      <p className="text-muted mb-4">{post.content}</p>
      
      {postImageSrc && (
        <div className="rounded-xl overflow-hidden mb-4">
          <img src={postImageSrc} alt={post.title} className="w-full h-auto" />
        </div>
      )}
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-sm text-muted hover:text-primary transition">
            <Heart className="h-4 w-4" />
            {post.likes}
          </button>
          <button className="flex items-center gap-1 text-sm text-muted hover:text-primary transition">
            <MessageSquare className="h-4 w-4" />
            {post.comments}
          </button>
          <button className="flex items-center gap-1 text-sm text-muted hover:text-primary transition">
            <Share2 className="h-4 w-4" />
            {post.shares}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {post.investorInterest > 0 && (
            <button className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition">
              <Users className="h-4 w-4" />
              {post.investorInterest} investors interested
            </button>
          )}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
            <Bookmark className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Launch Card Component
function LaunchCard({ product }) {
  const productImageSrc = getSafeImageSrc(product.image);

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-blue-50">
          {productImageSrc ? (
            <img src={productImageSrc} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary text-2xl font-bold">
              {getSafeInitial(product?.name)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold flex items-center gap-1">
              <Rocket className="h-3 w-3" />
              Just Launched
            </span>
            {product.builtOnFounderX && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Built on FounderX
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-1">{product.name}</h3>
          <p className="text-muted text-sm mb-3">{product.tagline}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm font-bold text-foreground hover:text-primary transition">
                <TrendingUp className="h-4 w-4" />
                {product.upvotes}
              </button>
              <button className="flex items-center gap-1 text-sm text-muted">
                <MessageSquare className="h-4 w-4" />
                {product.comments}
              </button>
              {product.investorInterest > 0 && (
                <button className="flex items-center gap-1 text-sm text-green-600">
                  <Users className="h-4 w-4" />
                  {product.investorInterest}
                </button>
              )}
            </div>
            <button className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              Visit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Trending Sidebar Component
function TrendingSidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [trendingStartups, setTrendingStartups] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [activeInvestors, setActiveInvestors] = useState([]);
  const [suggestedFounders, setSuggestedFounders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch Trending Startups
        const startupsRes = await fetch('http://localhost:3000/api/startups', { headers });
        const startupsData = await startupsRes.json();
        if (startupsData.success && Array.isArray(startupsData.data)) {
          setTrendingStartups(startupsData.data.slice(0, 3));
        }

        // Fetch Trending Hashtags
        const hashtagsRes = await fetch('http://localhost:3000/api/posts/trending', { headers });
        const hashtagsData = await hashtagsRes.json();
        if (hashtagsData.success && Array.isArray(hashtagsData.data)) {
          setTrendingHashtags(hashtagsData.data.slice(0, 5));
        }

        // Fetch Suggested Founders
        const foundersRes = await fetch('http://localhost:3000/api/users?role=founder', { headers });
        const foundersData = await foundersRes.json();
        if (foundersData.success && Array.isArray(foundersData.data)) {
          setSuggestedFounders(foundersData.data.slice(0, 3));
        }

        // Fetch Active Investors
        const investorsRes = await fetch('http://localhost:3000/api/users?role=investor', { headers });
        const investorsData = await investorsRes.json();
        if (investorsData.success && Array.isArray(investorsData.data)) {
          setActiveInvestors(investorsData.data.slice(0, 2));
        }

      } catch (err) {
        console.error('Error loading sidebar data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const triggerAssistant = (suggestion) => {
    const event = new CustomEvent('trigger-founderx-assistant', { detail: { query: suggestion } });
    window.dispatchEvent(event);
  };

  const demoFundingNews = [
    { headline: 'NeuroFlow raised $50K', time: '2h ago' },
    { headline: 'Trendly gained 1K users', time: '4h ago' },
    { headline: '12 founders launched products today', time: '6h ago' },
    { headline: '5 investors joined FounderX', time: '8h ago' }
  ];

  const demoAISuggestions = [
    'Need help writing your first startup update?',
    'Want AI to improve your pitch?',
    'Looking for investors in your industry?'
  ];

  return (
    <div className="space-y-6">
      {/* Trending Startups */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Trending Startups
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-xs text-muted">Loading startups...</div>
          ) : trendingStartups.length === 0 ? (
            <div className="text-xs text-muted">No startups found.</div>
          ) : (
            trendingStartups.map((startup, i) => {
              const logoSrc = getSafeImageSrc(startup.logo);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-lg overflow-hidden bg-blue-50 cursor-pointer"
                    onClick={() => router.push(`/startups/${startup._id}`)}
                  >
                    {logoSrc ? (
                      <img src={logoSrc} alt={startup.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm">
                        {getSafeInitial(startup?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition truncate"
                      onClick={() => router.push(`/startups/${startup._id}`)}
                    >
                      {startup.name}
                    </div>
                    <div className="text-xs text-muted flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {startup.followerCount || 0} followers
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          Trending Hashtags
        </h3>
        <div className="flex flex-wrap gap-2">
          {isLoading ? (
            <div className="text-xs text-muted">Loading hashtags...</div>
          ) : trendingHashtags.length === 0 ? (
            <div className="text-xs text-muted">No trending hashtags yet.</div>
          ) : (
            trendingHashtags.map((tag, i) => {
              const cleanTag = tag._id.startsWith('#') ? tag._id.slice(1) : tag._id;
              return (
                <button 
                  key={i} 
                  onClick={() => router.push(`/hashtag/${cleanTag}`)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-primary/10 hover:text-primary transition"
                >
                  #{cleanTag}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Investors */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          Active Investors
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-xs text-muted">Loading investors...</div>
          ) : activeInvestors.length === 0 ? (
            <div className="text-xs text-muted">No investors found.</div>
          ) : (
            activeInvestors.map((investor, i) => {
              const avatarSrc = getSafeImageSrc(investor.profileImage);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full overflow-hidden relative bg-blue-50 cursor-pointer"
                    onClick={() => router.push(`/profile/${investor.username}`)}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={investor.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                        {getSafeInitial(investor?.name)}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition truncate"
                      onClick={() => router.push(`/profile/${investor.username}`)}
                    >
                      {investor.name}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {investor.headline || `@${investor.username}`}
                    </div>
                  </div>
                  <FollowButton 
                    userId={investor._id} 
                    initialIsFollowing={user?.following?.some(id => id.toString() === investor._id?.toString()) ?? false} 
                    className="px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Suggested Founders */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Suggested Founders
        </h3>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-xs text-muted">Loading founders...</div>
          ) : suggestedFounders.length === 0 ? (
            <div className="text-xs text-muted">No founders found.</div>
          ) : (
            suggestedFounders.map((founder, i) => {
              const avatarSrc = getSafeImageSrc(founder.profileImage);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="h-10 w-10 rounded-full overflow-hidden bg-blue-50 cursor-pointer"
                    onClick={() => router.push(`/profile/${founder.username}`)}
                  >
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={founder.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-primary font-bold">
                        {getSafeInitial(founder?.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-foreground cursor-pointer hover:text-primary transition truncate"
                      onClick={() => router.push(`/profile/${founder.username}`)}
                    >
                      {founder.name}
                    </div>
                    <div className="text-xs text-muted truncate">@{founder.username}</div>
                  </div>
                  <FollowButton 
                    userId={founder._id} 
                    initialIsFollowing={user?.following?.some(id => id.toString() === founder._id?.toString()) ?? false} 
                    className="px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Funding News */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Startup News
        </h3>
        <div className="space-y-3">
          {demoFundingNews.map((news, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-sm font-medium text-foreground">{news.headline}</div>
                <div className="text-xs text-muted">{news.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Quick Actions */}
      <div className="card p-6 bg-gradient-to-br from-purple-50 to-white">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Quick Actions
        </h3>
        <div className="space-y-3">
          {demoAISuggestions.map((suggestion, i) => (
            <button 
              key={i} 
              onClick={() => triggerAssistant(suggestion)}
              className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition text-sm text-muted"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Feed Component
export default function Feed() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('forYou');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      let url = `${API_URL}/api/posts`;
      const params = new URLSearchParams();
      if (activeTab === 'videos') {
        params.append('type', 'video');
      } else if (activeTab === 'founders') {
        params.append('authorRole', 'founder');
      } else if (activeTab === 'investors') {
        params.append('authorRole', 'investor');
      } else if (activeTab === 'startups') {
        params.append('hasStartup', 'true');
      } else if (activeTab === 'launches') {
        params.append('category', 'launch');
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, { headers });
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        } else {
          setError(data.error || data.message || 'Failed to fetch posts');
        }
      } else {
        setError('Server returned non-JSON response');
      }
    } catch (err) {
      console.error('Error fetching feed posts:', err);
      setError('Failed to connect to server. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Feed */}
      <main className="lg:col-span-8">
        {/* Feed Tabs */}
        <FeedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Post Composer removed */}

        {/* Feed Content */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <Loader className="animate-spin h-8 w-8 text-primary" />
              <p className="text-zinc-400 text-sm font-semibold">Loading real feed updates...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-red-50/5 border border-red-500/10 rounded-2xl backdrop-blur-md">
              <p className="text-red-400 font-semibold mb-3">{error}</p>
              <button 
                onClick={fetchPosts}
                className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold shadow hover:bg-red-600 transition"
              >
                Retry Loading
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-16 text-center bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-zinc-400 font-semibold mb-2">No updates shared yet!</p>
              <p className="text-zinc-500 text-sm mb-4">Be the first one to share an update or idea on FounderX.</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post._id} post={post} refreshUser={refreshUser} />
            ))
          )}
        </div>
      </main>

      {/* Sidebar */}
      <aside className="hidden lg:block lg:col-span-4">
        <TrendingSidebar />
      </aside>
    </div>
  );
}
