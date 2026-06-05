import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import ClientAssistantWrapper from '../components/ClientAssistantWrapper';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'FounderX | The Social Platform for Founders',
  description: 'Connect with founders, investors, and discover the next big thing.',
};

import { GoogleOAuthProvider } from '@react-oauth/google';

export default function RootLayout({ children }) {
  // Use the env variable or a placeholder if missing
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '652174003011-bckggmm7noi5tavg28s07lhj384n2avf.apps.googleusercontent.com';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased transition-colors duration-300`}>
        <GoogleOAuthProvider clientId={clientId}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <SocketProvider>
                  {children}
                  <ClientAssistantWrapper />
                </SocketProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
