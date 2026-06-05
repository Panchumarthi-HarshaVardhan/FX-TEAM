'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import Navbar from '../../../components/Navbar';
import { X, Camera, Upload, Plus, Trash2, Loader, ArrowLeft, Save } from 'lucide-react';

export default function EditProfilePage() {
  const { user, setUser, token, loading, refreshUser } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('basics');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(null); // 'avatar' or 'cover' or null

  // Image Upload Handlers
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    bio: '',
    about: '',
    vision: '',
    story: '',
    location: '',
    website: '',
    linkedin: '',
    twitter: '',
    github: '',
    email: '',
    currentRole: '',
    industry: '',
    skills: '',
    lookingFor: [],
    roleProfileData: {},
    profileImage: null,
    coverImage: null,
    experience: []
  });

  // Sync state with user
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        tagline: user.tagline || '',
        bio: user.bio || '',
        about: user.about || '',
        vision: user.vision || '',
        story: user.story || '',
        location: typeof user.location === 'object'
          ? `${user.location.city || ''}${user.location.city && user.location.country ? ', ' : ''}${user.location.country || ''}`
          : user.location || '',
        website: user.socialLinks?.website || user.website || '',
        linkedin: user.socialLinks?.linkedin || '',
        twitter: user.socialLinks?.twitter || '',
        github: user.socialLinks?.github || '',
        email: user.socialLinks?.email || '',
        currentRole: user.currentRole || '',
        industry: user.industry || '',
        skills: user.skills ? user.skills.join(', ') : '',
        lookingFor: user.lookingFor || [],
        roleProfileData: user.roleProfile || {},
        profileImage: user.profileImage || null,
        coverImage: user.coverImage || null,
        experience: user.experience || []
      });

      // Read tab parameter client-side if present
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['basics', 'portfolio', 'professional', 'experience', 'role'].includes(tabParam)) {
          setActiveTab(tabParam);
        }
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRoleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      roleProfileData: {
        ...prev.roleProfileData,
        [field]: value
      }
    }));
  };

  const parseLocation = (str) => {
    if (!str) return {};
    const parts = str.split(',').map(s => s.trim());
    if (parts.length === 1) return { city: parts[0], country: '' };
    if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] };
    return { city: str, country: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const payload = {
        ...formData,
        skills: skillsArray,
        location: parseLocation(formData.location),
        socialLinks: {
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          github: formData.github,
          email: formData.email
        }
      };

      const res = await fetch('http://localhost:3000/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        const updatedUser = data.user || data.data;

        // Update localStorage & AuthContext
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setUser(updatedUser);

        // Refresh user
        await refreshUser();

        // Re-fetch profile from backend GET /api/users/me
        const meRes = await fetch('http://localhost:3000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        let finalUser = updatedUser;
        if (meRes.ok) {
          finalUser = await meRes.json();
          if (typeof window !== 'undefined') {
            localStorage.setItem("user", JSON.stringify(finalUser));
          }
          setUser(finalUser);
        }

        // Debug checks temporarily as requested
        console.log('--- DEBUG PROFILE SAVE (EDIT) ---');
        console.log('updatedUser:', finalUser);
        console.log('updatedUser.isProfileComplete:', finalUser?.isProfileComplete);
        console.log('updatedUser.bio:', finalUser?.bio);
        console.log('updatedUser.location:', finalUser?.location);
        console.log('--------------------------');

        addToast('Profile updated successfully!', 'success');
        router.push('/profile');
      } else {
        addToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image Upload Handlers

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    setUploadingImage(type);
    const bodyFormData = new FormData();
    bodyFormData.append('image', file);
    
    try {
      const endpoint = type === 'avatar' ? 'upload-avatar' : 'upload-cover';
      const res = await fetch(`http://localhost:3000/api/users/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyFormData
      });
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          [type === 'avatar' ? 'profileImage' : 'coverImage']: data.data
        }));
        addToast(`${type === 'avatar' ? 'Profile photo' : 'Cover image'} uploaded successfully!`, 'success');
      } else {
        addToast(data.error || 'Upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Image upload failed', 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          
          <h1 className="text-2xl font-black text-slate-900">Profile Settings</h1>
        </div>

        {/* Tab Cards Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Navigation Sidebar */}
          <div className="md:col-span-1 space-y-1">
            <SidebarTab active={activeTab === 'basics'} onClick={() => setActiveTab('basics')}>Basics</SidebarTab>
            <SidebarTab active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')}>Portfolio</SidebarTab>
            <SidebarTab active={activeTab === 'professional'} onClick={() => setActiveTab('professional')}>Professional</SidebarTab>
            <SidebarTab active={activeTab === 'experience'} onClick={() => setActiveTab('experience')}>Experience</SidebarTab>
            {user.role !== 'user' && (
              <SidebarTab active={activeTab === 'role'} onClick={() => setActiveTab('role')}>
                {user.role === 'founder' ? 'Startup Info' : 'Investor Info'}
              </SidebarTab>
            )}
          </div>

          {/* Form Content Container */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.03)] space-y-6">
              
              {activeTab === 'basics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950">Basic Information</h3>
                  
                  {/* Photo Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                          {formData.profileImage ? (
                            <img src={formData.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold text-xl">{formData.name?.[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => avatarInputRef.current?.click()}
                          className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                          disabled={uploadingImage === 'avatar'}
                        >
                          {uploadingImage === 'avatar' ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploadingImage === 'avatar' ? 'Uploading...' : 'Change Photo'}
                        </button>
                        <input 
                          ref={avatarInputRef}
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files[0], 'avatar')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Cover Banner</label>
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[3/1] bg-slate-50 flex items-center justify-center cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                        {formData.coverImage ? (
                          <>
                            <img src={formData.coverImage} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-xs font-bold flex items-center gap-1"><Camera className="h-4 w-4" /> Change Cover</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-2 text-slate-400 flex flex-col items-center">
                            <Upload className="h-5 w-5 mb-1 text-slate-400" />
                            <span className="text-[10px] font-bold">Upload Cover</span>
                          </div>
                        )}
                        {uploadingImage === 'cover' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader className="h-5 w-5 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <input 
                        ref={coverInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e.target.files[0], 'cover')}
                      />
                    </div>
                  </div>

                  <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <Input label="Headline / Bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="e.g. Founder at Nexus AI | Tech Enthusiast" maxLength={160} />
                  <Input label="Location (City, Country)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. San Francisco, USA" />
                  <Input label="Website" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://yourstartup.com" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="LinkedIn" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/..." />
                    <Input label="Twitter (X)" value={formData.twitter} onChange={e => setFormData({...formData, twitter: e.target.value})} placeholder="https://twitter.com/..." />
                    <Input label="GitHub" value={formData.github} onChange={e => setFormData({...formData, github: e.target.value})} placeholder="https://github.com/..." />
                    <Input label="Email (Public)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@yourstartup.com" />
                  </div>

                  <TextArea label="About Section" value={formData.about} onChange={e => setFormData({...formData, about: e.target.value})} rows={5} placeholder="Write a detailed description about yourself..." />
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950">Startup Vision & Story</h3>
                  <Input label="Tagline" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} placeholder="e.g. Building the future of automated pitch analysis" maxLength={100} />
                  <TextArea label="Vision & Mission" value={formData.vision} onChange={e => setFormData({...formData, vision: e.target.value})} rows={3} placeholder="Describe the big vision of what you are building..." maxLength={500} />
                  <TextArea label="Founder Story" value={formData.story} onChange={e => setFormData({...formData, story: e.target.value})} rows={6} placeholder="Share the background story of why you launched this venture..." />
                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950">Professional Details</h3>
                  <Input label="Current Role" value={formData.currentRole} onChange={e => setFormData({...formData, currentRole: e.target.value})} placeholder="e.g. CEO & Co-founder" />
                  <Input label="Industry" value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})} placeholder="e.g. Artificial Intelligence, SaaS" />
                  <Input label="Skills (comma separated)" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="e.g. React, Node.js, Fundraising, Product Strategy" />
                  
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Looking For</label>
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {['Co-founder', 'Investors', 'Mentors', 'Employees', 'Beta Testers', 'Partners'].map(opt => (
                        <label key={opt} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer hover:text-slate-950 transition">
                          <input 
                            type="checkbox" 
                            checked={formData.lookingFor.includes(opt)}
                            onChange={(e) => {
                              const newLookingFor = e.target.checked 
                                ? [...formData.lookingFor, opt]
                                : formData.lookingFor.filter(i => i !== opt);
                              setFormData({...formData, lookingFor: newLookingFor});
                            }}
                            className="rounded text-primary focus:ring-primary border-slate-300"
                          />
                          <span className="font-bold text-xs">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experience' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-950">Work Experience & Education</h3>
                    <button 
                      type="button"
                      onClick={() => setFormData({
                        ...formData, 
                        experience: [
                          { title: '', company: '', startDate: '', current: false, type: 'work' }, 
                          ...formData.experience
                        ]
                      })}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Experience
                    </button>
                  </div>

                  {formData.experience.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
                      No experience records added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.experience.map((exp, index) => (
                        <div key={index} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                          <button 
                            type="button"
                            onClick={() => {
                              const newExp = [...formData.experience];
                              newExp.splice(index, 1);
                              setFormData({...formData, experience: newExp});
                            }}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <Input 
                              label="Title / Role" 
                              value={exp.title} 
                              onChange={e => {
                                const newExp = [...formData.experience];
                                newExp[index].title = e.target.value;
                                setFormData({...formData, experience: newExp});
                              }}
                            />
                            <Input 
                              label="Company / School" 
                              value={exp.company} 
                              onChange={e => {
                                const newExp = [...formData.experience];
                                newExp[index].company = e.target.value;
                                setFormData({...formData, experience: newExp});
                              }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <Select 
                              label="Record Type"
                              value={exp.type || 'work'}
                              options={['work', 'education', 'project']}
                              onChange={e => {
                                const newExp = [...formData.experience];
                                newExp[index].type = e.target.value;
                                setFormData({...formData, experience: newExp});
                              }}
                            />
                            <div className="flex items-center mt-6">
                              <label className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={exp.current}
                                  onChange={e => {
                                    const newExp = [...formData.experience];
                                    newExp[index].current = e.target.checked;
                                    setFormData({...formData, experience: newExp});
                                  }}
                                  className="rounded text-primary focus:ring-primary border-slate-300"
                                />
                                <span className="text-xs font-bold">Currently ongoing</span>
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <Input 
                              label="Start Date" 
                              type="date"
                              value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''} 
                              onChange={e => {
                                const newExp = [...formData.experience];
                                newExp[index].startDate = e.target.value;
                                setFormData({...formData, experience: newExp});
                              }}
                            />
                            {!exp.current && (
                              <Input 
                                label="End Date" 
                                type="date"
                                value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''} 
                                onChange={e => {
                                  const newExp = [...formData.experience];
                                  newExp[index].endDate = e.target.value;
                                  setFormData({...formData, experience: newExp});
                                }}
                              />
                            )}
                          </div>
                          
                          <TextArea 
                            label="Description" 
                            value={exp.description || ''} 
                            onChange={e => {
                              const newExp = [...formData.experience];
                              newExp[index].description = e.target.value;
                              setFormData({...formData, experience: newExp});
                            }}
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'role' && user.role === 'founder' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950">Startup Profile Links</h3>
                  <Input 
                    label="Pitch Deck URL" 
                    value={formData.roleProfileData.pitchDeckUrl || ''} 
                    onChange={e => handleRoleChange('pitchDeckUrl', e.target.value)} 
                    placeholder="https://docsend.com/yourdeck"
                  />
                  <Input 
                    label="Pitch Video URL" 
                    value={formData.roleProfileData.pitchVideoUrl || ''} 
                    onChange={e => handleRoleChange('pitchVideoUrl', e.target.value)} 
                    placeholder="https://youtube.com/yourvideo"
                  />
                </div>
              )}

              {activeTab === 'role' && user.role === 'investor' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-slate-950">Investment Thesis & Availability</h3>
                  
                  {/* Open to Invest Toggle */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Availability Status</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleRoleChange('open_to_invest', true)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold transition text-xs ${
                          formData.roleProfileData.open_to_invest !== false
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Open to Invest Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('open_to_invest', false)}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-bold transition text-xs ${
                          formData.roleProfileData.open_to_invest === false
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Already Investing / Not Open
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Min Ticket Size ($)" 
                      type="number"
                      value={formData.roleProfileData.ticket_size_min !== undefined ? formData.roleProfileData.ticket_size_min : (formData.roleProfileData.ticketSize?.min || 0)} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        handleRoleChange('ticket_size_min', val);
                        handleRoleChange('ticketSize', { ...formData.roleProfileData.ticketSize, min: val });
                      }} 
                    />
                    <Input 
                      label="Max Ticket Size ($)" 
                      type="number"
                      value={formData.roleProfileData.ticket_size_max !== undefined ? formData.roleProfileData.ticket_size_max : (formData.roleProfileData.ticketSize?.max || 0)} 
                      onChange={e => {
                        const val = Number(e.target.value);
                        handleRoleChange('ticket_size_max', val);
                        handleRoleChange('ticketSize', { ...formData.roleProfileData.ticketSize, max: val });
                      }} 
                    />
                  </div>

                  <Select 
                    label="Investor Profile Type"
                    value={formData.roleProfileData.investor_type || formData.roleProfileData.investorType || 'Angel'}
                    onChange={e => {
                      handleRoleChange('investor_type', e.target.value);
                      handleRoleChange('investorType', e.target.value);
                    }}
                    options={['Angel', 'VC', 'Accelerator', 'Family Office', 'Corporate']}
                  />

                  <Input 
                    label="Preferred Industries (comma separated)" 
                    value={formData.roleProfileData.preferred_industries ? (Array.isArray(formData.roleProfileData.preferred_industries) ? formData.roleProfileData.preferred_industries.join(', ') : formData.roleProfileData.preferred_industries) : ''}
                    onChange={e => {
                      const val = e.target.value.split(',').map(s => s.trim());
                      handleRoleChange('preferred_industries', val);
                      handleRoleChange('preferredIndustries', val);
                    }}
                    placeholder="e.g. AI, SaaS, FinTech"
                  />

                  <Input 
                    label="Investment Focus" 
                    value={formData.roleProfileData.investment_focus || ''} 
                    onChange={e => handleRoleChange('investment_focus', e.target.value)} 
                    placeholder="e.g. Early stage B2B SaaS"
                  />

                  <Input 
                    label="Portfolio Count" 
                    type="number"
                    value={formData.roleProfileData.portfolio_count || 0} 
                    onChange={e => handleRoleChange('portfolio_count', Number(e.target.value))} 
                  />
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 text-xs flex items-center gap-1.5"
                >
                  {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

            </form>
          </div>

        </div>

      </main>
    </div>
  );
}

function SidebarTab({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition ${
        active 
          ? 'bg-blue-650/10 text-blue-600 font-black shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <input 
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition text-sm text-slate-900"
        {...props}
      />
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <textarea 
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition text-sm text-slate-900 resize-y"
        {...props}
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      <select 
        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-650/10 focus:border-blue-600 transition bg-white text-sm text-slate-900"
        {...props}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
