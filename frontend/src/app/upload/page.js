'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Film,
  Image as ImageIcon,
  Play,
  X,
  Loader,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Send,
  Eye,
  Layers,
  Sparkle
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '@/utils/api';

export default function UploadPage() {
  const { user, token, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Progress & Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [analyzingSuccess, setAnalyzingSuccess] = useState(false);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);


  useEffect(() => {
    if (!authLoading && !user) {
      addToast('Please login to upload pitch videos', 'error');
      router.push('/auth/login');
    }
  }, [authLoading, user, router, addToast]);

  useEffect(() => {
    if (videoFile) {
      const previewUrl = URL.createObjectURL(videoFile);
      setVideoPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [videoFile]);

  useEffect(() => {
    if (thumbnailFile) {
      const previewUrl = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [thumbnailFile]);

  const validateVideo = (file) => {
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      addToast('Video size must be less than 2GB', 'error');
      return false;
    }
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid file format. Supports MP4, MOV, WEBM.', 'error');
      return false;
    }
    return true;
  };

  const validateImage = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      addToast('Thumbnail size must be less than 10MB', 'error');
      return false;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid thumbnail format. Supports JPG, PNG, WEBP.', 'error');
      return false;
    }
    return true;
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateVideo(file)) {
      setVideoFile(file);
      // Auto fill title from file name
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      setThumbnailFile(file);
    }
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateVideo(file)) {
      setVideoFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateImage(file)) {
      setThumbnailFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!videoFile) {
      addToast('Please select a video file', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('Please enter a video title', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('tags', tags.trim());
    formData.append('video', videoFile);
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    // Interval to simulate upload progress loops
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 400);

    try {
      const res = await fetch(`${API_URL}/api/videos/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.success) {
        addToast('Video uploaded successfully!', 'success');
        setUploadedVideo(data.data);
      } else {
        addToast(data.error || 'Failed to upload video', 'error');
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Error uploading video:', err);
      addToast('Error uploading video', 'error');
    } finally {
      setUploading(false);
    }
  };

  // SUCCESS ACTIONS FLOWS
  const handleAnalyzePitchSuccessFlow = async () => {
    if (!uploadedVideo) return;
    setAnalyzingSuccess(true);
    addToast('AI Coach is evaluating pitch and product metadata...', 'info');

    try {
      const res = await fetch(`${API_URL}/api/videos/${uploadedVideo._id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        addToast('AI Analysis generated successfully!', 'success');
        router.push(`/foundertv/${uploadedVideo._id}`);
      } else {
        addToast(data.error || 'Failed to analyze pitch', 'error');
        router.push(`/foundertv/${uploadedVideo._id}`);
      }
    } catch (err) {
      console.error('Error in analyze pitch flow:', err);
      addToast('Error triggering AI analysis', 'error');
      router.push(`/foundertv/${uploadedVideo._id}`);
    } finally {
      setAnalyzingSuccess(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05070D] flex items-center justify-center">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 pb-20 font-sans relative overflow-hidden">
      {/* Blurred background blobs */}
      <div className="absolute top-[10%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 relative z-10">
        
        {/* Header Back Button */}
        {!uploadedVideo && (
          <div className="mb-8">
            <button
              onClick={() => router.push('/foundertv')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition font-semibold text-sm mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to FounderTV Discover
            </button>
            <h1 className="text-3xl font-extrabold flex items-center gap-3 tracking-tight">
              <Film className="w-8 h-8 text-blue-500" />
              Publish Pitch Video
            </h1>
          </div>
        )}

        {/* UPLOAD SUCCESS ACTION CARD OVERLAY */}
        {uploadedVideo ? (
          <div className="max-w-xl mx-auto py-12">
            <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-8 backdrop-blur-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] text-center space-y-6">
              
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Startup Pitch Published!</h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Your pitch video has been synchronized live. Choose your next move below:
                </p>
              </div>

              {/* Action Buttons Panel */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => router.push(`/foundertv/${uploadedVideo._id}`)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-650 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Watch Video Pitch
                </button>

                <button
                  onClick={handleAnalyzePitchSuccessFlow}
                  disabled={analyzingSuccess}
                  className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs rounded-xl transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {analyzingSuccess ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      Analyze Pitch with AI
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push(`/foundertv/${uploadedVideo._id}`)}
                  className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs rounded-xl transition transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-blue-400" />
                  Generate Launch Post
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* FORM UPLOAD INTERFACE */
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* File drop fields */}
            <div className="space-y-6">
              
              {/* Video upload glass box */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-6 backdrop-blur-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] space-y-4">
                <h3 className="text-base font-black flex items-center gap-2 text-white">
                  <Film className="w-5 h-5 text-blue-500" />
                  Video Pitch File *
                </h3>

                {!videoFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleVideoDrop}
                    onClick={() => videoInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-white/5 rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 group"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500 group-hover:text-blue-500 transition duration-300" />
                    <p className="font-bold text-[14px] text-slate-200">Drag & drop or click to upload</p>
                    <p className="text-[11.5px] text-slate-500 mt-1">MP4, MOV, WEBM (Max 2GB)</p>
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoSelect}
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/5">
                      {videoPreview && (
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-650 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Film className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{videoFile.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => {
                            setVideoFile(null);
                            setVideoPreview(null);
                          }}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail upload box */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-6 backdrop-blur-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black flex items-center gap-2 text-white">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                    Thumbnail Overlay
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                    Optional
                  </span>
                </div>

                {!thumbnailFile ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleThumbnailDrop}
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-white/5 rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 group"
                  >
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-500 group-hover:text-purple-500 transition duration-300" />
                    <p className="font-semibold text-xs text-slate-200">Select thumbnail cover</p>
                    <p className="text-[10.5px] text-slate-500 mt-1">JPG, PNG, WEBP (Max 10MB)</p>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailSelect}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-white/5">
                      <img
                        src={thumbnailPreview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-650 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white truncate">{thumbnailFile.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {(thumbnailFile.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => {
                            setThumbnailFile(null);
                            setThumbnailPreview(null);
                          }}
                          className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COL: METADATA & CONTROL */}
            <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-6 backdrop-blur-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Video Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a punchy title for your pitch"
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none text-sm text-white placeholder-slate-600 focus:border-blue-500/50 disabled:opacity-50 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline the core problem, solution, and growth metrics..."
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none text-sm text-white placeholder-slate-600 focus:border-blue-500/50 disabled:opacity-50 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none text-xs text-white focus:border-blue-500/50 disabled:opacity-50 transition"
                  >
                    <option value="general">General</option>
                    <option value="saas">SaaS</option>
                    <option value="ai">AI</option>
                    <option value="startups">Startups</option>
                    <option value="podcasts">Podcasts</option>
                    <option value="investors">Investor Talks</option>
                    <option value="pitch">Pitch Battles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="SaaS, AI, Series-A"
                    disabled={uploading}
                    className="w-full px-4 py-3 bg-[#0B0F19] border border-white/10 rounded-xl outline-none text-xs text-white placeholder-slate-600 focus:border-blue-500/50 disabled:opacity-50 transition"
                  />
                </div>
              </div>

              {/* Progress Bar Loader */}
              {uploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Simulating secure network push...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-650 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Control */}
              <button
                onClick={handleUploadSubmit}
                disabled={!videoFile || uploading}
                className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  !videoFile || uploading
                    ? 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-650 hover:opacity-90 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)]'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin text-white" />
                    Publishing Pitch...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publish Pitch Video
                  </>
                )}
              </button>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
