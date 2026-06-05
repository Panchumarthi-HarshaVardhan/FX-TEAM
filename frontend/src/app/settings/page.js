'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import Navbar from '@/components/Navbar';
import { API_URL } from '@/utils/api';
import {
  User,
  Shield,
  Eye,
  EyeOff,
  Bell,
  Palette,
  AlertTriangle,
  Loader,
  Save,
  Camera,
  AtSign,
  Mail,
  CheckCircle2,
  XCircle,
  Lock,
  Globe,
  Users,
  UserX,
  MessageSquare,
  BellRing,
  BellOff,
  Sun,
  Moon,
  Download,
  Trash2,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  Settings,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';

// ─── Toggle Switch Component ────────────────────────────────────────────────
const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-card-border last:border-0">
    <div className="pr-4">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// ─── Password Strength Indicator ────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
    return { level: 5, label: 'Very Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs mt-1 font-medium ${
        strength.level <= 1 ? 'text-red-500' :
        strength.level <= 2 ? 'text-orange-500' :
        strength.level <= 3 ? 'text-yellow-600' :
        'text-green-500'
      }`}>
        {strength.label}
      </p>
    </div>
  );
};

// ─── Main Settings Page ─────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, setUser, token, loading, logout } = useAuth();
  const { addToast } = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Account form
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    username: '',
    email: '',
    bio: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    messagePermission: 'everyone',
    showInvestmentInterests: true
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newFollower: true,
    newMessage: true,
    investorInterest: true,
    startupUpdates: true,
    weeklyDigest: false,
    marketingEmails: false
  });

  // Danger zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ─── Sidebar tabs ──────────────────────────────────────────────────────────
  const tabs = [
    { id: 'account', label: 'Account', icon: User, description: 'Profile & personal info' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password & authentication' },
    { id: 'privacy', label: 'Privacy', icon: Eye, description: 'Visibility & permissions' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & push alerts' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme & display' },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, description: 'Account deletion' }
  ];

  // ─── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // ─── Fetch settings on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data) {
            setAccountForm({
              fullName: data.fullName || data.name || user?.name || '',
              username: data.username || user?.username || '',
              email: data.email || user?.email || '',
              bio: data.bio || user?.bio || ''
            });
            if (data.privacy) {
              setPrivacySettings({
                profileVisibility: data.privacy.profileVisibility || 'public',
                messagePermission: data.privacy.messagePermission || 'everyone',
                showInvestmentInterests: data.privacy.showInvestmentInterests ?? true
              });
            }
            if (data.notifications) {
              setNotificationPrefs({
                emailNotifications: data.notifications.emailNotifications ?? true,
                pushNotifications: data.notifications.pushNotifications ?? true,
                newFollower: data.notifications.newFollower ?? true,
                newMessage: data.notifications.newMessage ?? true,
                investorInterest: data.notifications.investorInterest ?? true,
                startupUpdates: data.notifications.startupUpdates ?? true,
                weeklyDigest: data.notifications.weeklyDigest ?? false,
                marketingEmails: data.notifications.marketingEmails ?? false
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        // Populate from user context as fallback
        if (user) {
          setAccountForm({
            fullName: user.name || '',
            username: user.username || '',
            email: user.email || '',
            bio: user.bio || ''
          });
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSettings();
  }, [user, token]);

  // ─── Save Account ──────────────────────────────────────────────────────────
  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/account`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountForm)
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Account settings updated', 'success');
        setUser((prev) => ({ ...prev, ...data, name: accountForm.fullName, username: accountForm.username, bio: accountForm.bio }));
      } else {
        addToast(data.message || 'Failed to update account', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Change Password ──────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Password changed successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        addToast(data.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Save Privacy ─────────────────────────────────────────────────────────
  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/privacy`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(privacySettings)
      });
      const data = await res.json();
      if (res.ok) {
        addToast('Privacy settings updated', 'success');
      } else {
        addToast(data.message || 'Failed to update privacy settings', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ─── Save Notifications (auto-save) ───────────────────────────────────────
  const handleNotificationChange = useCallback(async (key, value) => {
    const updated = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(updated);
    try {
      await fetch(`${API_URL}/api/settings/notifications`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Failed to save notification preferences:', err);
    }
  }, [notificationPrefs, token]);

  // ─── Export Data ───────────────────────────────────────────────────────────
  const handleExportData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `founderx-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast('Data exported successfully', 'success');
      } else {
        addToast('Failed to export data', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    }
  };

  // ─── Delete Account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      addToast('Please type DELETE to confirm', 'error');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/settings/account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: deletePassword })
      });
      if (res.ok) {
        addToast('Account deleted successfully', 'success');
        logout();
      } else {
        const data = await res.json();
        addToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (err) {
      addToast('Network error. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Helper: get profile image or initial ──────────────────────────────────
  const getProfileDisplay = () => {
    const src = user?.profilePicture || user?.profileImage || user?.avatar;
    if (src && typeof src === 'string' && src.trim() !== '') {
      return { type: 'image', src };
    }
    return { type: 'initial', letter: user?.name?.[0]?.toUpperCase() || 'U' };
  };

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const profile = getProfileDisplay();

  // ─── Render Sections ──────────────────────────────────────────────────────

  const renderAccountSection = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Account Settings</h2>
          <p className="text-xs text-muted">Manage your personal information and profile details</p>
        </div>
      </div>

      {/* Profile Picture */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <label className="text-xs font-black uppercase tracking-wider text-muted block mb-4">Profile Photo</label>
        <div className="flex items-center gap-5">
          <div className="relative group">
            {profile.type === 'image' ? (
              <img
                src={profile.src}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-black border-4 border-white dark:border-slate-700 shadow-md">
                {profile.letter}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted">@{user?.username || 'username'}</p>
            <p className="text-xs text-muted mt-1 capitalize">{user?.role || 'member'}</p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Full Name */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Full Name</label>
          <input
            type="text"
            value={accountForm.fullName}
            onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Your full name"
          />
        </div>

        {/* Username */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-semibold text-sm">@</span>
            <input
              type="text"
              value={accountForm.username}
              onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="username"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Email Address</label>
          <div className="relative">
            <input
              type="email"
              value={accountForm.email}
              onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-36"
              placeholder="your@email.com"
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
              user?.isEmailVerified
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {user?.isEmailVerified ? (
                <><CheckCircle2 className="h-3.5 w-3.5" /> Verified</>
              ) : (
                <><XCircle className="h-3.5 w-3.5" /> Not Verified</>
              )}
            </span>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Bio</label>
          <textarea
            value={accountForm.bio}
            onChange={(e) => setAccountForm({ ...accountForm, bio: e.target.value.slice(0, 500) })}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            placeholder="Tell the world about yourself..."
          />
          <p className="text-xs text-muted mt-1 text-right">{accountForm.bio.length}/500</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAccount}
            disabled={saving}
            className="bg-gradient-to-r from-[#0A66C2] to-[#1DA1F2] text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Security</h2>
          <p className="text-xs text-muted">Manage your password and authentication methods</p>
        </div>
      </div>

      {/* Google Connection Badge */}
      {(user?.googleVerified || user?.googleId) && (
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-xl">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Connected via Google</p>
              <p className="text-xs text-muted mt-0.5">Your account is linked with Google</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-500 ml-auto" />
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-5">
        <label className="text-xs font-black uppercase tracking-wider text-muted block">Change Password</label>

        {/* Current Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Current Password</label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <PasswordStrength password={passwordForm.newPassword} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
            >
              {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
            <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match</p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleChangePassword}
            disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            className="bg-gradient-to-r from-[#0A66C2] to-[#1DA1F2] text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacySection = () => {
    const visibilityOptions = [
      { value: 'public', icon: Globe, label: 'Public', description: 'Anyone can see your profile and activity' },
      { value: 'connections', icon: Users, label: 'Connections Only', description: 'Only people you\'re connected with' },
      { value: 'private', icon: UserX, label: 'Private', description: 'Your profile is hidden from search' }
    ];

    const messageOptions = [
      { value: 'everyone', icon: MessageSquare, label: 'Everyone', description: 'Anyone on FounderX can message you' },
      { value: 'connections', icon: Users, label: 'Connections Only', description: 'Only your connections can message' },
      { value: 'none', icon: BellOff, label: 'No One', description: 'Disable incoming messages entirely' }
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl">
            <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground tracking-tight">Privacy</h2>
            <p className="text-xs text-muted">Control who can see your profile and reach you</p>
          </div>
        </div>

        {/* Profile Visibility */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-4">Profile Visibility</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {visibilityOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = privacySettings.profileVisibility === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPrivacySettings({ ...privacySettings, profileVisibility: opt.value })}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-card-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${isActive ? 'text-primary' : 'text-muted'}`} />
                  <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                  <p className="text-xs text-muted mt-1">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Permissions */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
          <label className="text-xs font-black uppercase tracking-wider text-muted block mb-4">Message Permissions</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {messageOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = privacySettings.messagePermission === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPrivacySettings({ ...privacySettings, messagePermission: opt.value })}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-card-border hover:border-primary/30'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${isActive ? 'text-primary' : 'text-muted'}`} />
                  <p className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                  <p className="text-xs text-muted mt-1">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Investment Interests Toggle (investors only) */}
        {user?.role === 'investor' && (
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Investment Visibility</label>
            <ToggleSwitch
              enabled={privacySettings.showInvestmentInterests}
              onChange={(val) => setPrivacySettings({ ...privacySettings, showInvestmentInterests: val })}
              label="Show Investment Interests"
              description="Allow others to see the types of startups you're interested in investing"
            />
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSavePrivacy}
            disabled={saving}
            className="bg-gradient-to-r from-[#0A66C2] to-[#1DA1F2] text-white font-bold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Save Privacy Settings
          </button>
        </div>
      </div>
    );
  };

  const renderNotificationsSection = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl">
          <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Notifications</h2>
          <p className="text-xs text-muted">Choose how and when you want to be notified</p>
        </div>
      </div>

      {/* General */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <BellRing className="h-4 w-4 text-primary" />
          <label className="text-xs font-black uppercase tracking-wider text-muted">General</label>
        </div>
        <ToggleSwitch
          enabled={notificationPrefs.emailNotifications}
          onChange={(val) => handleNotificationChange('emailNotifications', val)}
          label="Email Notifications"
          description="Receive notifications via email"
        />
        <ToggleSwitch
          enabled={notificationPrefs.pushNotifications}
          onChange={(val) => handleNotificationChange('pushNotifications', val)}
          label="Push Notifications"
          description="Receive browser push notifications"
        />
      </div>

      {/* Activity */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-amber-500" />
          <label className="text-xs font-black uppercase tracking-wider text-muted">Activity</label>
        </div>
        <ToggleSwitch
          enabled={notificationPrefs.newFollower}
          onChange={(val) => handleNotificationChange('newFollower', val)}
          label="New Follower"
          description="When someone follows your profile"
        />
        <ToggleSwitch
          enabled={notificationPrefs.newMessage}
          onChange={(val) => handleNotificationChange('newMessage', val)}
          label="New Message"
          description="When you receive a direct message"
        />
      </div>

      {/* Business */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <label className="text-xs font-black uppercase tracking-wider text-muted">Business</label>
        </div>
        <ToggleSwitch
          enabled={notificationPrefs.investorInterest}
          onChange={(val) => handleNotificationChange('investorInterest', val)}
          label="Investor Interest"
          description="When an investor shows interest in your startup"
        />
        <ToggleSwitch
          enabled={notificationPrefs.startupUpdates}
          onChange={(val) => handleNotificationChange('startupUpdates', val)}
          label="Startup Updates"
          description="Updates from startups you follow"
        />
      </div>

      {/* Marketing */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <label className="text-xs font-black uppercase tracking-wider text-muted">Marketing</label>
        </div>
        <ToggleSwitch
          enabled={notificationPrefs.weeklyDigest}
          onChange={(val) => handleNotificationChange('weeklyDigest', val)}
          label="Weekly Digest"
          description="A weekly summary of activity and trends"
        />
        <ToggleSwitch
          enabled={notificationPrefs.marketingEmails}
          onChange={(val) => handleNotificationChange('marketingEmails', val)}
          label="Marketing Emails"
          description="Product announcements and special offers"
        />
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-pink-500/10 to-violet-500/10 rounded-xl">
          <Palette className="h-5 w-5 text-pink-600 dark:text-pink-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Appearance</h2>
          <p className="text-xs text-muted">Customize the look and feel of your experience</p>
        </div>
      </div>

      {/* Theme Cards */}
      <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
        <label className="text-xs font-black uppercase tracking-wider text-muted block mb-4">Theme</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Mode Card */}
          <button
            onClick={() => { if (isDark) toggleTheme(); }}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${
              !isDark
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-card-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${!isDark ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Sun className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-sm font-black ${!isDark ? 'text-primary' : 'text-foreground'}`}>Light Mode</p>
                <p className="text-xs text-muted">Clean and bright</p>
              </div>
            </div>
            {/* Mini preview */}
            <div className="flex gap-2 mt-2">
              <div className="h-8 w-full rounded-lg bg-white border border-slate-200 shadow-inner" />
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0" />
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex-shrink-0" />
            </div>
            {!isDark && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            )}
          </button>

          {/* Dark Mode Card */}
          <button
            onClick={() => { if (!isDark) toggleTheme(); }}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group ${
              isDark
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-card-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <Moon className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-sm font-black ${isDark ? 'text-primary' : 'text-foreground'}`}>Dark Mode</p>
                <p className="text-xs text-muted">Easy on the eyes</p>
              </div>
            </div>
            {/* Mini preview */}
            <div className="flex gap-2 mt-2">
              <div className="h-8 w-full rounded-lg bg-slate-800 border border-slate-700 shadow-inner" />
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0" />
              <div className="h-8 w-8 rounded-lg bg-slate-700 flex-shrink-0" />
            </div>
            {isDark && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDangerSection = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground tracking-tight">Danger Zone</h2>
          <p className="text-xs text-muted">Irreversible actions — proceed with caution</p>
        </div>
      </div>

      {/* Danger Card */}
      <div className="border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 rounded-2xl p-6">
        {/* Export Data */}
        <div className="mb-8">
          <h3 className="text-sm font-black text-foreground mb-1">Export Your Data</h3>
          <p className="text-xs text-muted mb-4">Download a copy of all your data including profile, posts, startups, and connections.</p>
          <button
            onClick={handleExportData}
            className="bg-card border border-card-border text-foreground font-semibold rounded-xl px-6 py-3 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Export Data
          </button>
        </div>

        <hr className="border-red-200 dark:border-red-900/30 my-6" />

        {/* Delete Account */}
        <div>
          <h3 className="text-sm font-black text-red-600 dark:text-red-400 mb-1">Delete Account</h3>
          <p className="text-xs text-muted mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl px-6 py-3 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Trash2 className="h-5 w-5" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (initialLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    switch (activeTab) {
      case 'account': return renderAccountSection();
      case 'security': return renderSecuritySection();
      case 'privacy': return renderPrivacySection();
      case 'notifications': return renderNotificationsSection();
      case 'appearance': return renderAppearanceSection();
      case 'danger': return renderDangerSection();
      default: return renderAccountSection();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-gradient-to-br from-[#0A66C2]/10 to-[#1DA1F2]/10 rounded-xl">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Settings</h1>
            <p className="text-sm text-muted">Manage your account preferences and configuration</p>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-card border border-card-border text-muted hover:text-foreground'
                  } ${tab.id === 'danger' && !isActive ? 'text-red-500 hover:text-red-600' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden md:block md:col-span-1">
            <div className="bg-card border border-card-border rounded-2xl p-3 shadow-sm sticky top-28">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-xl text-sm cursor-pointer transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-4 border-primary font-bold'
                          : 'text-muted hover:bg-card hover:text-foreground border-l-4 border-transparent'
                      } ${tab.id === 'danger' && !isActive ? 'text-red-500 hover:text-red-500' : ''}`}
                    >
                      <Icon className={`h-4.5 w-4.5 flex-shrink-0 ${tab.id === 'danger' && !isActive ? 'text-red-400' : ''}`} />
                      <span>{tab.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Panel */}
          <div className="md:col-span-3">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* ─── Delete Confirmation Modal ──────────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false); }}
        >
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <h3 className="text-xl font-black text-foreground text-center mb-2">Delete Account</h3>
            <p className="text-sm text-muted text-center mb-6">
              This action cannot be undone. All your data will be permanently removed.
            </p>

            {/* Password Confirmation */}
            <div className="mb-4">
              <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">Enter Password</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                placeholder="Your current password"
              />
            </div>

            {/* Type DELETE to confirm */}
            <div className="mb-6">
              <label className="text-xs font-black uppercase tracking-wider text-muted block mb-2">
                Type <span className="text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                placeholder="DELETE"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteConfirmText('');
                }}
                className="flex-1 bg-card border border-card-border text-foreground font-semibold rounded-xl px-6 py-3 hover:border-primary hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== 'DELETE' || !deletePassword}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? <Loader className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
