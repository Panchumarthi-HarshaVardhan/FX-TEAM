import { notFound } from 'next/navigation';
import ProfilePageClient from './ProfilePageClient';

async function getUser(username) {
  try {
    // Assuming backend is running locally on port 5000
    // In production, use env variable
    const res = await fetch(`http://localhost:3000/api/users/handle/${username}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  // Await params first (Next.js 15+ requirement)
  const { username } = await params;
  const user = await getUser(username);
  
  if (!user) {
    return {
      title: 'User Not Found | FounderX'
    };
  }
  
  return {
    title: `${user.name} (@${user.username}) | FounderX`,
    description: user.bio || user.headline || `Check out ${user.name}'s profile on FounderX - The community for founders and investors.`,
    openGraph: {
      title: `${user.name} - ${user.role} on FounderX`,
      description: user.bio || user.headline,
      images: [user.profileImage || '/default-avatar.png'],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name} on FounderX`,
      description: user.bio || user.headline,
      images: [user.profileImage || '/default-avatar.png'],
    }
  };
}

export default async function Page({ params }) {
  const { username } = await params;
  const user = await getUser(username);
  
  if (!user) {
    notFound();
  }

  return <ProfilePageClient username={username} />;
}
