'use client';

import Navbar from '../components/Navbar';
import Feed from '../components/Feed';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  Rocket,
  Zap,
  ShieldCheck,
  MessageSquare,
  DollarSign,
  Video,
  Handshake
} from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Feed />
      </div>
    );
  }

  const stats = [
    { number: '10K+', label: 'Founders' },
    { number: '5K+', label: 'Investors' },
    { number: '2K+', label: 'Startups' },
    { number: '$50M+', label: 'Funded' }
  ];

  const features = [
    {
      icon: <Rocket className="h-6 w-6 text-primary" />,
      title: 'Pitch Your Idea',
      description: 'Create a stunning startup profile, share updates, and build a following from day one.'
    },
    {
      icon: <Video className="h-6 w-6 text-primary-light" />,
      title: 'Viral Pitch Videos',
      description: 'Upload short and long-form startup videos for the feed and watch experience.'
    },
    {
      icon: <Handshake className="h-6 w-6 text-primary" />,
      title: 'Connect & Fundraise',
      description: 'Meet founders, investors, collaborators, and early supporters in one place.'
    }
  ];

  const founderProfiles = [
    { 
      name: 'Sarah Chen', 
      role: 'Founder & CEO', 
      startup: 'Nexus AI', 
      image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20asian%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      followers: '2.4K'
    },
    { 
      name: 'Marcus Johnson', 
      role: 'Tech Founder', 
      startup: 'BlockVault', 
      image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20black%20male%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      followers: '1.8K'
    },
    { 
      name: 'Emily Rodriguez', 
      role: 'Startup Founder', 
      startup: 'GreenLeaf', 
      image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20a%20confident%20hispanic%20female%20founder%2C%20headshot%2C%20neutral%20background&image_size=square',
      followers: '3.1K'
    }
  ];

  const startups = [
    { 
      name: 'Nexus AI', 
      industry: 'Artificial Intelligence', 
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20AI%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Series A',
      raised: '$12M'
    },
    { 
      name: 'BlockVault', 
      industry: 'Fintech', 
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20fintech%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Seed',
      raised: '$3.5M'
    },
    { 
      name: 'GreenLeaf', 
      industry: 'Sustainability', 
      logo: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=minimal%20modern%20sustainability%20startup%20logo%2C%20blue%20and%20white%2C%20clean%20design&image_size=square',
      stage: 'Pre-seed',
      raised: '$750K'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-primary text-sm font-medium mb-8 border border-blue-100">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            The #1 Professional Network for Founders
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-8 leading-tight">
            Pitch Your Idea.
            <br />
            <span className="gradient-text">Find Your Next Investor.</span>
          </h1>

          <p className="mt-4 max-w-3xl mx-auto text-xl text-muted mb-12 leading-relaxed">
            FounderX is where startups are born. Share your journey, post pitch videos, and connect with investors who believe in your vision.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/auth/signup" className="btn-primary inline-flex items-center justify-center px-8 py-4 text-lg">
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link href="/watch" className="btn-secondary inline-flex items-center justify-center px-8 py-4 text-lg">
              <Video className="h-5 w-5 mr-2" />
              Explore Pitches
            </Link>
          </div>

          {/* Trust Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">{stat.number}</div>
                <div className="text-muted font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need to Succeed</h2>
              <p className="text-muted text-lg max-w-2xl mx-auto">From pitching to fundraising, FounderX has all the tools to build your startup.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="card p-8">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder Profiles Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Meet Our Founders</h2>
              <p className="text-muted text-lg">Connect with visionary founders building the future.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {founderProfiles.map((founder, index) => (
                <div key={index} className="card p-6 text-center">
                  <div className="h-24 w-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-blue-50">
                    <img src={founder.image} alt={founder.name} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{founder.name}</h3>
                  <p className="text-primary font-medium mb-1">{founder.role}</p>
                  <p className="text-muted text-sm mb-4">{founder.startup}</p>
                  <div className="flex items-center justify-center text-muted text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {founder.followers} followers
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Startup Pitch Cards Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trending Startups</h2>
                <p className="text-muted text-lg">Discover the next big thing in innovation.</p>
              </div>
              <Link href="/startups" className="text-primary font-semibold hover:underline inline-flex items-center">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {startups.map((startup, index) => (
                <div key={index} className="card p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden">
                      <img src={startup.logo} alt={startup.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold">
                      {startup.stage}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">{startup.name}</h3>
                  <p className="text-muted mb-6">{startup.industry}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wider mb-1">Raised</p>
                      <p className="text-xl font-bold text-foreground">{startup.raised}</p>
                    </div>
                    <Link href={`/startups/${index}`} className="btn-primary px-4 py-2 text-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-primary via-primary-light to-primary-dark rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Journey?</h2>
                <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                  Join thousands of founders and investors already building the future on FounderX.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/auth/signup" className="bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition inline-flex items-center justify-center">
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                  <Link href="/startups" className="border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition inline-flex items-center justify-center">
                    Explore Startups
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="text-2xl font-bold gradient-text mb-4">FounderX</div>
              <p className="text-muted mb-6">The professional social network for founders and investors.</p>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-muted">
                <li><Link href="/features" className="hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-muted">
                <li><Link href="/about" className="hover:text-primary">About</Link></li>
                <li><Link href="/careers" className="hover:text-primary">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-muted">
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted text-sm mb-4 md:mb-0">© 2026 FounderX. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-muted hover:text-primary transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
              </Link>
              <Link href="#" className="text-muted hover:text-primary transition">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
