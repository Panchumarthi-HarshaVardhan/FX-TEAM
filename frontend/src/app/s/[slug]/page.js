import { notFound } from 'next/navigation';
import PublicStartupView from '../../../components/startup/PublicStartupView';

async function getStartup(slug) {
  try {
    const res = await fetch(`http://localhost:3000/api/startups/${slug}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      return null;
    }
    
    const data = await res.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching startup:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const startup = await getStartup(slug);
  
  if (!startup) {
    return {
      title: 'Startup Not Found | FounderX'
    };
  }
  
  return {
    title: `${startup.name} | FounderX`,
    description: startup.oneLinePitch || startup.description?.substring(0, 160) || `Check out ${startup.name} on FounderX.`,
    openGraph: {
      title: `${startup.name} - ${startup.oneLinePitch}`,
      description: startup.description,
      images: [startup.logo || '/default-startup.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: startup.name,
      description: startup.oneLinePitch,
      images: [startup.logo || '/default-startup.png'],
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const startup = await getStartup(slug);
  
  if (!startup) {
    notFound();
  }

  return <PublicStartupView startup={startup} />;
}
