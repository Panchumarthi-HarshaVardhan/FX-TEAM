'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Rocket,
  ShieldCheck,
  Zap,
  Clock,
  Eye
} from 'lucide-react';
import SendInterestRequestModal from '../../../components/SendInterestRequestModal';

// Demo startup data
const demoStartup = {
  _id: '1',
  name: 'Nexus AI',
  tagline: 'AI-powered pitch deck generator for early-stage startups',
  oneLinePitch: 'We help founders create professional pitch decks in minutes using AI',
  industry: 'AI/ML',
  stage: 'Seed',
  logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20AI%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
  verified: true,
  raisingFunds: true,
  website: 'https://nexus-ai.example.com',
  metrics: {
    followers: 1247,
    monthlyGrowth: 24,
    activeUsers: 3421,
    revenue: 45000,
    fundingRaised: 2000000,
    investorInterest: 42,
    upvotes: 892
  },
  productImages: [
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20pitch%20deck%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  ],
  features: [
    'AI-powered template suggestions',
    'Real-time pitch deck analytics',
    'Investor feedback simulator',
    'Collaboration tools for teams',
    'Export to PDF and PowerPoint'
  ],
  story: {
    problem: 'Founders spend weeks creating pitch decks that investors don\'t read',
    solution: 'AI helps create professional pitch decks in minutes, not weeks',
    vision: 'To become the standard way startups fundraise globally',
    market: '$100B+ global venture capital market',
    whyNow: 'AI technology is now advanced enough to create high-quality content automatically'
  },
  founders: [
    {
      name: 'Sarah Chen',
      role: 'CEO & Founder',
      bio: 'Ex-Google AI engineer with 10+ years of experience in machine learning',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20asian%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square'
    },
    {
      name: 'James Wilson',
      role: 'CTO & Co-founder',
      bio: 'Full-stack developer and startup veteran who has built 3 previous products',
      avatar: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20white%20male%20founder%2C%20headshot%2C%20neutral%20background&image_size=square'
    }
  ],
  funding: {
    stage: 'Seed',
    seekingAmount: 2000000,
    useOfFunds: '40% Product, 30% Marketing, 30% Team'
  },
  activity: [
    { type: 'launch', title: 'Launched on Product Hunt', date: new Date(Date.now() - 86400000 * 3) },
    { type: 'funding', title: 'Raised $2M seed round', date: new Date(Date.now() - 86400000 * 30) },
    { type: 'update', title: 'Reached 1000 active users', date: new Date(Date.now() - 86400000 * 14) }
  ],
  aiInsights: {
    score: 87,
    strengths: [
      'Strong founding team with relevant experience',
      'Clear product-market fit signals',
      'Growing user base with 24% MoM growth',
      'Addressing a large and growing market'
    ],
    risks: [
      'Competition from established players',
      'Revenue still early stage',
      'Need to prove long-term retention'
    ],
    nextMoves: [
      'Focus on user retention metrics',
      'Prepare for Series A in 12-18 months',
      'Expand to enterprise customers'
    ]
  }
};

// Helper function to get safe image src
const getSafeImageSrc = (src) => {
  if (!src || typeof src !== "string" || src.trim() === "") return null;
  return src;
};

// Startup Header Component
function StartupHeader({ startup, isFollowing, onFollow, onInterest, onApplyRequest }) {
  const logoSrc = getSafeImageSrc(startup.logo);
  const { user } = useAuth();
  
  return (
    <div className="card p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-blue-50 bg-white">
          {logoSrc ? (
            <img src={logoSrc} alt={startup.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-blue-50 flex items-center justify-center text-primary font-bold text-3xl">
              {startup.name.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{startup.name}</h1>
            {startup.verified && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
            {startup.raisingFunds && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                <DollarSign className="h-3 w-3" />
                Raising Funds
              </span>
            )}
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              {startup.stage}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
              {startup.industry}
            </span>
          </div>
          
          <p className="text-lg text-muted mb-4">{startup.tagline}</p>
          
          <div className="flex flex-wrap gap-3">
            <button onClick={onFollow} className={`btn-primary flex items-center gap-1 ${isFollowing ? 'opacity-80 bg-slate-200 text-slate-800' : ''}`}>
              <Users className="h-4 w-4" />
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            {user && user.role === 'investor' && (
              <button onClick={onInterest} className="btn-secondary flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Investor Interested
              </button>
            )}
            {user && (user.role === 'user' || user.role === 'job_seeker') && (
              <button onClick={onApplyRequest} className="btn-primary flex items-center gap-1 font-semibold">
                <Sparkles className="h-4 w-4" />
                Apply / Send Request
              </button>
            )}
            {startup.website && (
              <a 
                href={startup.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Startup Metrics Component
function StartupMetrics({ metrics }) {
  const metricItems = [
    { icon: Users, label: 'Followers', value: metrics.followers.toLocaleString() },
    { icon: TrendingUp, label: 'Monthly Growth', value: `${metrics.monthlyGrowth}%`, color: 'text-green-600' },
    { icon: Users, label: 'Active Users', value: metrics.activeUsers.toLocaleString() },
    { icon: DollarSign, label: 'Revenue', value: `$${(metrics.revenue / 1000).toFixed(0)}K` },
    { icon: DollarSign, label: 'Funding Raised', value: `$${(metrics.fundingRaised / 1000000).toFixed(1)}M` },
    { icon: Users, label: 'Investor Interest', value: metrics.investorInterest },
    { icon: TrendingUp, label: 'Upvotes', value: metrics.upvotes.toLocaleString() }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {metricItems.map((item, i) => (
        <div key={i} className="card p-4 text-center">
          <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color || 'text-primary'}`} />
          <div className="text-xl font-bold text-foreground">{item.value}</div>
          <div className="text-xs text-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// Product Showcase Component
function ProductShowcase({ startup }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        Product Showcase
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {startup.productImages.map((img, i) => {
          const imgSrc = getSafeImageSrc(img);
          return (
            <div key={i} className="rounded-xl overflow-hidden">
              {imgSrc && <img src={imgSrc} alt={`Product ${i + 1}`} className="w-full h-auto" />}
            </div>
          );
        })}
      </div>
      
      <h3 className="text-lg font-bold text-foreground mb-3">Key Features</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {startup.features.map((feature, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Startup Story Component
function StartupStory({ story }) {
  const sections = [
    { title: 'Problem', content: story.problem },
    { title: 'Solution', content: story.solution },
    { title: 'Vision', content: story.vision },
    { title: 'Market', content: story.market },
    { title: 'Why Now', content: story.whyNow }
  ];

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Startup Story</h2>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            <h3 className="font-bold text-foreground mb-1">{section.title}</h3>
            <p className="text-muted text-sm">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Founder Section Component
function FounderSection({ founders }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        Founding Team
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {founders.map((founder, i) => {
          const avatarSrc = getSafeImageSrc(founder.avatar);
          return (
            <div key={i} className="p-4 bg-gray-50 rounded-xl flex items-start gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-blue-50">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={founder.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xl">
                    {founder.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{founder.name}</h4>
                <p className="text-sm text-primary font-medium mb-2">{founder.role}</p>
                <p className="text-sm text-muted">{founder.bio}</p>
                <div className="mt-3">
                  <button className="btn-secondary px-4 py-1.5 text-xs flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Message Founder
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Investor Panel Component
function InvestorPanel({ funding }) {
  const { user } = useAuth();

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        Investor Information
      </h2>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Stage</div>
          <div className="text-xl font-bold text-foreground">{funding.stage}</div>
        </div>
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Seeking</div>
          <div className="text-xl font-bold text-primary">
            ${(funding.seekingAmount / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl">
          <div className="text-sm text-muted mb-1">Use of Funds</div>
          <div className="text-sm font-medium text-foreground">{funding.useOfFunds}</div>
        </div>
      </div>
      
      {(!user || (user.role !== 'user' && user.role !== 'job_seeker')) && (
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary flex items-center gap-1">
            <Eye className="h-4 w-4" />
            View Pitch Deck
          </button>
          <button className="btn-secondary flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Request Intro
          </button>
        </div>
      )}
    </div>
  );
}

// Startup Activity Feed Component
function StartupActivityFeed({ activity }) {
  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h2>
      
      <div className="space-y-3">
        {activity.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
            <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {item.type === 'launch' && <Rocket className="h-4 w-4 text-purple-600" />}
                {item.type === 'funding' && <DollarSign className="h-4 w-4 text-green-600" />}
                {item.type === 'update' && <TrendingUp className="h-4 w-4 text-primary" />}
                <span className="font-medium text-foreground">{item.title}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Startup Insights Component
function AIStartupInsights({ insights }) {
  return (
    <div className="card p-6 bg-gradient-to-br from-purple-50 to-white">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-purple-600" />
        FounderX AI Analysis
      </h2>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
          {insights.score}
        </div>
        <div>
          <div className="text-lg font-bold text-foreground">AI Score</div>
          <div className="text-sm text-muted">Out of 100</div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </h3>
          <ul className="space-y-1">
            {insights.strengths.map((strength, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-green-600 mt-1">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-yellow-600 mb-2 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            Risks
          </h3>
          <ul className="space-y-1">
            {insights.risks.map((risk, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-yellow-600 mt-1">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-1">
            <Zap className="h-4 w-4" />
            Next Steps
          </h3>
          <ul className="space-y-1">
            {insights.nextMoves.map((move, i) => (
              <li key={i} className="text-sm text-muted flex items-start gap-1">
                <span className="text-primary mt-1">•</span>
                {move}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function StartupDetailPage() {
  const params = useParams();
  const { id } = params;
  const { user, token } = useAuth();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [roleRequestModalOpen, setRoleRequestModalOpen] = useState(false);

  const fetchStartup = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_URL}/api/startups/${id}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        const merged = {
          ...demoStartup,
          ...json.data,
          metrics: { ...demoStartup.metrics, ...(json.data.metrics || {}) },
          story: { ...demoStartup.story, ...(json.data.story || {}) },
          funding: { ...demoStartup.funding, ...(json.data.funding || {}) },
          aiInsights: { ...demoStartup.aiInsights, ...(json.data.aiInsights || {}) }
        };
        if (json.data.teamMembers && json.data.teamMembers.length > 0) {
          merged.founders = json.data.teamMembers.map(m => ({
            name: m.name,
            role: m.role || 'Team Member',
            bio: m.bio || 'Core startup team member.',
            avatar: m.image || null,
            _id: m.userId
          }));
        } else if (json.data.founderId) {
          merged.founders = [{
            name: json.data.founderId.name || 'Founder',
            role: 'CEO & Founder',
            bio: json.data.founderId.bio || 'Creator of this startup.',
            avatar: json.data.founderId.profileImage || null,
            _id: json.data.founderId._id || json.data.founderId
          }];
        }
        setStartup(merged);
        
        if (user && json.data.saves) {
          const hasSaved = json.data.saves.some(s => s.userId === user._id || s.userId?._id === user._id);
          setIsFollowing(hasSaved);
        }
      }
    } catch (err) {
      console.error('Error fetching startup:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStartup();
    }
  }, [id, token, user]);

  const handleFollowToggle = async () => {
    if (!token) {
      alert('Please log in to follow startups.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/startups/save/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.data);
        setStartup(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            followers: data.data ? prev.metrics.followers + 1 : Math.max(0, prev.metrics.followers - 1)
          }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-slate-500">
          Loading startup details...
        </div>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-slate-500">
          Startup not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StartupHeader 
          startup={startup} 
          isFollowing={isFollowing} 
          onFollow={handleFollowToggle} 
          onInterest={() => setInterestModalOpen(true)} 
          onApplyRequest={() => setRoleRequestModalOpen(true)}
        />
        <StartupMetrics metrics={startup.metrics} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProductShowcase startup={startup} />
            <StartupStory story={startup.story} />
            <FounderSection founders={startup.founders} />
            <StartupActivityFeed activity={startup.activity} />
          </div>
          
          <div className="space-y-6">
            <InvestorPanel funding={startup.funding} />
            <AIStartupInsights insights={startup.aiInsights} />
          </div>
        </div>
      </main>

      <SendInterestRequestModal
        isOpen={interestModalOpen}
        onClose={(success) => {
          setInterestModalOpen(false);
          if (success) fetchStartup();
        }}
        startup={startup}
      />

      <RoleRequestModal
        isOpen={roleRequestModalOpen}
        onClose={() => setRoleRequestModalOpen(false)}
        startupId={startup._id}
        onRoleRequestSent={fetchStartup}
      />
    </div>
  );
}

function InvestorInterestModal({ isOpen, onClose, startupId, onInterestSent }) {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/interest-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId,
          message,
          investmentRange
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Interest request sent to the founder!');
        onInterestSent();
        onClose();
      } else {
        alert(data.error || 'Failed to send interest request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending interest request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-slate-900 font-sans">Express Investment Interest</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 font-sans">Introduce Yourself & Your Interest</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi founder, I am interested in your startup..."
              className="w-full p-3 border rounded-xl text-sm h-28"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 font-sans">Typical Ticket/Investment Size</label>
            <input
              type="text"
              value={investmentRange}
              onChange={(e) => setInvestmentRange(e.target.value)}
              placeholder="e.g. $25,000 - $50,000"
              className="w-full p-2.5 border rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-2.5 rounded-xl font-bold font-sans disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Interest Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

function RoleRequestModal({ isOpen, onClose, startupId, onRoleRequestSent }) {
  const { token, user } = useAuth();
  const [requestType, setRequestType] = useState('Job');
  const [roleTitle, setRoleTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [resume, setResume] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [message, setMessage] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [reasonToJoin, setReasonToJoin] = useState('');
  const [loading, setLoading] = useState(false);

  // Prepopulate from user's job seeker profile
  useEffect(() => {
    if (user && user.jobSeekerProfile) {
      const p = user.jobSeekerProfile;
      setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills || ''));
      setResume(p.resume || '');
      setPortfolioLink(p.portfolioLink || '');
      setGithub(p.github || '');
      setLinkedin(p.linkedin || '');
      setExpectedSalary(p.expectedSalary || '');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/startups/${startupId}/role-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType,
          roleTitle,
          skills,
          resume,
          portfolioLink,
          github,
          linkedin,
          message,
          availabilityDate: availabilityDate || undefined,
          expectedSalary,
          reasonToJoin
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Role request sent to the founder!');
        if (onRoleRequestSent) onRoleRequestSent();
        onClose();
      } else {
        alert(data.error || 'Failed to send role request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending role request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center border-b p-5 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-900 font-sans">Apply / Send Request</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-lg"></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 font-sans text-sm text-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Request Type</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
                required
              >
                <option value="Internship">Internship</option>
                <option value="Job">Job</option>
                <option value="Co-founder">Co-founder</option>
                <option value="Team Member">Team Member</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Frontend Engineer, Marketing Lead"
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Skills (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, Growth Marketing"
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Resume Link or Upload Link</label>
              <input
                type="text"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="e.g. Google Drive / Dropbox link"
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Portfolio Link</label>
              <input
                type="text"
                value={portfolioLink}
                onChange={(e) => setPortfolioLink(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">GitHub Link</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">LinkedIn Link</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Availability Date</label>
              <input
                type="date"
                value={availabilityDate}
                onChange={(e) => setAvailabilityDate(e.target.value)}
                className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Stipend/Salary (yearly or monthly)</label>
            <input
              type="text"
              value={expectedSalary}
              onChange={(e) => setExpectedSalary(e.target.value)}
              placeholder="e.g. $100k/yr, $2k/mo"
              className="w-full p-2.5 border rounded-xl bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Why do you want to join this startup?</label>
            <textarea
              value={reasonToJoin}
              onChange={(e) => setReasonToJoin(e.target.value)}
              placeholder="Tell the founder why you're passionate about their mission..."
              className="w-full p-2.5 border rounded-xl h-20 bg-white text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Message to Founder (Cover Message)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Brief message..."
              className="w-full p-2.5 border rounded-xl h-20 bg-white text-slate-800"
            />
          </div>

          <div className="pt-4 border-t flex-shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-5 rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2 px-6 rounded-xl font-bold disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

