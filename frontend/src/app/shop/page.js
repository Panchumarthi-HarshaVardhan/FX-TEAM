'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  Eye, 
  ExternalLink, 
  X, 
  Upload, 
  Video, 
  Send,
  Rocket,
  Zap,
  Star,
  Users,
  TrendingUp,
  Newspaper,
  Brain,
  CheckCircle2
} from 'lucide-react';

// Demo data
const demoProducts = [
  {
    id: 1,
    name: 'PitchDeck Pro',
    tagline: 'AI-powered pitch deck generator for startups',
    category: 'Templates',
    price: 49,
    free: false,
    founder: 'Sarah Chen',
    startup: 'Nexus AI',
    upvotes: 1247,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20pitch%20deck%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 2,
    name: 'SEO Optimizer AI',
    tagline: 'Automated SEO tools for SaaS startups',
    category: 'AI Tools',
    price: 0,
    free: true,
    founder: 'Marcus Johnson',
    startup: 'BlockCapital',
    upvotes: 892,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20SEO%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 3,
    name: 'Founder OS',
    tagline: 'Complete operating system for early-stage founders',
    category: 'Founder Tools',
    price: 99,
    free: false,
    founder: 'Emily Rodriguez',
    startup: 'GreenLeaf',
    upvotes: 2341,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20founder%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 4,
    name: 'Investor Outreach Kit',
    tagline: 'Email templates and outreach strategy for fundraising',
    category: 'Templates',
    price: 29,
    free: false,
    founder: 'David Kim',
    startup: 'K2 Partners',
    upvotes: 567,
    builtOnFounderX: false,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20email%20template%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 5,
    name: 'Social Media Manager',
    tagline: 'AI social media content creator for startups',
    category: 'Marketing',
    price: 19,
    free: false,
    founder: 'Jessica Williams',
    startup: 'SocialFlow',
    upvotes: 1123,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20social%20media%20dashboard%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 6,
    name: 'Financial Model Template',
    tagline: '5-year financial projection template for SaaS',
    category: 'Finance',
    price: 39,
    free: false,
    founder: 'Michael Brown',
    startup: 'FinancePro',
    upvotes: 789,
    builtOnFounderX: false,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20financial%20spreadsheet%20dashboard%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 7,
    name: 'Design System Kit',
    tagline: 'Complete UI component library for SaaS products',
    category: 'Design',
    price: 79,
    free: false,
    founder: 'Lisa Anderson',
    startup: 'DesignHub',
    upvotes: 1567,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20UI%20design%20system%20preview%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 8,
    name: 'Productivity Suite',
    tagline: 'AI-powered productivity tools for founders',
    category: 'Productivity',
    price: 0,
    free: true,
    founder: 'Tom Harris',
    startup: 'ProductiveX',
    upvotes: 2109,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20productivity%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 9,
    name: 'Startup Legal Kit',
    tagline: 'Essential legal documents for early-stage startups',
    category: 'Templates',
    price: 149,
    free: false,
    founder: 'Rachel Lee',
    startup: 'LegalStart',
    upvotes: 432,
    builtOnFounderX: false,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20legal%20document%20templates%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 10,
    name: 'Customer Analytics AI',
    tagline: 'AI customer insights and analytics platform',
    category: 'SaaS',
    price: 129,
    free: false,
    founder: 'Chris Martinez',
    startup: 'AnalyticsPro',
    upvotes: 987,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20analytics%20dashboard%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 11,
    name: 'Indie Hacker Toolkit',
    tagline: 'Complete toolkit for indie hackers and solo founders',
    category: 'Indie Hacker Tools',
    price: 59,
    free: false,
    founder: 'Alex Thompson',
    startup: 'IndieKit',
    upvotes: 1876,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20indie%20hacker%20toolkit%20dashboard%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  },
  {
    id: 12,
    name: 'AI Writing Assistant',
    tagline: 'AI copywriter for marketing and sales content',
    category: 'AI Tools',
    price: 0,
    free: true,
    founder: 'Nina Patel',
    startup: 'WriteAI',
    upvotes: 3421,
    builtOnFounderX: true,
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20AI%20writing%20assistant%20interface%2C%20blue%20and%20white%2C%20clean%20design&image_size=square'
  }
];

const categories = [
  'All Products', 'AI Tools', 'SaaS', 'Templates', 'Courses', 
  'Founder Tools', 'Productivity', 'Marketing', 'Finance', 'Design'
];

// Product Card Component
function ProductCard({ product, onViewDetails }) {
  return (
    <div className="card p-4 flex flex-col">
      <div className="relative mb-4">
        <div className="h-48 rounded-xl overflow-hidden bg-gray-50">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        {product.free && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
            Free
          </span>
        )}
        {product.builtOnFounderX && (
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Built on FounderX
          </span>
        )}
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-bold text-foreground mb-1">{product.name}</h3>
        <p className="text-sm text-muted mb-2">{product.tagline}</p>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
            {product.category}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Users className="h-4 w-4" />
            <span>by {product.founder}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-foreground font-bold">
            <TrendingUp className="h-4 w-4 text-primary" />
            {product.upvotes}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-primary">
            {product.free ? 'Free' : `$${product.price}`}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onViewDetails}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Details
            </button>
            <button className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
              <ExternalLink className="h-4 w-4" />
              Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Featured Product Component
function FeaturedProduct({ product }) {
  return (
    <div className="card p-8 bg-gradient-to-br from-blue-50 to-white mb-12">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">
              Featured
            </span>
            {product.builtOnFounderX && (
              <span className="px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Built on FounderX
              </span>
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-2">{product.name}</h2>
          <p className="text-lg text-muted mb-4">{product.tagline}</p>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">by</span>
              <span className="font-bold text-foreground">{product.founder}</span>
              <span className="text-muted">·</span>
              <span className="text-primary font-medium">{product.startup}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary">
              {product.free ? 'Free' : `$${product.price}`}
            </div>
            <div className="flex items-center gap-1 text-foreground font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              {product.upvotes} upvotes
            </div>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button className="btn-primary px-8 py-3 text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              View Product
            </button>
            <button className="btn-secondary px-8 py-3 text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Visit Website
            </button>
          </div>
        </div>
        
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <img src={product.image} alt={product.name} className="w-full h-auto" />
        </div>
      </div>
    </div>
  );
}

// AI Product Finder Component
function AIProductFinder({ onFindProducts, recommendations }) {
  const [query, setQuery] = useState('');
  const exampleQueries = [
    "Find AI tools for students",
    "Find startup tools for marketing",
    "Find SaaS products for small businesses",
    "Find pitch deck templates"
  ];

  return (
    <div className="card p-8 mb-12 bg-gradient-to-br from-purple-50 to-white">
      <div className="flex items-start gap-4 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Product Finder</h2>
          <p className="text-muted mt-1">
            Tell FounderX AI what you need, and it will recommend the best startup-built products.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input 
          type="text"
          placeholder="What are you looking for? (e.g., 'AI tools for marketing')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-card-border bg-white text-foreground"
        />
        <button 
          onClick={() => onFindProducts(query)}
          className="btn-primary px-6 py-3 flex items-center gap-2"
        >
          <Zap className="h-5 w-5" />
          Find Products
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {exampleQueries.map((q, i) => (
          <button 
            key={i}
            onClick={() => { setQuery(q); onFindProducts(q); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-muted hover:border-primary hover:text-primary transition"
          >
            {q}
          </button>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-xl font-bold text-foreground mb-6">Recommended for You</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {recommendations.map((rec, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg overflow-hidden">
                      <img src={rec.product.image} alt={rec.product.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{rec.product.name}</h4>
                      <p className="text-sm text-muted">{rec.product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{rec.matchPercent}%</div>
                    <div className="text-xs text-muted">Match</div>
                  </div>
                </div>
                <p className="text-sm text-muted">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Product Detail Modal
function ProductDetailModal({ product, isOpen, onClose }) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>
            <p className="text-muted">{product.tagline}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="rounded-xl overflow-hidden mb-6">
                <img src={product.image} alt={product.name} className="w-full h-auto" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-primary">{product.upvotes}</div>
                  <div className="text-xs text-muted">Upvotes</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-foreground">4.9</div>
                  <div className="text-xs text-muted">Rating</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-foreground">12K</div>
                  <div className="text-xs text-muted">Users</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-2">Features</h4>
                  <div className="space-y-2">
                    {['Easy to use', 'Great support', 'Regular updates', 'Affordable pricing'].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl font-bold text-primary">
                  {product.free ? 'Free' : `$${product.price}`}
                </div>
                {product.builtOnFounderX && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-primary text-sm font-bold flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Built on FounderX
                  </span>
                )}
              </div>

              <div className="card p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-primary text-2xl font-bold">
                    {product.founder.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{product.founder}</h4>
                    <p className="text-sm text-muted">{product.startup}</p>
                  </div>
                </div>
                <p className="text-muted text-sm">
                  {product.founder} built this product to help founders like you. They&apos;re active in the FounderX community and ready to help!
                </p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 btn-primary py-3 text-lg flex items-center justify-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Visit Product
                </button>
                <button className="btn-secondary py-3 text-lg flex items-center justify-center gap-2">
                  <Send className="h-5 w-5" />
                  Contact Founder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Launch Product Modal
function LaunchProductModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: '',
    startupName: '',
    founderName: '',
    category: '',
    price: '',
    website: '',
    tagline: '',
    description: '',
    tags: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {step === 1 ? 'Launch Your Product' : 'Confirm Your Product'}
            </h2>
            <p className="text-muted">Share your product with the FounderX community</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Product Name</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-card-border"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Startup Name</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-card-border"
                    value={formData.startupName}
                    onChange={(e) => setFormData({...formData, startupName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Founder Name</label>
                  <input 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-card-border"
                    value={formData.founderName}
                    onChange={(e) => setFormData({...formData, founderName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Category</label>
                  <select 
                    required
                    className="w-full px-4 py-2 rounded-lg border border-card-border"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="">Select</option>
                    {categories.filter(c => c !== 'All Products').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Price</label>
                  <input 
                    type="number"
                    placeholder="0 for free"
                    className="w-full px-4 py-2 rounded-lg border border-card-border"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Website</label>
                <input 
                  type="url"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-card-border"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Short Tagline</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-card-border"
                  value={formData.tagline}
                  onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted mb-2">Full Description</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-card-border"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Product Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary">
                    <Upload className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">Click to upload</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Demo Video</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary">
                    <Video className="h-8 w-8 text-muted mx-auto mb-2" />
                    <p className="text-sm text-muted">Click to upload</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="btn-secondary px-6 py-2">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2">Continue</button>
              </div>
            </form>
          ) : (
            <div>
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-bold text-foreground mb-4">{formData.productName}</h3>
                <p className="text-muted mb-4">{formData.tagline}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted">Startup:</span> <span className="font-medium">{formData.startupName}</span>
                  </div>
                  <div>
                    <span className="text-muted">Founder:</span> <span className="font-medium">{formData.founderName}</span>
                  </div>
                  <div>
                    <span className="text-muted">Category:</span> <span className="font-medium">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-muted">Price:</span> <span className="font-medium">{formData.price == 0 ? 'Free' : `$${formData.price}`}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 font-medium">
                  Do you want to launch this product on FounderX Shop?
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary px-6 py-2">Edit</button>
                <button onClick={() => { alert('Product launched successfully! '); onClose(); }} className="btn-primary px-6 py-2 flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Launch Product
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Product Section Component
function ProductSection({ title, products, icon: Icon, onViewDetails }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onViewDetails={() => onViewDetails(product)} 
          />
        ))}
      </div>
    </section>
  );
}

// Main Page
export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = demoProducts.filter(p => {
    const matchesCategory = selectedCategory === 'All Products' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAIFind = (query) => {
    setAiRecommendations([
      { product: demoProducts[0], matchPercent: 96, reason: 'Perfect match for your search query about pitch decks and templates.' },
      { product: demoProducts[1], matchPercent: 89, reason: 'Great AI tool that complements your search.' },
      { product: demoProducts[7], matchPercent: 82, reason: 'Useful productivity tools for founders like you.' }
    ]);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Discover Products Built by
            <br />
            <span className="gradient-text">Founders.</span>
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto mb-10">
            Explore startup products, SaaS tools, AI apps, templates, courses, and digital products created by the FounderX community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="btn-primary inline-flex items-center justify-center px-8 py-3 text-lg">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Explore Products
            </button>
            <button 
              onClick={() => setLaunchModalOpen(true)}
              className="btn-secondary inline-flex items-center justify-center px-8 py-3 text-lg"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Launch Your Product
            </button>
            <button 
              onClick={() => document.getElementById('ai-finder').scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center px-8 py-3 text-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              AI Product Finder
            </button>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          {/* Featured Product */}
          <FeaturedProduct product={demoProducts[2]} />

          {/* AI Product Finder */}
          <section id="ai-finder">
            <AIProductFinder onFindProducts={handleAIFind} recommendations={aiRecommendations} />
          </section>

          {/* Search & Categories */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
                <input 
                  type="text"
                  placeholder="Search products, tools, templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-card-border bg-white text-foreground"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-200 text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Sections */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">No products match your filters</h2>
              <p className="text-muted text-sm mb-4">Try adjusting your search or exploring these categories:</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['AI Tools', 'SaaS', 'Templates', 'Founder Tools'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSearchQuery(''); }}
                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => { setSelectedCategory('All Products'); setSearchQuery(''); }}
                  className="btn-secondary px-6 py-2"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setLaunchModalOpen(true)}
                  className="btn-primary px-6 py-2 flex items-center justify-center gap-2 mx-auto sm:mx-0"
                >
                  <Rocket className="h-4 w-4" />
                  Launch Your First Product
                </button>
              </div>
            </div>
          ) : (
            <>
              <ProductSection 
                title="Trending Today" 
                products={filteredProducts.slice(0, 4)} 
                icon={TrendingUp}
                onViewDetails={handleViewDetails}
              />
              <ProductSection 
                title="New Launches" 
                products={filteredProducts.slice(4, 8)} 
                icon={Newspaper}
                onViewDetails={handleViewDetails}
              />
              <ProductSection 
                title="AI Products" 
                products={filteredProducts.filter(p => p.category === 'AI Tools').slice(0, 4)} 
                icon={Brain}
                onViewDetails={handleViewDetails}
              />
              <ProductSection 
                title="Founder Picks" 
                products={filteredProducts.slice(8, 12)} 
                icon={Star}
                onViewDetails={handleViewDetails}
              />
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      <ProductDetailModal 
        product={selectedProduct}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
      />
      <LaunchProductModal 
        isOpen={launchModalOpen}
        onClose={() => setLaunchModalOpen(false)}
      />
    </div>
  );
}
