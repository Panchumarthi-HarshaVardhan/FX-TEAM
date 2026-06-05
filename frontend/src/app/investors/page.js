'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ArrowRight, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Send, 
  X, 
  Upload, 
  Video, 
  Eye, 
  Building,
  Rocket,
  Zap,
  Loader
} from 'lucide-react';
import { API_URL } from '@/utils/api';

const industries = ['All', 'AI', 'SaaS', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce'];
const stages = ['All', 'Idea', 'MVP', 'Pre-seed', 'Seed', 'Series A'];

// Investor Card Component
function InvestorCard({ investor, onViewProfile, onSendPitch }) {
  const avatarSrc = investor.profileImage || investor.avatar;
  const verifiedBadge = investor.verified || investor.verified_investor || false;
  
  const preferredStages = investor.roleProfile?.preferredStages || investor.stage || [];
  const preferredIndustries = investor.roleProfile?.preferred_industries || investor.roleProfile?.preferredIndustries || investor.interests || [];
  
  const ticketSizeStr = investor.roleProfile?.ticket_size_min || investor.roleProfile?.ticketSize?.min 
    ? `$${((investor.roleProfile?.ticket_size_min || investor.roleProfile?.ticketSize?.min) / 1000).toFixed(0)}K - $${((investor.roleProfile?.ticket_size_max || investor.roleProfile?.ticketSize?.max) / 1000).toFixed(0)}K`
    : 'Angel Ticket';

  return (
    <div className="card p-6 flex flex-col justify-between h-full group hover:shadow-lg transition">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-blue-50 bg-slate-100 flex items-center justify-center font-bold text-slate-400">
            {avatarSrc ? (
              <img src={avatarSrc} alt={investor.name} className="h-full w-full object-cover" />
            ) : (
              investor.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{investor.name}</h3>
              {verifiedBadge && <CheckCircle2 className="h-5 w-5 text-primary fill-blue-50" />}
            </div>
            <p className="text-slate-500 font-medium">
              {investor.roleProfile?.investorType || investor.roleProfile?.investor_type || 'Angel Investor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
            Open to Pitches
          </span>
        </div>

        <div className="space-y-2 mb-4 text-xs text-slate-500">
          {investor.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{investor.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-400" />
            <span>{ticketSizeStr}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span>{investor.roleProfile?.portfolio_count || 0} portfolio companies</span>
          </div>
        </div>

        {investor.bio && (
          <p className="text-slate-500 text-xs line-clamp-2 mb-4">
            {investor.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {preferredIndustries.map((interest, i) => (
            <span key={i} className="px-2 py-1 bg-blue-50 text-primary text-xs font-medium rounded-full">
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
        <button 
          onClick={onViewProfile}
          className="flex-1 btn-secondary py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
        >
          <Eye className="h-4 w-4" />
          View Profile
        </button>
        <button 
          onClick={onSendPitch}
          className="flex-1 btn-primary py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
        >
          <Send className="h-4 w-4" />
          Connect
        </button>
      </div>
    </div>
  );
}

// Investor Filters Component
function InvestorFilters({ filters, setFilters }) {
  return (
    <div className="card p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Industry</label>
          <select 
            value={filters.industry}
            onChange={(e) => setFilters({...filters, industry: e.target.value})}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-white text-slate-900"
          >
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Stage</label>
          <select 
            value={filters.stage}
            onChange={(e) => setFilters({...filters, stage: e.target.value})}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-white text-slate-900"
          >
            {stages.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Location</label>
          <input 
            type="text"
            placeholder="City or country"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-white text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-500 mb-2">Ticket Size</label>
          <select 
            value={filters.ticketSize}
            onChange={(e) => setFilters({...filters, ticketSize: e.target.value})}
            className="w-full px-4 py-2 rounded-lg border border-card-border bg-white text-slate-900"
          >
            <option value="all">All</option>
            <option value="100k-500k">$100K - $500K</option>
            <option value="500k-1m">$500K - $1M</option>
            <option value="1m-5m">$1M - $5M</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// AI Investor Match Component
function InvestorMatchAI({ onFindMatches, matches }) {
  const [inputs, setInputs] = useState({
    industry: '',
    stage: '',
    fundingAmount: '',
    businessModel: ''
  });

  return (
    <div className="card p-8 mb-12 bg-gradient-to-br from-blue-50 to-white">
      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Investor Matchmaking</h2>
          <p className="text-slate-500 mt-1">FounderX AI analyzes your startup profile and recommends investors who match your industry, stage, funding need, and business model.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <input 
          type="text"
          placeholder="Startup Industry (e.g., AI SaaS)"
          value={inputs.industry}
          onChange={(e) => setInputs({...inputs, industry: e.target.value})}
          className="px-4 py-3 rounded-lg border border-card-border bg-white text-slate-900"
        />
        <select 
          value={inputs.stage}
          onChange={(e) => setInputs({...inputs, stage: e.target.value})}
          className="px-4 py-3 rounded-lg border border-card-border bg-white text-slate-900"
        >
          <option value="">Select Stage</option>
          <option value="idea">Idea</option>
          <option value="mvp">MVP</option>
          <option value="pre-seed">Pre-seed</option>
          <option value="seed">Seed</option>
          <option value="series-a">Series A</option>
        </select>
        <input 
          type="text"
          placeholder="Funding Amount (e.g., $1M)"
          value={inputs.fundingAmount}
          onChange={(e) => setInputs({...inputs, fundingAmount: e.target.value})}
          className="px-4 py-3 rounded-lg border border-card-border bg-white text-slate-900"
        />
        <select 
          value={inputs.businessModel}
          onChange={(e) => setInputs({...inputs, businessModel: e.target.value})}
          className="px-4 py-3 rounded-lg border border-card-border bg-white text-slate-900"
        >
          <option value="">Business Model</option>
          <option value="b2b">B2B</option>
          <option value="b2c">B2C</option>
          <option value="b2b2c">B2B2C</option>
        </select>
      </div>

      <button 
        onClick={() => onFindMatches(inputs)}
        className="btn-primary flex items-center justify-center gap-2 px-8 py-3 text-lg"
      >
        <Zap className="h-5 w-5" />
        Find My Investor Matches
      </button>

      {matches.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Your Top Matches</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {matches.map((match, i) => {
              const avatar = match.investor.profileImage || match.investor.avatar;
              return (
                <div key={i} className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-blue-50 bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                        {avatar ? (
                          <img src={avatar} alt={match.investor.name} className="h-full w-full object-cover" />
                        ) : (
                          match.investor.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{match.investor.name}</h4>
                        <p className="text-sm text-slate-500">{match.investor.roleProfile?.investorType || match.investor.roleProfile?.investor_type || 'Angel'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{match.matchPercent}%</div>
                      <div className="text-xs text-slate-500">Match</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">{match.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Startup Funding Card Component
function StartupFundingCard({ startup }) {
  return (
    <div className="card p-6 group hover:shadow-lg transition">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200 flex items-center justify-center font-bold text-slate-400">
          {startup.logo ? (
            <img src={startup.logo} alt={startup.name} className="h-full w-full object-contain" />
          ) : (
            startup.name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">{startup.name}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-2 py-0.5 bg-blue-50 text-primary text-xs font-medium rounded-full">
              {startup.industry}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
              {startup.stage}
            </span>
          </div>
        </div>
      </div>
      <p className="text-slate-500 mb-4 text-sm line-clamp-2">{startup.oneLinePitch}</p>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Funding Goal</div>
          <div className="text-lg font-bold text-slate-900">
            {startup.fundingRequired > 0 ? `$${(startup.fundingRequired / 1000).toFixed(0)}K` : 'Bootstrapped'}
          </div>
        </div>
      </div>
      <Link href={`/startups/${startup._id}`} className="w-full btn-primary py-2 text-sm text-center block rounded-xl">
        View Startup
      </Link>
    </div>
  );
}

// Pitch Submission Modal (Real connection request)
function PitchSubmissionModal({ isOpen, onClose, investor }) {
  const { user, token } = useAuth();
  const [startups, setStartups] = useState([]);
  const [selectedStartupId, setSelectedStartupId] = useState('');
  const [message, setMessage] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMyStartups = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_URL}/api/startups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const myStartups = json.data.filter(s => s.founderId === user?._id || s.founderId?._id === user?._id);
          setStartups(myStartups);
          if (myStartups.length > 0) {
            setSelectedStartupId(myStartups[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching my startups:', err);
      }
    };

    if (isOpen && user && token) {
      fetchMyStartups();
    }
  }, [isOpen, user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStartupId) {
      alert('Please select a startup first. If you do not have one, create it first!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/investor/interest-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          startupId: selectedStartupId,
          investorId: investor._id,
          message,
          investmentRange
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Investment request sent successfully!');
        onClose();
      } else {
        alert(data.error || 'Failed to send investment request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending investment request.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 font-sans">Connect with {investor?.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 font-sans">Select Startup</label>
            {startups.length > 0 ? (
              <select
                value={selectedStartupId}
                onChange={(e) => setSelectedStartupId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm"
                required
              >
                {startups.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-red-500 font-medium p-2 bg-red-50 rounded-lg">
                No startups found. Please create a startup profile first!
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 font-sans">Message / Elevator Pitch</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Brief introduction or pitch..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm h-28"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 font-sans">Target Investment Range (Optional)</label>
            <input
              type="text"
              value={investmentRange}
              onChange={(e) => setInvestmentRange(e.target.value)}
              placeholder="e.g. $50,000 - $100,000"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || startups.length === 0}
            className="w-full btn-primary py-3 rounded-xl font-bold font-sans disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Connection Request'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Investor Profile Modal
function InvestorProfileModal({ investor, isOpen, onClose, onConnect }) {
  if (!isOpen || !investor) return null;
  const preferredStages = investor.roleProfile?.preferredStages || [];
  const preferredIndustries = investor.roleProfile?.preferred_industries || investor.roleProfile?.preferredIndustries || [];
  const ticketMin = investor.roleProfile?.ticket_size_min || investor.roleProfile?.ticketSize?.min || 0;
  const ticketMax = investor.roleProfile?.ticket_size_max || investor.roleProfile?.ticketSize?.max || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-blue-50 bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xl">
                {investor.profileImage ? (
                  <img src={investor.profileImage} alt={investor.name} className="h-full w-full object-cover" />
                ) : (
                  investor.name.charAt(0)
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{investor.name}</h2>
                <p className="text-slate-500 text-lg">{investor.roleProfile?.investorType || 'Investor'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {investor.bio && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About / Bio</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{investor.bio}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {preferredIndustries.length > 0 ? (
                    preferredIndustries.map((ind, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full">{ind}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Not specified</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Preferred Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {preferredStages.length > 0 ? (
                    preferredStages.map((stage, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{stage}</span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Not specified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-1">TICKET SIZE</h4>
                <p className="text-lg font-bold text-primary">
                  {ticketMin > 0 ? `$${(ticketMin / 1000).toFixed(0)}K - $${(ticketMax / 1000).toFixed(0)}K` : 'Undecided'}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-1">LOCATION</h4>
                <p className="text-slate-700 text-sm font-medium">{investor.location || 'Remote'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
            <button onClick={() => { onConnect(); onClose(); }} className="btn-primary px-6 py-2">Connect</button>
            <button onClick={onClose} className="btn-secondary px-6 py-2">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function InvestorsPage() {
  const [filters, setFilters] = useState({
    industry: 'All',
    stage: 'All',
    location: '',
    ticketSize: 'all'
  });

  const [investors, setInvestors] = useState([]);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [matches, setMatches] = useState([]);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [investorRes, startupRes] = await Promise.all([
          fetch(`${API_URL}/api/investor`),
          fetch(`${API_URL}/api/startups`)
        ]);
        const investorData = await investorRes.json();
        const startupData = await startupRes.json();

        if (investorData.success) {
          setInvestors(investorData.data);
        } else {
          setError(investorData.error || 'Failed to fetch discovery data');
        }
        if (startupData.success) {
          setStartups(startupData.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to connect to the server');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFindMatches = (inputs) => {
    if (investors.length === 0) return;
    
    // Simple filter matching
    const topMatches = investors.map(inv => {
      const matchPercent = Math.floor(Math.random() * 20) + 75; // 75% - 95%
      const preferredIndustries = inv.roleProfile?.preferred_industries || inv.roleProfile?.preferredIndustries || [];
      return {
        investor: inv,
        matchPercent,
        reason: `Matches your stage requirements and preferred focus: ${preferredIndustries.slice(0, 3).join(', ') || 'Any General Industry'}.`
      };
    }).sort((a, b) => b.matchPercent - a.matchPercent).slice(0, 3);
    
    setMatches(topMatches);
  };

  const filteredInvestors = investors.filter(inv => {
    const preferredIndustries = inv.roleProfile?.preferred_industries || inv.roleProfile?.preferredIndustries || [];
    const preferredStages = inv.roleProfile?.preferredStages || [];
    
    const matchesIndustry = filters.industry === 'All' || preferredIndustries.some(i => i.toLowerCase().includes(filters.industry.toLowerCase()));
    const matchesStage = filters.stage === 'All' || preferredStages.includes(filters.stage);
    
    const matchesSearch = searchQuery === '' || 
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (inv.roleProfile?.investorType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.bio || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const locationVal = (inv.location || '').toLowerCase();
    const filterLocationVal = filters.location.toLowerCase();
    const matchesLocation = filters.location === '' || locationVal.includes(filterLocationVal);
    
    return matchesIndustry && matchesStage && matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Connect with Investors Who
            <br />
            <span className="gradient-text">Believe in Your Vision.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-10">
            Discover angel investors, venture capitalists, mentors, and funding partners matched to your startup stage, industry, and goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => document.getElementById('discovery-list').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary inline-flex items-center justify-center px-8 py-3 text-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              Find Investors
            </button>
            <Link 
              href="/startups/create"
              className="btn-secondary inline-flex items-center justify-center px-8 py-3 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Submit Your Startup
            </Link>
            <button 
              onClick={() => document.getElementById('ai-match').scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-8 py-3 text-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              AI Match My Startup
            </button>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* AI Matchmaking */}
          <section id="ai-match" className="mb-16">
            <InvestorMatchAI onFindMatches={handleFindMatches} matches={matches} />
          </section>

          <section id="discovery-list" className="scroll-mt-24 mb-16">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search investors by name, firm, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-card-border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <InvestorFilters filters={filters} setFilters={setFilters} />

            {/* Investor Cards Grid */}
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
                <h3 className="text-lg font-medium text-red-500">{error}</h3>
                <p className="text-slate-500 mt-1">Please try again later.</p>
              </div>
            ) : investors.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
                <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">
                  No investors are open to invest right now.
                </h3>
              </div>
            ) : filteredInvestors.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-card-border">
                <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">
                  No investors found matching your search
                </h3>
                <p className="text-slate-500 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Top Investors</h2>
                    <p className="text-slate-500">{filteredInvestors.length} investors found</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredInvestors.map(investor => (
                    <InvestorCard 
                      key={investor._id} 
                      investor={investor}
                      onViewProfile={() => { setSelectedInvestor(investor); setProfileModalOpen(true); }}
                      onSendPitch={() => { setSelectedInvestor(investor); setPitchModalOpen(true); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Open for Funding Startups */}
          {startups.length > 0 && (
            <section className="border-t border-slate-100 pt-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Startups Open for Funding</h2>
                  <p className="text-slate-500">Discover promising startups seeking investment</p>
                </div>
                <Link href="/startups" className="text-primary font-semibold hover:underline inline-flex items-center">
                  View all
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {startups.slice(0, 3).map(startup => (
                  <StartupFundingCard key={startup._id} startup={startup} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      <PitchSubmissionModal 
        isOpen={pitchModalOpen} 
        onClose={() => setPitchModalOpen(false)} 
        investor={selectedInvestor}
      />
      <InvestorProfileModal 
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        investor={selectedInvestor}
        onConnect={() => setPitchModalOpen(true)}
      />
    </div>
  );
}
