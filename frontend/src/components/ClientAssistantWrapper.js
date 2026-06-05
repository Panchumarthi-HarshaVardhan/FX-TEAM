'use client';

import dynamic from 'next/dynamic';

const FounderXAssistant = dynamic(
  () => import('./FounderXAssistant'),
  { ssr: false }
);

export default function ClientAssistantWrapper() {
  return <FounderXAssistant />;
}
