'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import { Image, Video, Send, Loader, Building2, User, Upload, Link as LinkIcon } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [contentType, setContentType] = useState('tweet'); // tweet, post, vtweet, video
  const [videoDuration, setVideoDuration] = useState(0); // in seconds
  const [postingAs, setPostingAs] = useState('personal'); // 'personal' or startupId
  const [category, setCategory] = useState('general');
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fetchingStartups, setFetchingStartups] = useState(false);
  const [error, setError] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Fetch user's startups if they are a founder
  useEffect(() => {
    if (user && user.role === 'founder') {
      fetchStartups();
    }
  }, [user]);

  const fetchStartups = async () => {
    try {
      setFetchingStartups(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/startups?founderId=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        const extracted = Array.isArray(data.data) ? data.data.map(item => item.startup || item) : [];
        setStartups(extracted);
      }
    } catch (err) {
      console.error('Failed to fetch startups', err);
    } finally {
      setFetchingStartups(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaUrl(''); // Reset custom URL if a file is selected
    setError('');

    // Auto-detect post type based on file extension/mime-type
    if (file.type.startsWith('video/')) {
      setContentType('vtweet');
    } else {
      setContentType('post');
      setVideoDuration(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('content', content);
      formData.append('contentType', contentType);
      formData.append('category', category);
      formData.append('videoLength', videoDuration);
      
      if (postingAs !== 'personal') {
        formData.append('startupId', postingAs);
      }

      // If they selected a local file
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else if (mediaUrl) {
        // Fallback to pasted URL
        formData.append('mediaUrl', mediaUrl);
      }

      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const responseContentType = res.headers.get("content-type");
      if (responseContentType && responseContentType.includes("application/json")) {
        const data = await res.json();

        if (data.success) {
          router.push('/');
        } else {
          setError(data.error || data.message || 'Something went wrong');
        }
      } else {
        setError('Server returned non-JSON response');
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to create post: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-heading mb-6">Create New Post</h1>
            
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Post As Selector */}
              {user.role === 'founder' && startups.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-heading mb-2">Post as</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setPostingAs('personal')}
                      className={`flex items-center px-4 py-2 rounded-full border transition ${
                        postingAs === 'personal' 
                          ? 'border-primary bg-blue-50 text-primary' 
                          : 'border-gray-200 hover:bg-gray-50 text-body'
                      }`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {user.name}
                    </button>
                    {startups.map(startup => (
                      <button
                        key={startup._id}
                        type="button"
                        onClick={() => setPostingAs(startup._id)}
                        className={`flex items-center px-4 py-2 rounded-full border transition ${
                          postingAs === startup._id 
                            ? 'border-primary bg-blue-50 text-primary' 
                            : 'border-gray-200 hover:bg-gray-50 text-body'
                        }`}
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        {startup.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div>
                {/* Category Selection */}
                {(postingAs !== 'personal' || user?.role === 'founder') && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                      { id: 'general', label: 'General', icon: '📝' },
                      { id: 'update', label: 'Update', icon: '📢' },
                      { id: 'hiring', label: 'Hiring', icon: '🤝' },
                      { id: 'milestone', label: 'Milestone', icon: '🚀' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                          category === cat.id 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  placeholder="What's on your mind? Share your startup journey..."
                  rows={5}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none text-lg"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              {/* Media Upload Area */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Add Media</label>
                
                {/* Upload Buttons */}
                <div className="flex space-x-4 mb-4">
                  <label className="flex items-center justify-center px-4 py-3 rounded-xl border border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition w-full">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={handleFileSelect}
                    />
                    <Upload className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-600 font-medium">
                      Upload Image or Video
                    </span>
                  </label>
                </div>

                {/* Previews */}
                {(previewUrl || mediaUrl) && (
                  <div className="mt-2 mb-4 relative rounded-2xl overflow-hidden border border-gray-200 bg-black flex items-center justify-center max-h-80">
                    {(selectedFile?.type.startsWith('video/') || mediaUrl.match(/\.(mp4|mov|webm)$/i)) ? (
                      <video src={previewUrl || mediaUrl} className="max-h-80 w-full object-contain" controls />
                    ) : (
                      <img src={previewUrl || mediaUrl} className="max-h-80 w-full object-contain" alt="Preview" />
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl('');
                        setMediaUrl('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-650 transition"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* URL Input Fallback */}
                <div className="relative">
                  <input
                    type="url"
                    placeholder="Or paste image/video URL..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      const url = e.target.value;
                      setSelectedFile(null);
                      setPreviewUrl('');
                      
                      // Auto-detect image
                      if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                          setContentType('post');
                          setVideoDuration(0);
                      }
                      // Auto-detect video
                      else if (url.match(/\.(mp4|mov|webm)$/i)) {
                          // Create a hidden video element to check duration
                          const vid = document.createElement('video');
                          vid.src = url;
                          vid.onloadedmetadata = function() {
                              const duration = Math.round(this.duration);
                              setVideoDuration(duration);
                              
                              // Enforce 90s rule
                              if (duration >= 90) {
                                  setContentType('video');
                              } else {
                                  setContentType('vtweet');
                              }
                              vid.remove();
                          };
                          vid.onerror = function() {
                              if (contentType !== 'video') setContentType('vtweet');
                          }
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, MP4, WEBM.</p>
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-heading mb-2">Post Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setContentType('tweet')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                      contentType === 'tweet' 
                        ? 'bg-gray-100 border-gray-300 text-heading' 
                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Tweet (Text)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('post')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                      contentType === 'post' 
                        ? 'bg-blue-50 border-blue-200 text-primary' 
                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Post (Image)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('vtweet')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                      contentType === 'vtweet' 
                        ? 'bg-purple-50 border-purple-200 text-purple-600' 
                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    vTweet (Short)
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('video')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition border ${
                      contentType === 'video' 
                        ? 'bg-red-50 border-red-200 text-red-600' 
                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Watch (Long)
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {contentType === 'tweet' && "Standard text-based update (Feed only)."}
                    {contentType === 'post' && "Text with an image (Feed only)."}
                    {contentType === 'vtweet' && "Short-form video update (Feed only)."}
                    {contentType === 'video' && "Long-form content, pitches, or demos (Watch Tab only)."}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !content.trim()}
                  className={`flex items-center px-8 py-3 rounded-full font-bold text-white transition transform hover:-translate-y-0.5 shadow-md ${
                    isLoading || !content.trim() 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-primary hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? (
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <Send className="h-5 w-5 mr-2" />
                  )}
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
