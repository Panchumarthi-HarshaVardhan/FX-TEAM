'use client';
import { API_URL } from '@/utils/api';

import { useState, useEffect, useRef } from 'react';
import Navbar from '../../../components/Navbar';
import { Loader, Heart, MessageCircle, Share2, Volume2, VolumeX, Play, Pause, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VideoFeedPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts?type=video`);
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setVideos(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to load videos', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight } = e.target;
    const index = Math.round(scrollTop / clientHeight);
    if (index !== currentVideoIndex) {
      setCurrentVideoIndex(index);
    }
  };

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentVideoIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentVideoIndex, videos]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-white" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-4">No videos yet</h2>
        <Link href="/" className="text-primary hover:underline">Go back to home</Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute top-4 left-4 z-50">
         <Link href="/" className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition">
           <ArrowLeft className="h-6 w-6" />
         </Link>
      </div>

      <div 
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        onScroll={handleScroll}
      >
        {videos.map((post, index) => (
          <VideoCard 
            key={post._id} 
            post={post} 
            isActive={index === currentVideoIndex}
            ref={el => videoRefs.current[index] = el}
          />
        ))}
      </div>
    </div>
  );
}

import React from 'react';

const VideoCard = React.forwardRef(({ post, isActive }, ref) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Local state for UI toggle
  const [isLiked, setIsLiked] = useState(false); // Placeholder for like state

  const togglePlay = () => {
    if (ref) {
      if (ref.paused) {
        ref.play();
        setIsPlaying(true);
      } else {
        ref.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (ref) ref.muted = !ref.muted;
  };

  return (
    <div className="h-full w-full snap-start relative flex items-center justify-center bg-gray-900">
      {/* Video Element */}
      <video
        ref={ref}
        src={post.mediaUrl}
        className="h-full w-full object-contain"
        loop
        playsInline
        muted={isMuted}
        onClick={togglePlay}
      />

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>

      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-6 z-20">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-gray-200 border-2 border-white mb-2 overflow-hidden">
            {post.authorId.profileImage ? (
                <img src={post.authorId.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-lg">
                    {post.authorId.name.charAt(0)}
                </div>
            )}
          </div>
        </div>

        <button className="flex flex-col items-center group">
          <div className={`p-3 rounded-full bg-gray-800/50 group-hover:bg-gray-700 transition ${isLiked ? 'text-red-500' : 'text-white'}`}>
            <Heart className={`h-8 w-8 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-sm font-medium mt-1">{post.likeCount}</span>
        </button>

        <button className="flex flex-col items-center group">
          <div className="p-3 rounded-full bg-gray-800/50 group-hover:bg-gray-700 transition text-white">
            <MessageCircle className="h-8 w-8" />
          </div>
          <span className="text-sm font-medium mt-1">{post.commentCount}</span>
        </button>

        <button className="flex flex-col items-center group">
          <div className="p-3 rounded-full bg-gray-800/50 group-hover:bg-gray-700 transition text-white">
            <Share2 className="h-8 w-8" />
          </div>
          <span className="text-sm font-medium mt-1">Share</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-16 z-20 text-white">
        <h3 className="font-bold text-lg mb-2">@{post.authorId.name}</h3>
        <p className="text-sm line-clamp-2 mb-4">{post.content}</p>
        
        {post.startupId && (
           <div className="flex items-center space-x-2 text-xs bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
             <span></span>
             <span>{post.startupId.name}</span>
           </div>
        )}
      </div>

      {/* Volume Control */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition z-30"
      >
        {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
      </button>

    </div>
  );
});
VideoCard.displayName = 'VideoCard';
