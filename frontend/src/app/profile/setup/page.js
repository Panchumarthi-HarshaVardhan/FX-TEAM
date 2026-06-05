'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Navbar from '../../../components/Navbar';
import { Sparkles, MapPin, Briefcase, Plus, X, ArrowRight, Loader, CheckCircle2, User, Users, FileText, Image as ImageIcon, Link as LinkIcon, DollarSign } from 'lucide-react';

export default function ProfileSetupPage() {
  const { user, setUser, token, loading, refreshUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Unified form state for all roles
  const [formData, setFormData] = useState({
    // General
    profilePhoto: '',
    bio: '',
    skills: '',
    location: '',
    linkedin: '',
    experience: '',

    // Job Seeker
    education: '',
    resume: '',
    portfolioLink: '',
    github: '',
    preferredJobType: 'Full-time',
    expectedSalary: '',

    // Founder & Startup
    startupName: '',
    startupLogo: '',
    industry: 'Technology',
    startupStage: 'idea',
    problemStatement: '',
    solution: '',
    website: '',
    pitchDeck: '',
    fundingNeeded: '',
    teamSize: '1',

    // Investor
    investorType: 'Angel',
    investmentMin: '',
    investmentMax: '',
    preferredIndustries: '',
    portfolioCompanies: ''
  });

  // Verify auth
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    } else if (!loading && user && !user.isEmailVerified) {
      router.push('/verify-email');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const role = user.role; // 'job_seeker', 'founder', 'investor'
  const maxSteps = role === 'founder' ? 3 : 2;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      let endpoint = '';
      let payload = {};

      if (role === 'job_seeker') {
        endpoint = 'http://localhost:5000/api/profile/job-seeker';
        payload = {
          profilePhoto: formData.profilePhoto,
          bio: formData.bio,
          skills: formData.skills,
          education: formData.education,
          experience: formData.experience,
          resume: formData.resume,
          portfolioLink: formData.portfolioLink,
          github: formData.github,
          linkedin: formData.linkedin,
          location: formData.location,
          preferredJobType: formData.preferredJobType,
          expectedSalary: formData.expectedSalary
        };
      } else if (role === 'founder') {
        endpoint = 'http://localhost:5000/api/profile/founder';
        payload = {
          profilePhoto: formData.profilePhoto,
          bio: formData.bio,
          skills: formData.skills,
          experience: formData.experience,
          linkedin: formData.linkedin,
          location: formData.location,
          startupName: formData.startupName,
          startupLogo: formData.startupLogo,
          industry: formData.industry,
          startupStage: formData.startupStage,
          problemStatement: formData.problemStatement,
          solution: formData.solution,
          website: formData.website,
          pitchDeck: formData.pitchDeck,
          fundingNeeded: formData.fundingNeeded,
          teamSize: formData.teamSize
        };
      } else if (role === 'investor') {
        endpoint = 'http://localhost:5000/api/profile/investor';
        payload = {
          profilePhoto: formData.profilePhoto,
          bio: formData.bio,
          investorType: formData.investorType,
          investmentMin: formData.investmentMin,
          investmentMax: formData.investmentMax,
          preferredIndustries: formData.preferredIndustries,
          location: formData.location,
          portfolioCompanies: formData.portfolioCompanies,
          linkedin: formData.linkedin,
          website: formData.website
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        // Refresh session
        await refreshUser();

        addToast('Profile setup complete! Welcome to FounderX!', 'success');
        
        // Redirect to correct dashboard
        if (role === 'job_seeker') {
          router.push('/dashboard/job-seeker');
        } else if (role === 'founder') {
          router.push('/dashboard/founder');
        } else if (role === 'investor') {
          router.push('/dashboard/investor');
        }
      } else {
        addToast(data.error || 'Failed to complete profile setup', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error during profile setup', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isStepValid = () => {
    if (role === 'job_seeker') {
      if (step === 1) {
        return formData.bio.trim() && formData.location.trim() && formData.skills.trim();
      }
      if (step === 2) {
        return formData.education.trim() && formData.experience.trim();
      }
    }
    if (role === 'founder') {
      if (step === 1) {
        return formData.bio.trim() && formData.location.trim() && formData.skills.trim();
      }
      if (step === 2) {
        return formData.startupName.trim() && formData.industry.trim() && formData.startupStage.trim();
      }
      if (step === 3) {
        return formData.problemStatement.trim() && formData.solution.trim();
      }
    }
    if (role === 'investor') {
      if (step === 1) {
        return formData.bio.trim() && formData.location.trim() && formData.investorType.trim();
      }
      if (step === 2) {
        return formData.preferredIndustries.trim() && formData.investmentMin && formData.investmentMax;
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Ambient Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-blue-600/[0.03] blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-purple-600/[0.03] blur-[100px] pointer-events-none" />

      <Navbar />

      <main className="max-w-md w-full mx-auto px-4 pt-32 flex-1 flex flex-col justify-center relative z-10">
        
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_15px_40px_rgba(15,23,42,0.04)] space-y-6">
          
          {/* Header Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
              Step {step} of {maxSteps}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: maxSteps }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i + 1 === step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>
          </div>

          <div className="text-center pb-2">
            <h1 className="text-2xl font-black text-slate-900 capitalize">{role.replace('_', ' ')} Profile Setup</h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">Configure your workspace details to unlock FounderX</p>
          </div>

          {/* ======================================================== */}
          {/* 1. JOB SEEKER SETUP STEPS */}
          {/* ======================================================== */}
          {role === 'job_seeker' && (
            <div className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <Input 
                    label="Profile Photo URL" 
                    name="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={handleInputChange}
                    placeholder="https://example.com/photo.jpg"
                    icon={<ImageIcon className="h-4 w-4 text-slate-400" />}
                  />

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Professional Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="e.g. Front-end engineer passionate about React, Next.js and building accessible products."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 resize-none h-24"
                      maxLength={300}
                      required
                    />
                  </div>

                  <Input 
                    label="Skills (Comma Separated)" 
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="e.g. React, TypeScript, Node.js, CSS"
                    required
                  />

                  <Input 
                    label="Location" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Toronto, Canada"
                    icon={<MapPin className="h-4 w-4 text-slate-400" />}
                    required
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Input 
                    label="Education" 
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    placeholder="e.g. B.Sc. in Computer Science, Stanford University"
                    required
                  />

                  <Input 
                    label="Recent Work Experience" 
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. Software Engineer Intern at Stripe (6 months)"
                    required
                  />

                  <Input 
                    label="Resume Link (PDF/Drive)" 
                    name="resume"
                    value={formData.resume}
                    onChange={handleInputChange}
                    placeholder="https://drive.google.com/.../resume.pdf"
                    icon={<FileText className="h-4 w-4 text-slate-400" />}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="GitHub Profile" 
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="github.com/username"
                    />
                    <Input 
                      label="LinkedIn Profile" 
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Preferred Job Type</label>
                      <select
                        name="preferredJobType"
                        value={formData.preferredJobType}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 bg-white"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </select>
                    </div>
                    <Input 
                      label="Expected Salary / Stipend" 
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleInputChange}
                      placeholder="e.g. $80,000/yr"
                      icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                    />
                  </div>

                  <Input 
                    label="Portfolio / Website Link" 
                    name="portfolioLink"
                    value={formData.portfolioLink}
                    onChange={handleInputChange}
                    placeholder="https://myportfolio.com"
                    icon={<LinkIcon className="h-4 w-4 text-slate-400" />}
                  />
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. FOUNDER SETUP STEPS */}
          {/* ======================================================== */}
          {role === 'founder' && (
            <div className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <Input 
                    label="Founder Profile Photo URL" 
                    name="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={handleInputChange}
                    placeholder="https://example.com/photo.jpg"
                    icon={<ImageIcon className="h-4 w-4 text-slate-400" />}
                  />

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Founder Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="e.g. Seasoned product manager, serial entrepreneur, building AI tools for developers."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 resize-none h-24"
                      maxLength={300}
                      required
                    />
                  </div>

                  <Input 
                    label="Founder Skills (Comma Separated)" 
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    placeholder="e.g. Product Strategy, Node.js, Fundraising, Marketing"
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Founder Location" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. New York, USA"
                      icon={<MapPin className="h-4 w-4 text-slate-400" />}
                      required
                    />
                    <Input 
                      label="LinkedIn Profile" 
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <Input 
                    label="Personal Work Experience Summary" 
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="e.g. 5 yrs PM at Google, 3 yrs tech founder"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <Input 
                    label="Startup Name" 
                    name="startupName"
                    value={formData.startupName}
                    onChange={handleInputChange}
                    placeholder="e.g. Nexus AI"
                    icon={<Briefcase className="h-4 w-4 text-slate-400" />}
                    required
                  />

                  <Input 
                    label="Startup Logo URL" 
                    name="startupLogo"
                    value={formData.startupLogo}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    icon={<ImageIcon className="h-4 w-4 text-slate-400" />}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Industry</label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 bg-white"
                      >
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="SaaS">SaaS</option>
                        <option value="AI/ML">AI/ML</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Stage</label>
                      <select
                        name="startupStage"
                        value={formData.startupStage}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 bg-white"
                      >
                        <option value="idea">Idea Stage</option>
                        <option value="mvp">MVP Ready</option>
                        <option value="first_customer">First Customer</option>
                        <option value="revenue">Generating Revenue</option>
                        <option value="funded">Funded</option>
                      </select>
                    </div>
                  </div>

                  <Input 
                    label="Startup Website" 
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://nexusai.io"
                    icon={<LinkIcon className="h-4 w-4 text-slate-400" />}
                  />

                  <Input 
                    label="Pitch Deck URL" 
                    name="pitchDeck"
                    value={formData.pitchDeck}
                    onChange={handleInputChange}
                    placeholder="https://docsend.com/.../pitch"
                    icon={<FileText className="h-4 w-4 text-slate-400" />}
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Problem Statement</label>
                    <textarea
                      name="problemStatement"
                      value={formData.problemStatement}
                      onChange={handleInputChange}
                      placeholder="Detail the market pain or friction you are addressing..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 resize-none h-24"
                      maxLength={1000}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Your Solution</label>
                    <textarea
                      name="solution"
                      value={formData.solution}
                      onChange={handleInputChange}
                      placeholder="Explain your product/service and why it outcompetes others..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 resize-none h-24"
                      maxLength={1000}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Funding Needed ($)" 
                      name="fundingNeeded"
                      type="number"
                      value={formData.fundingNeeded}
                      onChange={handleInputChange}
                      placeholder="e.g. 250000"
                      icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                    />
                    <Input 
                      label="Team Size" 
                      name="teamSize"
                      type="number"
                      value={formData.teamSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 3"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. INVESTOR SETUP STEPS */}
          {/* ======================================================== */}
          {role === 'investor' && (
            <div className="space-y-5">
              {step === 1 && (
                <div className="space-y-4">
                  <Input 
                    label="Investor Photo URL" 
                    name="profilePhoto"
                    value={formData.profilePhoto}
                    onChange={handleInputChange}
                    placeholder="https://example.com/photo.jpg"
                    icon={<ImageIcon className="h-4 w-4 text-slate-400" />}
                  />

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Investor Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="e.g. Ex-Google, Angel investor focusing on AI/SaaS. Portfolio includes 10+ early-stage startups."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 resize-none h-24"
                      maxLength={300}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Investor Type</label>
                    <select
                      name="investorType"
                      value={formData.investorType}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-650 transition text-sm text-slate-900 bg-white"
                    >
                      <option value="Angel">Angel Investor</option>
                      <option value="VC">Venture Capitalist</option>
                      <option value="Accelerator">Accelerator Partner</option>
                      <option value="Family Office">Family Office Principal</option>
                      <option value="Corporate">Corporate Venture</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Location" 
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Boston, USA"
                      icon={<MapPin className="h-4 w-4 text-slate-400" />}
                      required
                    />
                    <Input 
                      label="LinkedIn Profile" 
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      label="Minimum Ticket ($)" 
                      name="investmentMin"
                      type="number"
                      value={formData.investmentMin}
                      onChange={handleInputChange}
                      placeholder="e.g. 10000"
                      icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                      required
                    />
                    <Input 
                      label="Maximum Ticket ($)" 
                      name="investmentMax"
                      type="number"
                      value={formData.investmentMax}
                      onChange={handleInputChange}
                      placeholder="e.g. 100000"
                      icon={<DollarSign className="h-4 w-4 text-slate-400" />}
                      required
                    />
                  </div>

                  <Input 
                    label="Preferred Industries (Comma Separated)" 
                    name="preferredIndustries"
                    value={formData.preferredIndustries}
                    onChange={handleInputChange}
                    placeholder="e.g. Artificial Intelligence, SaaS, Web3"
                    required
                  />

                  <Input 
                    label="Portfolio Companies (Comma Separated)" 
                    name="portfolioCompanies"
                    value={formData.portfolioCompanies}
                    onChange={handleInputChange}
                    placeholder="e.g. Stripe, Airbnb, Dropbox"
                  />

                  <Input 
                    label="Investor Website" 
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourfund.com"
                    icon={<LinkIcon className="h-4 w-4 text-slate-400" />}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Wizard Nav Controls */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step === maxSteps ? handleFinish : () => setStep(step + 1)}
              disabled={saving || !isStepValid()}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : step === maxSteps ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : null}
              <span>{saving ? 'Saving...' : step === maxSteps ? 'Complete Setup' : 'Continue'}</span>
              {step < maxSteps && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </main>

      <footer className="text-center py-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        FounderX Network © 2026
      </footer>
    </div>
  );
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <div className="relative">
        <input 
          className={`w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition text-sm text-slate-900 ${icon ? 'pl-10' : ''}`}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
