'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
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
  Eye,
  Bookmark,
  Calendar,
  Briefcase,
  MapPin,
  ChevronRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

// Demo startup data for fallback/story info
const demoStartup = {
  story: {
    problem: 'Founders spend weeks creating pitch decks that investors don\'t read',
    solution: 'AI helps create professional pitch decks in minutes, not weeks',
    vision: 'To become the standard way startups fundraise globally',
    market: '$100B+ global venture capital market',
    whyNow: 'AI technology is now advanced enough to create high-quality content automatically'
  },
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
function StartupHeader({ startup, isFollowing, isSaved, onFollow, onSave, onInterest }) {
  const logoSrc = getSafeImageSrc(startup.logo);
  const { user } = useAuth();
  
  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-150 bg-white flex items-center justify-center">
          {logoSrc ? (
            <img src={logoSrc} alt={startup.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-blue-50 flex items-center justify-center text-primary font-bold text-3xl font-sans">
              {startup.name?.charAt(0)}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-heading font-sans">{startup.name}</h1>
            {startup.verified && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
            {startup.raisingFunds && user?.role !== 'user' && user?.role !== 'job_seeker' && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">
                <DollarSign className="h-3 w-3" />
                Raising Funds
              </span>
            )}
            <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full font-sans">
              {startup.stage}
            </span>
            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full font-sans">
              {startup.industry}
            </span>
          </div>
          
          <p className="text-base text-body mb-4 font-sans leading-relaxed">{startup.oneLinePitch || startup.tagline}</p>
          
          <div className="flex flex-wrap gap-3">
            {/* Follow/Unfollow Button */}
            <button 
              onClick={onFollow} 
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all border ${
                isFollowing 
                  ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' 
                  : 'bg-primary hover:bg-blue-600 text-white border-primary shadow-sm'
              }`}
            >
              <Users className="h-4 w-4" />
              {isFollowing ? 'Connected' : 'Connect'}
            </button>

            {/* Save/Unsave Button */}
            <button 
              onClick={onSave} 
              className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all border ${
                isSaved 
                  ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm' 
                  : 'bg-white text-slate-700 border-slate-250 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {isSaved ? 'Saved' : 'Save Startup'}
            </button>
            
            {user && user.role === 'investor' && (
              <button onClick={onInterest} className="btn-secondary text-xs md:text-sm px-4 py-2 font-bold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Investor Interested
              </button>
            )}
            
            {startup.website && (
              <a 
                href={startup.website.startsWith('http') ? startup.website : `https://${startup.website}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary text-xs md:text-sm px-4 py-2 font-bold flex items-center gap-1.5"
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
    { icon: Users, label: 'Followers', value: (metrics.followers || 0).toLocaleString() },
    { icon: TrendingUp, label: 'Monthly Growth', value: `${metrics.monthlyGrowth || 24}%`, color: 'text-green-600' },
    { icon: Users, label: 'Active Users', value: (metrics.activeUsers || 3421).toLocaleString() },
    { icon: DollarSign, label: 'Revenue', value: `$${((metrics.revenue || 45000) / 1000).toFixed(0)}K` },
    { icon: DollarSign, label: 'Funding Raised', value: `$${((metrics.fundingRaised || 2000000) / 1000000).toFixed(1)}M` },
    { icon: Users, label: 'Investor Interest', value: metrics.investorInterest || 42 },
    { icon: TrendingUp, label: 'Upvotes', value: (metrics.upvotes || 892).toLocaleString() }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
      {metricItems.map((item, i) => (
        <div key={i} className="card p-4 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
          <item.icon className={`h-5 w-5 mx-auto mb-2 ${item.color || 'text-primary'}`} />
          <div className="text-lg font-bold text-heading font-sans">{item.value}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider font-semibold font-sans mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// Product Showcase Component
function ProductShowcase({ startup }) {
  const defaultImages = [
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20pitch%20deck%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  ];
  
  const images = startup.productImages && startup.productImages.length > 0 ? startup.productImages : defaultImages;
  const features = startup.features && startup.features.length > 0 ? startup.features : [
    'AI-powered template suggestions',
    'Real-time pitch deck analytics',
    'Investor feedback simulator',
    'Collaboration tools for teams',
    'Export to PDF and PowerPoint'
  ];

  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans">
        <Eye className="h-5 w-5 text-primary" />
        Product Showcase
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {images.map((img, i) => {
          const imgSrc = getSafeImageSrc(img);
          return (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
              {imgSrc && <img src={imgSrc} alt={`Product ${i + 1}`} className="w-full h-auto max-h-56 object-cover" />}
            </div>
          );
        })}
      </div>
      
      <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider font-sans">Key Features</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {features.map((feature, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-xl flex items-center gap-2 border border-slate-100">
            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-xs text-heading font-medium">{feature}</span>
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
    { title: 'Market Size & Opportunity', content: story.market },
    { title: 'Why Now?', content: story.whyNow }
  ];

  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 font-sans">Startup Story</h2>
      <div className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="border-b last:border-b-0 pb-3 last:pb-0">
            <h3 className="font-bold text-slate-850 text-sm mb-1 font-sans">{section.title}</h3>
            <p className="text-body text-xs md:text-sm leading-relaxed font-sans">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Founder Section Component
function FounderSection({ founders, isFollowingFounder, onFollowFounder, canMessageFounder, onMessageFounder }) {
  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans">
        <Users className="h-5 w-5 text-primary" />
        Founding Team
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {founders.map((founder, i) => {
          const avatarSrc = getSafeImageSrc(founder.avatar);
          return (
            <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-slate-100 flex items-start gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 bg-blue-50 border border-slate-150 flex items-center justify-center">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={founder.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-bold text-xl font-sans">
                    {founder.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-heading truncate font-sans">{founder.name}</h4>
                <p className="text-xs text-primary font-bold mb-2 font-sans">{founder.role}</p>
                <p className="text-xs text-muted leading-relaxed font-sans line-clamp-3 mb-3">{founder.bio}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button 
                    onClick={() => onFollowFounder(founder._id)} 
                    className={`px-3 py-1.5 text-xs rounded-lg font-bold transition border ${
                      isFollowingFounder 
                        ? 'bg-slate-150 text-slate-700 border-slate-200 hover:bg-slate-200' 
                        : 'bg-primary text-white border-primary hover:bg-blue-600 shadow-xs'
                    }`}
                  >
                    {isFollowingFounder ? 'Connected' : 'Connect'}
                  </button>
                  
                  <button 
                    disabled={!canMessageFounder}
                    onClick={() => {
                      if (canMessageFounder) {
                        onMessageFounder(founder._id);
                      }
                    }}
                    title={!canMessageFounder ? "Messaging unlocks after your application is accepted, founder connects with you, or both users follow each other." : ""}
                    className={`px-3 py-1.5 text-xs border rounded-lg font-bold flex items-center gap-1 transition-all ${
                      canMessageFounder 
                        ? 'bg-white text-slate-700 border-slate-250 hover:bg-slate-50' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
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

// Open Roles Section for Job Seekers
function OpenRolesSection({ jobs, appliedJobIds, onApplyClick }) {
  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans border-b pb-3">
        <Briefcase className="h-5 w-5 text-primary" />
        Open Roles ({jobs.length})
      </h2>
      
      {jobs.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No open roles currently posted for this startup.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const hasApplied = appliedJobIds.includes(job._id);
            return (
              <div key={job._id} className="p-5 bg-gray-50 rounded-2xl border border-slate-100 flex flex-col justify-between hover:shadow-xs transition">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-heading text-base font-sans leading-snug">{job.title}</h3>
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider font-sans">
                      {job.roleType}
                    </span>
                  </div>
                  
                  {/* Meta items */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-655 font-sans mb-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                      <span>{job.workMode} ({job.location || 'Remote'})</span>
                    </div>
                    {job.duration && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>Duration: {job.duration}</span>
                      </div>
                    )}
                    {(job.salaryMin || job.salaryMax) && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {job.salaryMin ? `$${Number(job.salaryMin).toLocaleString()}` : ''} 
                          {job.salaryMax ? ` - $${Number(job.salaryMax).toLocaleString()}` : ''}
                        </span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>Apply by: {format(new Date(job.deadline), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills tags */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 font-sans">Skills Required</p>
                      <div className="flex flex-wrap gap-1">
                        {job.requiredSkills.map((sk, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-700 font-medium rounded text-[10px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.description && (
                    <p className="text-xs text-muted leading-relaxed font-sans line-clamp-3 mb-4">
                      {job.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-150">
                  {hasApplied ? (
                    <button
                      disabled
                      className="w-full py-2 bg-green-50 text-green-700 border border-green-200 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => onApplyClick(job)}
                      className="w-full py-2 bg-primary hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Investor Panel Component
function InvestorPanel({ funding, startup, onInterest }) {
  const { addToast } = useToast();

  const handleViewPitchDeck = () => {
    if (startup?.pitchDeck) {
      const url = startup.pitchDeck.startsWith('http') ? startup.pitchDeck : `https://${startup.pitchDeck}`;
      window.open(url, '_blank');
    } else {
      addToast('No pitch deck available for this startup.', 'info');
    }
  };

  return (
    <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans">
        <DollarSign className="h-5 w-5 text-primary" />
        Investor Information
      </h2>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded-xl border border-blue-50">
          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1 font-sans">Stage</div>
          <div className="text-lg font-bold text-heading font-sans">{funding.stage || 'Seed'}</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-blue-50">
          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1 font-sans">Seeking</div>
          <div className="text-lg font-bold text-primary font-sans">
            ${((funding.seekingAmount || 2000000) / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-blue-50">
          <div className="text-[10px] text-muted uppercase tracking-wider font-bold mb-1 font-sans">Use of Funds</div>
          <div className="text-xs font-semibold text-heading font-sans">{funding.useOfFunds || 'Product & Growth'}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button onClick={handleViewPitchDeck} className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          View Pitch Deck
        </button>
        <button onClick={onInterest} className="btn-secondary text-xs font-bold px-4 py-2 flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4" />
          Request Intro
        </button>
      </div>
    </div>
  );
}

// Startup Activity Feed Component
function StartupActivityFeed({ activity }) {
  return (
    <div className="card p-6 mb-6 bg-white border border-gray-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans">
        <Clock className="h-5 w-5 text-primary" />
        Recent Activity
      </h2>
      
      <div className="space-y-3">
        {activity.map((item, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-xl border border-slate-100 flex items-start gap-3">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {item.type === 'launch' && <Rocket className="h-4 w-4 text-purple-600 animate-pulse" />}
                {item.type === 'funding' && <DollarSign className="h-4 w-4 text-green-600" />}
                {item.type === 'update' && <TrendingUp className="h-4 w-4 text-primary" />}
                <span className="font-semibold text-heading text-sm font-sans">{item.title}</span>
              </div>
              <div className="text-[10px] text-muted mt-1 font-sans">
                {item.date instanceof Date ? item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : format(new Date(item.date), 'MMM d, yyyy')}
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
    <div className="card p-6 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-heading mb-4 flex items-center gap-2 font-sans">
        <Sparkles className="h-5 w-5 text-purple-600" />
        FounderX AI Analysis
      </h2>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold font-sans shadow-md">
          {insights.score}
        </div>
        <div>
          <div className="text-base font-bold text-heading font-sans">AI Score</div>
          <div className="text-xs text-muted font-sans font-medium">Out of 100</div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <h3 className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1 font-sans">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Strengths
          </h3>
          <ul className="space-y-1">
            {insights.strengths.map((strength, i) => (
              <li key={i} className="text-xs text-muted flex items-start gap-1 font-sans">
                <span className="text-green-600 mt-0.5">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-xs font-bold text-yellow-600 mb-2 flex items-center gap-1 font-sans">
            <ShieldCheck className="h-3.5 w-3.5" />
            Risks
          </h3>
          <ul className="space-y-1">
            {insights.risks.map((risk, i) => (
              <li key={i} className="text-xs text-muted flex items-start gap-1 font-sans">
                <span className="text-yellow-600 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-xs font-bold text-primary mb-2 flex items-center gap-1 font-sans">
            <Zap className="h-3.5 w-3.5" />
            Next Steps
          </h3>
          <ul className="space-y-1">
            {insights.nextMoves.map((move, i) => (
              <li key={i} className="text-xs text-muted flex items-start gap-1 font-sans">
                <span className="text-primary mt-0.5">•</span>
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
  const router = useRouter();
  const { id } = params;
  const { user, token } = useAuth();
  const { addToast } = useToast();

  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowingFounder, setIsFollowingFounder] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  
  // Modals state
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);

  const fetchStartup = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`http://localhost:3000/api/startups/${id}`, { headers });
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
        
        // Sync relations from permissions object
        if (json.data.permissions) {
          setIsFollowing(json.data.permissions.canFollowed || false);
          setIsSaved(json.data.permissions.canSaved || false);
        }

        // Initialize follow founder state
        if (json.data.founderId && user) {
          const founderObj = json.data.founderId;
          const isFollowingF = founderObj.followers && founderObj.followers.some(fId => (fId._id || fId).toString() === user._id.toString());
          setIsFollowingFounder(!!isFollowingF);
        }
      }
    } catch (err) {
      console.error('Error fetching startup:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/startups/${id}/jobs`);
      const json = await res.json();
      if (json.success && json.data) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchAppliedJobs = async () => {
    if (!token || (user?.role !== 'user' && user?.role !== 'job_seeker')) return;
    try {
      const res = await fetch('http://localhost:3000/api/user/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        const ids = json.data.map(app => app.jobId?._id || app.jobId);
        setAppliedJobIds(ids);
      }
    } catch (err) {
      console.error('Error fetching applications status:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchStartup();
      fetchJobs();
    }
  }, [id, token, user]);

  useEffect(() => {
    if (token && (user?.role === 'user' || user?.role === 'job_seeker')) {
      fetchAppliedJobs();
    }
  }, [token, user]);

  const handleFollowToggle = async () => {
    if (!token) {
      addToast('Please log in to follow startups.', 'error');
      return;
    }
    const method = isFollowing ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`http://localhost:3000/api/startups/${startup._id}/follow`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(!isFollowing);
        addToast(isFollowing ? 'Unfollowed startup' : 'Following startup!', 'success');
        setStartup(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            followers: !isFollowing ? prev.metrics.followers + 1 : Math.max(0, prev.metrics.followers - 1)
          }
        }));
      }
    } catch (err) {
      console.error(err);
      addToast('Error following startup', 'error');
    }
  };

  const handleSaveToggle = async () => {
    if (!token) {
      addToast('Please log in to save startups.', 'error');
      return;
    }
    const method = isSaved ? 'DELETE' : 'POST';
    try {
      const res = await fetch(`http://localhost:3000/api/startups/${startup._id}/save`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(!isSaved);
        addToast(isSaved ? 'Startup unsaved' : 'Startup saved to bookmarks!', 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Error saving startup', 'error');
    }
  };

  const handleFollowFounderToggle = async (founderId) => {
    if (!token) {
      addToast('Please log in to follow the founder.', 'error');
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/api/users/${founderId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowingFounder(data.data.isFollowing);
        addToast(data.data.isFollowing ? 'Following Founder!' : 'Unfollowed Founder', 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Error following founder', 'error');
    }
  };

  const handleMessageFounder = (founderId) => {
    router.push(`/messages?userId=${founderId}`);
  };

  const handleApplyClick = (job) => {
    if (!token) {
      addToast('Please log in to apply for roles.', 'error');
      return;
    }
    setSelectedJobForApply(job);
    setApplyModalOpen(true);
  };

  const handleApplicationSubmitted = () => {
    fetchAppliedJobs();
    addToast('Application submitted successfully!', 'success');
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

  const mainFounderId = startup.founderId?._id || startup.founderId;
  const canMessageFounder = startup.permissions?.canMessageFounder || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <StartupHeader 
          startup={startup} 
          isFollowing={isFollowing} 
          isSaved={isSaved}
          onFollow={handleFollowToggle} 
          onSave={handleSaveToggle}
          onInterest={() => setInterestModalOpen(true)} 
        />
        <StartupMetrics metrics={startup.metrics} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Open Roles section displayed in main column for Job Seekers */}
            {(user?.role === 'user' || user?.role === 'job_seeker') && (
              <OpenRolesSection 
                jobs={jobs} 
                appliedJobIds={appliedJobIds} 
                onApplyClick={handleApplyClick} 
              />
            )}
            
            <ProductShowcase startup={startup} />
            <StartupStory story={startup.story} />
            
            <FounderSection 
              founders={startup.founders} 
              isFollowingFounder={isFollowingFounder}
              onFollowFounder={handleFollowFounderToggle}
              canMessageFounder={canMessageFounder}
              onMessageFounder={handleMessageFounder}
            />
            <StartupActivityFeed activity={startup.activity || []} />
          </div>
          
          <div className="space-y-6">
            {/* Hide InvestorPanel for Job Seeker role */}
            {user?.role !== 'user' && user?.role !== 'job_seeker' && <InvestorPanel funding={startup.funding} startup={startup} onInterest={() => setInterestModalOpen(true)} />}
            <AIStartupInsights insights={startup.aiInsights} />
          </div>
        </div>
      </main>

      <InvestorInterestModal
        isOpen={interestModalOpen}
        onClose={() => setInterestModalOpen(false)}
        startupId={startup._id}
        onInterestSent={fetchStartup}
      />

      {applyModalOpen && selectedJobForApply && (
        <JobApplyModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          job={selectedJobForApply}
          startupName={startup.name}
          onSuccess={handleApplicationSubmitted}
        />
      )}
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
      const res = await fetch('http://localhost:3000/api/investor/interest-request', {
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
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

// Job Application Modal Component
function JobApplyModal({ isOpen, onClose, job, startupName, onSuccess }) {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    resume: '',
    coverLetter: '',
    portfolioLink: '',
    github: '',
    linkedin: '',
    expectedSalary: '',
    availabilityDate: '',
    reasonToJoin: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.jobSeekerProfile) {
      const profile = user.jobSeekerProfile;
      setForm({
        resume: profile.resume || '',
        coverLetter: '',
        portfolioLink: profile.portfolioLink || '',
        github: profile.github || '',
        linkedin: profile.linkedin || '',
        expectedSalary: profile.expectedSalary || '',
        availabilityDate: '',
        reasonToJoin: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3000/api/jobs/${job._id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Failed to submit application.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">Apply for {job.title}</h3>
            <p className="text-xs text-muted mt-0.5">Startup: {startupName} • Role Type: {job.roleType}</p>
          </div>
          <button 
            onClick={onClose} 
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Resume Link / URL</label>
            <input
              type="text"
              required
              placeholder="Link to your Google Drive resume, Dropbox, or PDF link"
              value={form.resume}
              onChange={(e) => setForm({ ...form, resume: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Expected Stipend/Salary</label>
              <input
                type="text"
                placeholder="e.g. $500/mo, $50,000/yr"
                value={form.expectedSalary}
                onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Availability Date</label>
              <input
                type="date"
                required
                value={form.availabilityDate}
                onChange={(e) => setForm({ ...form, availabilityDate: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Portfolio</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.portfolioLink}
                onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">GitHub</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={form.github}
                onChange={(e) => setForm({ ...form, github: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">LinkedIn</label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={form.linkedin}
                onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Why do you want to join this startup?</label>
            <textarea
              required
              rows={3}
              placeholder="Explain why you are interested in this specific startup and how you can add value."
              value={form.reasonToJoin}
              onChange={(e) => setForm({ ...form, reasonToJoin: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider font-sans">Cover Letter / Message (Optional)</label>
            <textarea
              rows={3}
              placeholder="Any additional information, experience, or details you want to share."
              value={form.coverLetter}
              onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold bg-primary text-white hover:bg-blue-600 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
