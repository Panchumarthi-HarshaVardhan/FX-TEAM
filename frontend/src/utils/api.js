export const getApiUrl = () => {
  // Check VITE_API_URL from import.meta.env first (as requested)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
  } catch (e) {}

  // Check process.env fallback
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'undefined') {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  }

  // Fallback to local hostname mapping
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.local')
    ) {
      return `http://${hostname}:3000`;
    }
  }
  return 'http://localhost:3000';
};

export const API_URL = getApiUrl();
